import { createFileRoute } from "@tanstack/react-router";

import { EvolucaoNota, ProgressoCompetencias } from "@/components/dashboard/Graficos";
import { useRedacoes } from "@/hooks/useRedacoes";

export const Route = createFileRoute("/_authenticated/desempenho")({
  head: () => ({
    meta: [
      { title: "Meu Desempenho | Argumenta" },
      { name: "description", content: "Acompanhe a evolução da sua nota e o progresso por competência do ENEM." },
      { property: "og:title", content: "Meu Desempenho | Argumenta" },
      { property: "og:description", content: "Evolução da nota global e progresso por competência." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Desempenho,
});

function Desempenho() {
  const { redacoes, carregando } = useRedacoes();
  const media = redacoes.length
    ? Math.round(redacoes.reduce((t, r) => t + r.nota_total, 0) / redacoes.length)
    : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Meu Desempenho</h1>
      <p className="mt-2 text-muted-foreground">
        {carregando
          ? "Carregando suas redações..."
          : redacoes.length
            ? `Média geral de ${media} pontos em ${redacoes.length} ${redacoes.length === 1 ? "redação" : "redações"}.`
            : "Envie uma redação para corrigir e acompanhar sua evolução aqui."}
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <EvolucaoNota redacoes={redacoes} />
        <ProgressoCompetencias redacoes={redacoes} />
      </div>
    </div>
  );
}
