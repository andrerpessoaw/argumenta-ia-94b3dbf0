import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { Textarea } from "@/components/ui/textarea";
import { corrigirRedacao, type CorrecaoIA } from "@/lib/correcao.functions";
import { gerarTema, type TemaGerado } from "@/lib/tema.functions";
import { supabase } from "@/integrations/supabase/client";

const TEMA_INICIAL: TemaGerado = {
  titulo: "Desafios para combater a desinformação digital no Brasil",
  eixo: "cidadania digital",
  repertorio: ["educação midiática", "algoritmos", "responsabilidade das plataformas"],
  contexto:
    "A circulação de conteúdos falsos afeta decisões coletivas e a confiança nas instituições brasileiras.",
};

const CHARS_POR_LINHA = 62;
const LINHAS_MAXIMAS_ENEM = 30;

function countWords(texto: string) {
  return texto.trim() ? texto.trim().split(/\s+/).length : 0;
}

function splitParagraphs(texto: string) {
  return texto
    .split(/\n\s*\n/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean);
}

function estimateLines(texto: string) {
  if (!texto.trim()) return 0;

  const linhasDigitadas = texto.replace(/\r/g, "").split("\n");

  return linhasDigitadas.reduce((total, linha) => {
    if (!linha.trim()) return total + 1;
    const comprimento = linha.trim().length;
    return total + Math.max(1, Math.ceil(comprimento / CHARS_POR_LINHA));
  }, 0);
}

