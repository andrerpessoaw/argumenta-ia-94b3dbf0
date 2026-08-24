import { createFileRoute } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Argumenta | Treino e correção de redação" },
      {
        name: "description",
        content:
          "Plataforma de treino de redação ENEM: videoaulas, tutoriais, temas gerados por IA e correção comentada por competências.",
      },
      { property: "og:title", content: "Argumenta | Treino e correção de redação" },
      {
        property: "og:description",
        content: "Aprenda a redigir, treine com temas do estilo ENEM e receba correção comentada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  async function entrar() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      window.location.href = "/inicio";
      return;
    }
    window.location.href = "/auth";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-2xl space-y-6 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
          laboratório de redação
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Aprenda, escreva e receba correção no padrão ENEM.
        </h1>
        <p className="text-base leading-7 text-muted-foreground sm:text-lg">
          Videoaulas e tutoriais para aprender a redigir, temas gerados por IA ou escolhidos por você e correção
          comentada por competências.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void entrar()}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Entrar na plataforma
          </button>

        </div>
      </div>
    </main>
  );
}
