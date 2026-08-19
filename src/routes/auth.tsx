import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar | Argumenta" },
      { name: "description", content: "Acesse sua conta Argumenta para estudar e treinar redação no padrão ENEM." },
      { property: "og:title", content: "Entrar | Argumenta" },
      { property: "og:description", content: "Acesse sua conta Argumenta para estudar e treinar redação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setCarregando(true);
    setErro(null);
    setAviso(null);

    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        void navigate({ to: "/inicio", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin, data: { nome } },
        });
        if (error) throw error;
        if (data.session) {
          void navigate({ to: "/inicio", replace: true });
        } else {
          setAviso("Conta criada! Confirme seu e-mail para acessar a plataforma.");
        }
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível continuar.");
    } finally {
      setCarregando(false);
    }
  }

  async function entrarComGoogle() {
    setErro(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setErro("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/inicio", replace: true });
  }

  return (
    <main className="grid min-h-screen bg-surface text-foreground lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-nav p-10 text-nav-foreground lg:flex">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] uppercase">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan text-nav">TE</span>
          Argumenta
        </div>

        <div className="max-w-md space-y-5">
          <h2 className="text-3xl font-semibold leading-tight">
            Escreva, envie e receba uma correção comentada no padrão ENEM.
          </h2>
          <ul className="space-y-3 text-sm text-nav-muted">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan" />
              Videoaulas e tutoriais para aprender a estrutura dos quatro parágrafos.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-comp-1" />
              Temas gerados por IA no estilo ENEM — ou o tema que você quiser.
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-comp-5" />
              Nota estimada por competência, com dicas do que melhorar.
            </li>
          </ul>
        </div>

        <p className="text-xs text-nav-muted">Contagem de palavras, parágrafos e linhas da folha oficial.</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-nav text-xs font-semibold text-nav-foreground">
              TE
            </span>
            <span className="text-sm font-semibold tracking-wide">Argumenta</span>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setModo("entrar")}
              className={`h-9 rounded-lg transition ${modo === "entrar" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setModo("cadastrar")}
              className={`h-9 rounded-lg transition ${modo === "cadastrar" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              Criar conta
            </button>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            {modo === "entrar" ? "Bem-vindo de volta" : "Comece a treinar hoje"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {modo === "entrar"
              ? "Acesse as aulas, os tutoriais e o laboratório de redação."
              : "Crie sua conta gratuita e escreva sua primeira redação."}
          </p>

          <button
            type="button"
            onClick={() => void entrarComGoogle()}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium transition hover:bg-accent"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"
              />
              <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
              <path
                fill="#EA4335"
                d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
              />
            </svg>
            Continuar com Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou com e-mail
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === "cadastrar" ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="nome">
                  Nome
                </label>
                <input
                  id="nome"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-brand-indigo"
                  placeholder="Seu nome"
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-brand-indigo"
                placeholder="voce@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="senha">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                required
                minLength={6}
                autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-brand-indigo"
                placeholder="••••••••"
              />
              {modo === "cadastrar" ? (
                <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres.</p>
              ) : null}
            </div>

            {erro ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {erro}
              </p>
            ) : null}
            {aviso ? (
              <p className="rounded-lg border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-2 text-sm">{aviso}</p>
            ) : null}

            <button
              type="submit"
              disabled={carregando}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-nav text-sm font-medium text-nav-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {modo === "entrar" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
            <button
              type="button"
              onClick={() => setModo(modo === "entrar" ? "cadastrar" : "entrar")}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {modo === "entrar" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