export function EssayWorkspace({ modo }: { modo: "ia" | "livre" }) {
  const [temaAtual, setTemaAtual] = useState<TemaGerado>(TEMA_INICIAL);
  const [temaLivre, setTemaLivre] = useState("");
  const [historicoTemas, setHistoricoTemas] = useState<string[]>([TEMA_INICIAL.titulo]);
  const [gerandoTema, setGerandoTema] = useState(false);
  const [erroTema, setErroTema] = useState<string | null>(null);
  const [redacao, setRedacao] = useState("");
  const [pedirVersaoCorrigida, setPedirVersaoCorrigida] = useState(false);
  const [correcao, setCorrecao] = useState<CorrecaoIA | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const corrigir = useServerFn(corrigirRedacao);
  const novoTema = useServerFn(gerarTema);

  const textoDiferido = useDeferredValue(redacao);
  const palavras = useMemo(() => countWords(textoDiferido), [textoDiferido]);
  const paragrafos = useMemo(() => splitParagraphs(textoDiferido).length, [textoDiferido]);
  const linhas = useMemo(() => estimateLines(textoDiferido), [textoDiferido]);


  const temaEscolhido = modo === "ia" ? temaAtual.titulo : temaLivre.trim();
  const podeAvaliar = palavras >= 80 && !carregando && temaEscolhido.length > 3;

  async function handleNovoTema() {
    setGerandoTema(true);
    setErroTema(null);
    try {
      const tema = await novoTema({ data: { temasAnteriores: historicoTemas } });
      setTemaAtual(tema);
      setHistoricoTemas((atual) => [...atual, tema.titulo].slice(-10));
      setCorrecao(null);
    } catch (error) {
      setErroTema(error instanceof Error ? error.message : "Não foi possível gerar um tema agora.");
    } finally {
      setGerandoTema(false);
    }
  }

  const jaGerou = useRef(false);
  useEffect(() => {
    if (modo !== "ia" || jaGerou.current) return;
    jaGerou.current = true;
    void handleNovoTema();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo]);

  async function handleCorrigir() {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await corrigir({
        data: { tema: temaEscolhido, texto: redacao, pedirVersaoCorrigida },
      });
      setCorrecao(resultado);
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        await supabase.from("redacoes").insert({
          user_id: auth.user.id,
          tema: temaEscolhido,
          texto: redacao,
          nota_total: Math.round(resultado.notaTotal ?? 0),
          competencias: (resultado.competencias ?? []).map((c) => ({ nome: c.nome, nota: c.nota })),
          palavras,
          paragrafos,
          linhas,
        });
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível corrigir agora.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="text-foreground">
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {modo === "ia" ? "tema proposto pela IA" : "tema escolhido por você"}
              </p>
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Escreva, meça e revise sua redação no estilo ENEM.
              </h1>
            </div>

            {modo === "ia" ? (
              <button
                type="button"
                onClick={() => void handleNovoTema()}
                disabled={gerandoTema}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-5 text-sm font-medium text-card-foreground transition hover:border-primary/40 hover:bg-accent disabled:opacity-60"
              >
                {gerandoTema ? "Gerando tema..." : "Novo tema"}
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            {modo === "ia" ? (
              <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-md bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-secondary-foreground">
                    {gerandoTema ? "Gerando tema inédito" : "Tema da vez"}
                  </span>
                  <span className="text-sm text-muted-foreground">Eixo: {temaAtual.eixo}</span>
                </div>
                <h2 className="text-2xl font-semibold leading-tight">{temaAtual.titulo}</h2>
                {temaAtual.contexto ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{temaAtual.contexto}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {temaAtual.repertorio.map((item) => (
                    <span
                      key={item}
                      className="rounded-md border border-border bg-background px-3 py-1 text-sm text-muted-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                {erroTema ? <p className="mt-4 text-sm text-destructive">{erroTema}</p> : null}
              </article>
            ) : (
              <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <h2 className="text-lg font-semibold">Qual tema você quer treinar?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Escreva o tema exatamente como ele apareceria na prova.
                </p>
                <textarea
                  value={temaLivre}
                  onChange={(event) => setTemaLivre(event.target.value)}
                  rows={3}
                  placeholder="Ex.: Caminhos para reduzir a evasão escolar no Brasil"
                  className="mt-4 w-full rounded-lg border border-border bg-background p-3 text-sm leading-6 outline-none focus:border-primary"
                />
              </article>
            )}

            <aside className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Painel rápido</h2>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Palavras", value: palavras },
                  { label: "Parágrafos", value: paragrafos },
                  { label: "Linhas", value: linhas },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-background p-4">
                    <div className="text-2xl font-semibold">{item.value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
                Estimativa baseada em <strong>{CHARS_POR_LINHA} caracteres por linha</strong> e limite de{" "}
                <strong>{LINHAS_MAXIMAS_ENEM} linhas</strong> para simular a folha de redação.
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Sua redação</h2>
              <p className="text-sm text-muted-foreground">
                Separe parágrafos com uma linha em branco para melhorar a análise.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={pedirVersaoCorrigida}
                  onChange={(event) => setPedirVersaoCorrigida(event.target.checked)}
                  className="size-4 accent-[var(--color-primary)]"
                />
                Gerar versão corrigida
              </label>
              <button
                type="button"
                onClick={handleCorrigir}
                disabled={!podeAvaliar}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {carregando ? "Corrigindo..." : "Corrigir agora"}
              </button>
            </div>
          </div>

          <Textarea
            value={redacao}
            onChange={(event) => setRedacao(event.target.value)}
            placeholder="Digite sua redação aqui..."
            className="essay-textarea min-h-[520px] resize-none border-0 bg-transparent px-0 py-0 text-base leading-[2.05rem] shadow-none focus-visible:ring-0"
          />
        </article>

        <aside className="flex flex-col gap-6">
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Ritmo de escrita</h2>
              <span className="text-sm text-muted-foreground">
                {Math.min(100, Math.round((linhas / LINHAS_MAXIMAS_ENEM) * 100))}% da folha
              </span>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (linhas / LINHAS_MAXIMAS_ENEM) * 100)}%` }}
              />
            </div>

            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>
                {palavras < 80
                  ? "Escreva pelo menos 80 palavras para liberar a correção."
                  : "Sua redação já pode ser analisada."}
              </p>
              <p>
                {linhas > LINHAS_MAXIMAS_ENEM
                  ? "Seu texto pode ultrapassar o espaço da folha oficial."
                  : "O tamanho ainda cabe na folha estimada do ENEM."}
              </p>
              {modo === "livre" && temaEscolhido.length <= 3 ? (
                <p className="text-destructive">Informe o tema para liberar a correção.</p>
              ) : null}
            </div>
          </section>

          <PainelCorrecao correcao={correcao} erro={erro} />

        </aside>
      </section>
    </div>
  );
}

const PainelCorrecao = memo(function PainelCorrecao({
  correcao,
  erro,
}: {
  correcao: CorrecaoIA | null;
  erro: string | null;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Correção comentada</h2>

      {erro ? (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
          {erro}
        </div>
      ) : null}

      {!correcao ? (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-background p-4 text-sm leading-6 text-muted-foreground">
          Clique em <strong>Corrigir agora</strong> para receber avaliação geral, correções por parágrafo, tabela de
          ajustes e checklist da proposta de intervenção.
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          <div className="rounded-lg bg-secondary p-4">
            <div className="text-sm uppercase tracking-[0.12em] text-muted-foreground">1. Avaliação geral</div>
            <div className="mt-1 text-4xl font-semibold">
              {correcao.notaTotal}
              <span className="text-lg text-muted-foreground">/1000</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{correcao.avaliacaoGeral}</p>
          </div>

          <div className="space-y-3">
            {correcao.competencias?.map((competencia) => (
              <div key={competencia.nome} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium">{competencia.nome}</h3>
                  <span className="text-sm font-semibold text-primary">{competencia.nota}/200</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{competencia.comentario}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm uppercase tracking-[0.12em] text-muted-foreground">2. Correções por parágrafo</h3>
            {correcao.paragrafos?.map((paragrafo) => (
              <div key={paragrafo.titulo} className="rounded-lg border border-border bg-background p-4">
                <h4 className="font-medium">{paragrafo.titulo}</h4>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
                  {paragrafo.comentarios?.map((comentario) => (
                    <li key={comentario}>• {comentario}</li>
                  ))}
                </ul>
                {paragrafo.paragrafoIdeal ? (
                  <div className="mt-3 rounded-md bg-secondary p-3 text-sm leading-6">
                    <span className="font-medium">Parágrafo ideal: </span>
                    {paragrafo.paragrafoIdeal}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {correcao.tabela?.length ? (
            <div className="space-y-3">
              <h3 className="text-sm uppercase tracking-[0.12em] text-muted-foreground">
                3. Trecho, problema e sugestão
              </h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary text-secondary-foreground">
                    <tr>
                      <th className="p-3 font-medium">Trecho original</th>
                      <th className="p-3 font-medium">Problema</th>
                      <th className="p-3 font-medium">Sugestão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {correcao.tabela.map((linha, indice) => (
                      <tr key={`${linha.trecho}-${indice}`} className="border-t border-border align-top">
                        <td className="p-3 text-muted-foreground">{linha.trecho}</td>
                        <td className="p-3 text-muted-foreground">{linha.problema}</td>
                        <td className="p-3">{linha.sugestao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {correcao.versaoCorrigida ? (
            <div className="space-y-3">
              <h3 className="text-sm uppercase tracking-[0.12em] text-muted-foreground">4. Versão corrigida</h3>
              <div className="whitespace-pre-line rounded-lg border border-border bg-background p-4 text-sm leading-7">
                {correcao.versaoCorrigida}
              </div>
            </div>
          ) : null}

          {correcao.checklist?.length ? (
            <div className="space-y-3">
              <h3 className="text-sm uppercase tracking-[0.12em] text-muted-foreground">5. Checklist final</h3>
              <ul className="space-y-2 rounded-lg border border-border bg-background p-4 text-sm leading-6">
                {correcao.checklist.map((item) => (
                  <li key={item.item} className="flex gap-2">
                    <span className={item.ok ? "text-primary" : "text-destructive"}>{item.ok ? "✓" : "✗"}</span>
                    <span>
                      {item.item}
                      {item.observacao ? <span className="text-muted-foreground"> — {item.observacao}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
});
