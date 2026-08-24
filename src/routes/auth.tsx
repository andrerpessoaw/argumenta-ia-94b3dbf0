import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";


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
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setCarregando(true);
    setErro(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
      void navigate({ to: "/inicio", replace: true });
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
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

          <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse as aulas, os tutoriais e o laboratório de redação.
          </p>

          <div className="mt-6" />



          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete="current-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-brand-indigo"
                placeholder="••••••••"
              />
            </div>

            {erro ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {erro}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={carregando}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-nav text-sm font-medium text-nav-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {carregando ? "Aguarde..." : "Entrar"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            As contas são criadas pelo administrador da plataforma. Peça seu acesso a ele.
          </p>

        </div>
      </section>
    </main>
  );
}

