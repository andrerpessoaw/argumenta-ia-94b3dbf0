import { lazy, memo, Suspense } from "react";

import { formatarData, mediaCompetencias, type RedacaoRegistro } from "@/hooks/useRedacoes";
import { useModoLeve } from "@/hooks/useModoLeve";

// O gráfico (recharts) só é baixado quando realmente vai aparecer — em
// Chromebooks fracos ele nem chega a ser carregado.
const EvolucaoNotaChart = lazy(() => import("./EvolucaoNotaChart"));

export const CORES_COMPETENCIAS = ["var(--comp-1)", "var(--comp-2)", "var(--comp-3)", "var(--comp-4)", "var(--comp-5)"];

function Vazio({ texto }: { texto: string }) {
  return <p className="mt-6 text-sm text-muted-foreground">{texto}</p>;
}

export const EvolucaoNota = memo(function EvolucaoNota({ redacoes }: { redacoes: RedacaoRegistro[] }) {
  const dados = redacoes.map((r) => ({ data: formatarData(r.created_at), nota: r.nota_total }));
  const modoLeve = useModoLeve();

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold">Evolução da Nota Global</h3>
      <p className="mt-1 text-xs text-muted-foreground">Notas estimadas das suas redações (0 a 1000).</p>
      {dados.length === 0 ? (
        <Vazio texto="Envie sua primeira redação para ver a evolução da nota aqui." />
      ) : modoLeve ? (
        <ul className="mt-4 space-y-2">
          {dados.slice(-8).map((item, i) => (
            <li key={`${item.data}-${i}`} className="text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{item.data}</span>
                <span className="font-semibold">{item.nota}/1000</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-brand-cyan"
                  style={{ width: `${Math.min(100, (item.nota / 1000) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 h-56 w-full">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando gráfico...</p>}>
            <EvolucaoNotaChart dados={dados} />
          </Suspense>
        </div>
      )}
    </section>
  );
});

function Donut({ nota, cor, numero }: { nota: number; cor: string; numero: number }) {
  const raio = 26;
  const circunferencia = 2 * Math.PI * raio;
  const preenchido = Math.min(nota / 200, 1) * circunferencia;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`Competência ${numero}: ${nota} de 200`}>
        <circle cx="32" cy="32" r={raio} fill="none" stroke="var(--muted)" strokeWidth="7" />
        <circle
          cx="32"
          cy="32"
          r={raio}
          fill="none"
          stroke={cor}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${preenchido} ${circunferencia}`}
          transform="rotate(-90 32 32)"
        />
        <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--foreground)">
          {numero}
        </text>
      </svg>
      <span className="text-center text-[11px] leading-tight text-muted-foreground">
        Competência {numero}
        <br />
        <span className="font-semibold text-foreground">{nota}/200</span>
      </span>
    </div>
  );
}

export const ProgressoCompetencias = memo(function ProgressoCompetencias({
  redacoes,
}: {
  redacoes: RedacaoRegistro[];
}) {
  const medias = mediaCompetencias(redacoes);

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold">Progresso por Competência</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Média das suas notas em cada competência do ENEM ({redacoes.length}{" "}
        {redacoes.length === 1 ? "redação" : "redações"}).
      </p>
      {redacoes.length === 0 ? (
        <Vazio texto="Ainda não há redações corrigidas para calcular a média." />
      ) : (
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          {medias.map((nota, i) => (
            <Donut key={i} numero={i + 1} nota={nota} cor={CORES_COMPETENCIAS[i]} />
          ))}
        </div>
      )}
    </section>
  );
});
