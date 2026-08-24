import { extrairJson, pedirTextoOpenAI } from "./openai.server";

export const GUIA_CORRECAO = `
Você é um corretor de redações do ENEM. Use como referência obrigatória as orientações
da correção modelo abaixo (feita por uma professora para o aluno André).

ORIENTAÇÕES DE REFERÊNCIA (modelo de correção):
- Estrutura obrigatória em 4 parágrafos.
- Introdução: 3 períodos — repertório, tese e fechamento do parágrafo. Objetiva, porém específica.
  O primeiro período não pode ser genérico; deve aprofundar. A tese precisa deixar claro
  qual prerrogativa/direito não está sendo garantido.
- Desenvolvimento 1 e Desenvolvimento 2: 3 períodos cada. Todo repertório (dado, lei, autor)
  deve ser conectado ao problema da tese e trazido para a realidade brasileira. Dado estatístico
  "solto" é erro. Verifique adequação do repertório (ex.: art. 6º trata de direitos sociais,
  art. 144 trata de segurança pública — citar o artigo errado é repertório inadequado).
- Conclusão: 3 períodos — (1) reafirmação da tese, curta; (2) proposta de intervenção completa;
  (3) período de fechamento.
- Proposta de intervenção deve conter: agente + detalhamento + ação + meio + finalidade.
  O detalhamento é uma explicação sobre um dos agentes e deve vir preferencialmente entre travessões
  (ex.: "cabe ao Governo Federal – órgão responsável pelas leis federais do Brasil – ...").
- Vocabulário: apontar conectivos usados de forma artificial (ex.: "mormente" apenas como abertura),
  repetição da conjunção "e" (sugerir vírgula), informalidade, erros gramaticais e de regência
  ("entre X e Y", "fazer com que" e não "fazer que"), e problemas de lógica.
- NÃO trate o compartilhamento de dados como problema em si: diferencie compartilhamento
  autorizado de compartilhamento indevido ou vazamento.
- NÃO invente dados, leis, autores ou informações. Se o estudante citar algo que você não pode
  confirmar, sinalize como "verificar", nunca crie fatos.
- Preserve as ideias do estudante; explique cada correção de forma clara, didática, objetiva e respeitosa.

O QUE ANALISAR:
clareza da introdução e da tese; qualidade e aprofundamento dos argumentos; adequação dos repertórios;
relação entre dados, tema e realidade brasileira; conectivos, vocabulário, gramática e lógica;
estrutura dos quatro parágrafos; proposta de intervenção.

RESPONDA SOMENTE COM UM JSON VÁLIDO neste formato (sem markdown, sem texto fora do JSON):
{
  "avaliacaoGeral": "texto",
  "notaTotal": 0,
  "competencias": [{ "nome": "Competência 1", "nota": 0, "comentario": "texto" }],
  "paragrafos": [{ "titulo": "Introdução", "comentarios": ["texto"], "paragrafoIdeal": "texto ou vazio" }],
  "tabela": [{ "trecho": "trecho original", "problema": "texto", "sugestao": "texto" }],
  "versaoCorrigida": "texto completo da redação reescrita, ou string vazia se não solicitada",
  "checklist": [{ "item": "Introdução com repertório, tese e fechamento", "ok": true, "observacao": "texto" }]
}
Notas por competência de 0 a 200 (múltiplos de 20) e notaTotal = soma delas.
Quando "VERSÃO CORRIGIDA SOLICITADA: sim", o campo "versaoCorrigida" é OBRIGATÓRIO e deve conter a
redação inteira reescrita (4 parágrafos completos, em texto corrido, parágrafos separados por \\n\\n),
preservando as ideias do estudante e aplicando todas as correções apontadas. Nunca devolva resumo,
comentário ou string vazia nesse caso.
O checklist deve cobrir: os 4 parágrafos, os 3 períodos de cada um, e cada elemento da proposta
de intervenção (agente, detalhamento entre travessões, ação, meio, finalidade).
Escreva tudo em português do Brasil.
`;

export type CorrecaoIA = {
  avaliacaoGeral: string;
  notaTotal: number;
  competencias: { nome: string; nota: number; comentario: string }[];
  paragrafos: { titulo: string; comentarios: string[]; paragrafoIdeal?: string }[];
  tabela: { trecho: string; problema: string; sugestao: string }[];
  versaoCorrigida?: string;
  checklist: { item: string; ok: boolean; observacao?: string }[];
};

const SCHEMA_CORRECAO: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [
    "avaliacaoGeral",
    "notaTotal",
    "competencias",
    "paragrafos",
    "tabela",
    "versaoCorrigida",
    "checklist",
  ],
  properties: {
    avaliacaoGeral: { type: "string" },
    notaTotal: { type: "number" },
    competencias: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["nome", "nota", "comentario"],
        properties: {
          nome: { type: "string" },
          nota: { type: "number" },
          comentario: { type: "string" },
        },
      },
    },
    paragrafos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["titulo", "comentarios", "paragrafoIdeal"],
        properties: {
          titulo: { type: "string" },
          comentarios: { type: "array", items: { type: "string" } },
          paragrafoIdeal: { type: ["string", "null"] },
        },
      },
    },
    tabela: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["trecho", "problema", "sugestao"],
        properties: {
          trecho: { type: "string" },
          problema: { type: "string" },
          sugestao: { type: "string" },
        },
      },
    },
    versaoCorrigida: { type: ["string", "null"] },
    checklist: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["item", "ok", "observacao"],
        properties: {
          item: { type: "string" },
          ok: { type: "boolean" },
          observacao: { type: ["string", "null"] },
        },
      },
    },
  },
};

export async function corrigirComIA(args: {
  tema: string;
  texto: string;
  pedirVersaoCorrigida: boolean;
  apiKey: string;
}): Promise<CorrecaoIA> {
  const texto = await pedirTextoOpenAI({
    apiKey: args.apiKey,
    esforco: "medium",
    formatoJson: { nome: "correcao_enem", schema: SCHEMA_CORRECAO },
    input: [
      { role: "system", content: GUIA_CORRECAO },
      {
        role: "user",
        content: `TEMA: ${args.tema}\n\nVERSÃO CORRIGIDA SOLICITADA: ${
          args.pedirVersaoCorrigida ? "sim" : "não"
        }\n\nREDAÇÃO DO ESTUDANTE:\n${args.texto}`,
      },
    ],
  });

  if (!texto.trim()) {
    throw new Error("A IA não devolveu nenhuma resposta. Tente novamente em alguns instantes.");
  }

  const correcao = extrairJson<CorrecaoIA>(texto, "Não foi possível interpretar a correção gerada.");

  // Garantia: se a versão corrigida foi pedida e o modelo não a devolveu, pedimos só ela.
  if (args.pedirVersaoCorrigida && !correcao.versaoCorrigida?.trim()) {
    const reescrita = await pedirTextoOpenAI({
      apiKey: args.apiKey,
      esforco: "medium",
      input: [
        {
          role: "system",
          content:
            "Você reescreve redações do ENEM seguindo as orientações abaixo. Responda APENAS com o texto " +
            "da redação reescrita, em 4 parágrafos separados por linha em branco, sem títulos, sem markdown " +
            "e sem comentários.\n\n" +
            GUIA_CORRECAO.split("RESPONDA SOMENTE COM UM JSON")[0],
        },
        {
          role: "user",
          content: `TEMA: ${args.tema}\n\nREDAÇÃO ORIGINAL:\n${args.texto}`,
        },
      ],
    });
    correcao.versaoCorrigida = reescrita.trim();
  }

  return correcao;
}
