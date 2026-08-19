import { createFileRoute, Link } from "@tanstack/react-router";

import { formatarData, useRedacoes } from "@/hooks/useRedacoes";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de Redações | Argumenta" },
      { name: "description", content: "Veja todas as redações enviadas, com temas, datas e notas estimadas." },
      { property: "og:title", content: "Histórico de Redações | Argumenta" },
      { property: "og:description", content: "Temas, datas e notas das suas redações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Historico,
});

function Historico() {
  const { redacoes, carregando } = useRedacoes();
  const lista = [...redacoes].reverse();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Histórico de Redações</h1>
      <p className="mt-2 text-muted-foreground">Suas produções corrigidas e as notas estimadas.</p>

      {carregando ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando...</p>
      ) : lista.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Você ainda não tem redações corrigidas.</p>
          <Link
            to="/redacao"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Escrever uma redação
          </Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {lista.map((r) => (
            <li key={r.id} className="flex items-center gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.tema}</p>
                <p className="text-xs text-muted-foreground">
                  Enviada em {formatarData(r.created_at)} · {r.palavras} palavras · {r.paragrafos} parágrafos ·{" "}
                  {r.linhas} linhas
                </p>
              </div>
              <span className="ml-auto rounded-full bg-brand-indigo/10 px-3 py-1 text-sm font-semibold text-brand-indigo">
                {r.nota_total}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
