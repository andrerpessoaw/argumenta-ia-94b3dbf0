import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/redacao/")({
  head: () => ({
    meta: [
      { title: "Produção de redação | Argumenta" },
      { name: "description", content: "Escolha entre escrever sobre um tema da IA ou sobre um tema definido por você." },
      { property: "og:title", content: "Produção de redação | Argumenta" },
      { property: "og:description", content: "Tema proposto pela IA ou tema escolhido por você." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RedacaoIndex,
});

function RedacaoIndex() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Produção de redação</h1>
      <p className="mt-2 text-muted-foreground">Escolha a subcategoria de treino.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          to="/redacao/tema-ia"
          className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/40 hover:bg-accent"
        >
          <h2 className="text-xl font-semibold">Tema proposto pela IA</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            A IA gera um tema inédito no estilo ENEM sempre que você quiser.
          </p>
        </Link>
        <Link
          to="/redacao/tema-livre"
          className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/40 hover:bg-accent"
        >
          <h2 className="text-xl font-semibold">Tema escolhido por você</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Digite o tema que precisa treinar e receba a mesma correção comentada.
          </p>
        </Link>
      </div>
    </div>
  );
}
