import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type UsuarioGerenciado = {
  userId: string;
  email: string;
  nome: string | null;
  isAdmin: boolean;
  podeGerenciarConteudos: boolean;
  criadoEm: string;
};

async function garantirAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Apenas o administrador pode gerenciar usuários.");
}

export const listarUsuarios = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsuarioGerenciado[]> => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: gerenciados, error } = await supabaseAdmin
      .from("usuarios_gerenciados")
      .select("user_id, email, nome, pode_gerenciar_conteudos, created_at")
      .eq("created_by", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (gerenciados ?? []).map((item) => item.user_id);
    let admins = new Set<string>();
    if (ids.length > 0) {
      const { data: papeis } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids)
        .eq("role", "admin");
      admins = new Set((papeis ?? []).map((item) => item.user_id));
    }

    return (gerenciados ?? []).map((item) => ({
      userId: item.user_id,
      email: item.email,
      nome: item.nome,
      isAdmin: admins.has(item.user_id),
      podeGerenciarConteudos: item.pode_gerenciar_conteudos,
      criadoEm: item.created_at,
    }));
  });

type CriarInput = {
  email: string;
  senha: string;
  nome: string;
  isAdmin: boolean;
  podeGerenciarConteudos: boolean;
};

export const criarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CriarInput) => {
    const email = String(input?.email ?? "").trim().toLowerCase();
    const senha = String(input?.senha ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Informe um e-mail válido.");
    if (senha.length < 6) throw new Error("A senha precisa ter pelo menos 6 caracteres.");
    return {
      email,
      senha,
      nome: String(input?.nome ?? "").trim().slice(0, 120),
      isAdmin: Boolean(input?.isAdmin),
      podeGerenciarConteudos: Boolean(input?.podeGerenciarConteudos),
    };
  })
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: criado, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
      user_metadata: { nome: data.nome || data.email.split("@")[0] },
    });
    if (error || !criado.user) throw new Error(error?.message ?? "Não foi possível criar o usuário.");

    const novoId = criado.user.id;

    await supabaseAdmin
      .from("usuarios_gerenciados")
      .insert({
        user_id: novoId,
        created_by: context.userId,
        email: data.email,
        nome: data.nome || null,
        pode_gerenciar_conteudos: data.podeGerenciarConteudos,
      });

    if (data.isAdmin) {
      await supabaseAdmin.from("user_roles").insert({ user_id: novoId, role: "admin" });
    }

    return { ok: true as const, userId: novoId };
  });

type AtualizarInput = {
  userId: string;
  isAdmin: boolean;
  podeGerenciarConteudos: boolean;
  novaSenha?: string;
};

export const atualizarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AtualizarInput) => {
    const userId = String(input?.userId ?? "");
    if (!userId) throw new Error("Usuário inválido.");
    const novaSenha = input?.novaSenha ? String(input.novaSenha) : "";
    if (novaSenha && novaSenha.length < 6) throw new Error("A nova senha precisa ter pelo menos 6 caracteres.");
    return {
      userId,
      isAdmin: Boolean(input?.isAdmin),
      podeGerenciarConteudos: Boolean(input?.podeGerenciarConteudos),
      novaSenha,
    };
  })
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: alvo } = await supabaseAdmin
      .from("usuarios_gerenciados")
      .select("user_id")
      .eq("user_id", data.userId)
      .eq("created_by", context.userId)
      .maybeSingle();
    if (!alvo) throw new Error("Você só pode alterar usuários que criou.");

    await supabaseAdmin
      .from("usuarios_gerenciados")
      .update({ pode_gerenciar_conteudos: data.podeGerenciarConteudos })
      .eq("user_id", data.userId);

    if (data.isAdmin) {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
    } else {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
    }

    if (data.novaSenha) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        password: data.novaSenha,
      });
      if (error) throw new Error(error.message);
    }

    return { ok: true as const };
  });

export const excluirUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    const userId = String(input?.userId ?? "");
    if (!userId) throw new Error("Usuário inválido.");
    return { userId };
  })
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    if (data.userId === context.userId) throw new Error("Você não pode excluir a própria conta.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: alvo } = await supabaseAdmin
      .from("usuarios_gerenciados")
      .select("user_id")
      .eq("user_id", data.userId)
      .eq("created_by", context.userId)
      .maybeSingle();
    if (!alvo) throw new Error("Você só pode excluir usuários que criou.");

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    return { ok: true as const };
  });
