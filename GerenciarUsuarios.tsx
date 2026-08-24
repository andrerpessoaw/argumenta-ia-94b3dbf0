import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import {
  atualizarUsuario,
  criarUsuario,
  excluirUsuario,
  listarUsuarios,
  type UsuarioGerenciado,
} from "@/lib/usuarios.functions";

const INPUT =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

export function GerenciarUsuarios() {
  const listar = useServerFn(listarUsuarios);
  const criar = useServerFn(criarUsuario);
  const atualizar = useServerFn(atualizarUsuario);
  const excluir = useServerFn(excluirUsuario);

  const [usuarios, setUsuarios] = useState<UsuarioGerenciado[]>([]);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [podeConteudos, setPodeConteudos] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setUsuarios(await listar({ data: undefined }));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar os usuários.");
    }
  }, [listar]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function enviar(event: React.FormEvent) {
    event.preventDefault();
    setSalvando(true);
    setErro(null);
    setAviso(null);
    try {
      await criar({ data: { email, senha, nome, isAdmin, podeGerenciarConteudos: podeConteudos } });
      setAviso(`Usuário criado. Repasse o e-mail ${email} e a senha definida.`);
      setEmail("");
      setNome("");
      setSenha("");
      setIsAdmin(false);
      setPodeConteudos(false);
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível criar o usuário.");
    } finally {
      setSalvando(false);
    }
  }

  async function alterar(usuario: UsuarioGerenciado, mudanca: Partial<UsuarioGerenciado>) {
    setErro(null);
    try {
      await atualizar({
        data: {
          userId: usuario.userId,
          isAdmin: mudanca.isAdmin ?? usuario.isAdmin,
          podeGerenciarConteudos: mudanca.podeGerenciarConteudos ?? usuario.podeGerenciarConteudos,
        },
      });
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível atualizar o usuário.");
    }
  }

  async function trocarSenha(usuario: UsuarioGerenciado) {
    const novaSenha = window.prompt(`Nova senha para ${usuario.email} (mínimo 6 caracteres):`);
    if (!novaSenha) return;
    setErro(null);
    try {
      await atualizar({
        data: {
          userId: usuario.userId,
          isAdmin: usuario.isAdmin,
          podeGerenciarConteudos: usuario.podeGerenciarConteudos,
          novaSenha,
        },
      });
      setAviso(`Senha de ${usuario.email} atualizada.`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível trocar a senha.");
    }
  }

  async function remover(usuario: UsuarioGerenciado) {
    if (!window.confirm(`Excluir definitivamente o usuário ${usuario.email}?`)) return;
    setErro(null);
    try {
      await excluir({ data: { userId: usuario.userId } });
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível excluir o usuário.");
    }
  }

  return (
    <section className="mt-12 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Usuários</h2>
        <p className="text-sm text-muted-foreground">
          Crie contas para outras pessoas e defina as permissões de cada uma.
        </p>
      </div>

      <form onSubmit={enviar} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="E-mail do usuário"
            className={INPUT}
          />
          <input
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Nome (opcional)"
            className={INPUT}
          />
          <input
            required
            minLength={6}
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            placeholder="Senha (mín. 6 caracteres)"
            className={INPUT}
          />
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isAdmin} onChange={(event) => setIsAdmin(event.target.checked)} />
            Administrador
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={podeConteudos}
              onChange={(event) => setPodeConteudos(event.target.checked)}
            />
            Pode gerenciar videoaulas e tutoriais
          </label>
        </div>

        {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
        {aviso ? <p className="text-sm text-muted-foreground">{aviso}</p> : null}

        <button
          type="submit"
          disabled={salvando}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {salvando ? "Criando..." : "Criar usuário"}
        </button>
      </form>

      <div className="space-y-3">
        {usuarios.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum usuário criado ainda.</p>
        ) : (
          usuarios.map((usuario) => (
            <div
              key={usuario.userId}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div>
                <p className="font-medium">{usuario.nome || usuario.email}</p>
                <p className="text-sm text-muted-foreground">{usuario.email}</p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={usuario.isAdmin}
                    onChange={(event) => void alterar(usuario, { isAdmin: event.target.checked })}
                  />
                  Admin
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={usuario.podeGerenciarConteudos}
                    onChange={(event) => void alterar(usuario, { podeGerenciarConteudos: event.target.checked })}
                  />
                  Videoaulas
                </label>
                <button
                  type="button"
                  onClick={() => void trocarSenha(usuario)}
                  className="rounded-md border border-border px-3 py-2 transition hover:bg-accent"
                >
                  Trocar senha
                </button>
                <button
                  type="button"
                  onClick={() => void remover(usuario)}
                  className="rounded-md border border-destructive/40 px-3 py-2 text-destructive transition hover:bg-destructive/10"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
