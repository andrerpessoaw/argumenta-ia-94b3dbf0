import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, NotebookPen, TrendingUp } from "lucide-react";

import { EvolucaoNota, ProgressoCompetencias } from "@/components/dashboard/Graficos";
import { formatarData, useRedacoes } from "@/hooks/useRedacoes";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início | Argumenta" },
      { name: "description", content: "Escolha entre aprender a redigir ou produzir sua redação no Argumenta." },
      { property: "og:title", content: "Início | Argumenta" },
      { property: "og:description", content: "Categorias de estudo, produção de redação e estatísticas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inicio,
});

const META_SEMANAL = 2;

function Inicio() {
  const { redacoes } = useRedacoes();
  const umaSemanaAtras = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const enviadasSemana = redacoes.filter((r) => new Date(r.created_at).getTime() >= umaSemanaAtras).length;
  const progresso = Math.min(enviadasSemana / META_SEMANAL, 1) * 100;
  const recentes = [...redacoes].reverse().slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Por onde você quer começar?</h1>
      <p className="mt-2 text-muted-foreground">Escolha uma categoria para continuar seus estudos.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Link
          to="/aprender"
          className="group flex items-start gap-4 rounded-xl border-2 border-brand-cyan/30 bg-card p-6 shadow-sm transition hover:border-brand-cyan hover:shadow-md"
        >
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-brand-cyan/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-cyan">
              Estudo
            </span>
            <h2 className="mt-3 text-xl font-semibold">Aprender a fazer uma redação</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Videoaulas e tutoriais em texto publicados pelo professor.
            </p>
          </div>
          <span className="ml-auto flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
            <BookOpen size={28} />
          </span>
        </Link>

        <Link
          to="/redacao"
          className="group flex items-start gap-4 rounded-xl border-2 border-brand-indigo/30 bg-card p-6 shadow-sm transition hover:border-brand-indigo hover:shadow-md"
        >
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-brand-indigo/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-indigo">
              Prática
            </span>
            <h2 className="mt-3 text-xl font-semibold">Produção de redação</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Escreva com tema proposto pela IA ou com um tema escolhido por você.
            </p>
          </div>
          <span className="ml-auto flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-indigo/10 text-brand-indigo">
            <NotebookPen size={28} />
          </span>
        </Link>
      </div>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Atividade Recente e Estatísticas</h2>
            <p className="mt-1 text-sm text-muted-foreground">Acompanhe sua evolução nas últimas redações.</p>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Meta da Semana: {META_SEMANAL} redações</span>
              <span className="text-muted-foreground">
                {enviadasSemana}/{META_SEMANAL}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand-indigo" style={{ width: `${progresso}%` }} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <EvolucaoNota redacoes={redacoes} />
          </div>
          <div className="lg:col-span-1">
            <ProgressoCompetencias redacoes={redacoes} />
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-base font-semibold">Últimas redações</h3>
            <p className="mt-1 text-xs text-muted-foreground">Resumo rápido dos seus envios recentes.</p>
            {recentes.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Nenhuma redação corrigida ainda.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {recentes.map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-comp-1/10 text-comp-1">
                      <TrendingUp size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.tema}</p>
                      <p className="text-xs text-muted-foreground">{formatarData(r.created_at)}</p>
                    </div>
                    <span className="ml-auto text-sm font-semibold text-brand-indigo">{r.nota_total}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/historico"
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-accent"
            >
              Ver histórico completo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
