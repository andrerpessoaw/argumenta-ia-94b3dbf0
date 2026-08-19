import type { CorrecaoIA } from "./correcao.server";

const CONECTIVOS = [
  "portanto","todavia","entretanto","contudo","ademais","outrossim","dessa forma","desse modo",
  "por conseguinte","em suma","logo","assim","porquanto","visto que","uma vez que","além disso",
  "por outro lado","nesse sentido","diante disso","conforme","segundo",
];

const AGENTES = ["governo","ministério","ministerio","estado","escola","mídia","midia","poder público","poder publico","ong","família","familia","município","municipio","congresso"];
const MEIOS = ["por meio de","através de","atraves de","mediante","via ","com o uso de","por intermédio","por intermedio"];
const FINALIDADES = ["a fim de","para que","com o objetivo de","com a finalidade de","de modo a","para "];

function periodos(paragrafo: string) {
  return paragrafo.split(/[.!?]+/).map((p) => p.trim()).filter((p) => p.length > 3).length;
}

function contem(texto: string, lista: string[]) {
  const t = texto.toLowerCase();
  return lista.filter((item) => t.includes(item));
}

function nota(base: number) {
  return Math.max(0, Math.min(200, Math.round(base / 20) * 20));
}

export function corrigirLocalmente(tema: string, texto: string): CorrecaoIA {
  const paragrafos = texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const palavras = texto.trim().split(/\s+/).filter(Boolean).length;
  const conectivos = contem(texto, CONECTIVOS);
  const conclusao = paragrafos[paragrafos.length - 1] ?? "";
  const agentes = contem(conclusao, AGENTES);
  const meios = contem(conclusao, MEIOS);
  const finalidades = contem(conclusao, FINALIDADES);
  const temDetalhamento = /[–—-]\s+[^–—-]{15,}\s+[–—-]/.test(conclusao);
  const temaCitado = tema
    .toLowerCase()
    .split(/\s+/)
    .filter((p) => p.length > 5)
    .some((p) => texto.toLowerCase().includes(p));

  const estrutura4 = paragrafos.length === 4;
  const periodosOk = paragrafos.every((p) => periodos(p) >= 3);

  const c1 = nota(palavras >= 200 ? 160 : palavras >= 130 ? 130 : 100);
  const c2 = nota((temaCitado ? 140 : 90) + (palavras >= 250 ? 20 : 0));
  const c3 = nota((estrutura4 ? 150 : 110) + (periodosOk ? 20 : 0));
  const c4 = nota(80 + Math.min(120, conectivos.length * 25));
  const elementos = [agentes.length > 0, meios.length > 0, finalidades.length > 0, temDetalhamento];
  const c5 = nota(40 + elementos.filter(Boolean).length * 40);

  const competencias = [
    { nome: "Competência 1", nota: c1, comentario: "Estimativa de domínio da norma culta baseada na extensão e na organização do texto. A análise detalhada de gramática depende da correção por IA." },
    { nome: "Competência 2", nota: c2, comentario: temaCitado ? "O texto retoma palavras-chave do tema, indicando aderência à proposta." : "Não identifiquei palavras-chave do tema no texto — reforce o recorte temático." },
    { nome: "Competência 3", nota: c3, comentario: estrutura4 ? "Estrutura de quatro parágrafos identificada." : `Foram identificados ${paragrafos.length} parágrafos; o modelo pede introdução, dois desenvolvimentos e conclusão.` },
    { nome: "Competência 4", nota: c4, comentario: conectivos.length ? `Conectivos identificados: ${conectivos.slice(0, 6).join(", ")}.` : "Poucos conectivos identificados — trabalhe a coesão entre períodos e parágrafos." },
    { nome: "Competência 5", nota: c5, comentario: "Proposta avaliada pela presença de agente, meio, finalidade e detalhamento entre travessões." },
  ];

  const notaTotal = competencias.reduce((soma, c) => soma + c.nota, 0);

  return {
    avaliacaoGeral:
      "Correção estimada gerada localmente (offline), porque a correção por IA está indisponível no momento. " +
      "Ela analisa estrutura, extensão, coesão e proposta de intervenção, mas não substitui a análise detalhada da IA. " +
      `Seu texto tem ${palavras} palavras e ${paragrafos.length} parágrafo(s).`,
    notaTotal,
    competencias,
    paragrafos: paragrafos.map((p, indice) => {
      const titulo =
        indice === 0 ? "Introdução" : indice === paragrafos.length - 1 ? "Conclusão" : `Desenvolvimento ${indice}`;
      const qtd = periodos(p);
      return {
        titulo,
        comentarios: [
          `${qtd} período(s) identificado(s)${qtd === 3 ? " — dentro do modelo de 3 períodos." : " — o modelo pede 3 períodos por parágrafo."}`,
          `${p.trim().split(/\s+/).length} palavras neste parágrafo.`,
        ],
        paragrafoIdeal: "",
      };
    }),
    tabela: [],
    versaoCorrigida: "",
    checklist: [
      { item: "Texto com quatro parágrafos", ok: estrutura4, observacao: `${paragrafos.length} parágrafo(s)` },
      { item: "Três períodos em cada parágrafo", ok: periodosOk },
      { item: "Proposta com agente", ok: agentes.length > 0, observacao: agentes.join(", ") },
      { item: "Detalhamento entre travessões", ok: temDetalhamento },
      { item: "Meio de execução", ok: meios.length > 0, observacao: meios.join(", ") },
      { item: "Finalidade", ok: finalidades.length > 0, observacao: finalidades.join(", ") },
    ],
  };
}
