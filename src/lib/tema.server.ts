import { extrairJson, pedirTextoOpenAI } from "./openai.server";

export type TemaGerado = {
  titulo: string;
  eixo: string;
  repertorio: string[];
  contexto: string;
};

const GUIA_TEMA = `
Você é um elaborador de propostas de redação no padrão ENEM.

Crie um TEMA INÉDITO (nunca cobrado literalmente), mas inspirado no estilo e no recorte
das provas antigas do ENEM (ex.: "Desafios para a formação educacional de surdos no Brasil",
"Invisibilidade e registro civil", "Manipulação do comportamento do usuário pelo controle de dados",
"Publicidade infantil", "Democratização do acesso ao cinema") e de bancos de simulados
brasileiros como Letrus, Imagine Only, Poliedro e Bernoulli.

REGRAS:
- O título deve ser uma frase nominal, começando por expressões como "Desafios para...",
  "Caminhos para...", "O papel de...", "A importância de...", "Impactos de...", sempre
  recortado à realidade brasileira.
- Tema socialmente relevante, com possibilidade de proposta de intervenção; nunca polêmico
  de forma a violar direitos humanos.
- Varie os eixos: educação, saúde, trabalho, meio ambiente, cultura, tecnologia, cidadania,
  direitos das minorias, urbanismo, ciência.
- Não repita nenhum dos temas já usados informados pelo usuário.
- Não invente dados, leis ou estatísticas. O campo "contexto" deve ser uma explicação curta
  do recorte do tema (2 a 3 frases), sem números inventados.
- O campo "repertorio" traz de 3 a 4 pistas curtas de repertório possível (áreas, conceitos,
  documentos reais amplamente conhecidos), sem números.

RESPONDA SOMENTE COM UM JSON VÁLIDO, sem markdown:
{ "titulo": "texto", "eixo": "texto curto", "repertorio": ["texto"], "contexto": "texto" }
Escreva em português do Brasil.
`;

export async function gerarTemaComIA(args: {
  apiKey: string;
  temasAnteriores: string[];
}): Promise<TemaGerado> {
  const texto = await pedirTextoOpenAI({
    apiKey: args.apiKey,
    esforco: "low",
    input: [
      { role: "system", content: GUIA_TEMA },
      {
        role: "user",
        content: `Temas já usados (não repita nem crie variações próximas):\n${
          args.temasAnteriores.length ? args.temasAnteriores.join("\n") : "(nenhum)"
        }\n\nGere um novo tema agora. Semente de variação: ${Math.random().toString(36).slice(2)}`,
      },
    ],
  });

  const tema = extrairJson<TemaGerado>(texto, "Não foi possível interpretar o tema gerado.");
  return {
    titulo: String(tema.titulo ?? "").trim(),
    eixo: String(tema.eixo ?? "").trim(),
    repertorio: Array.isArray(tema.repertorio) ? tema.repertorio.slice(0, 4).map(String) : [],
    contexto: String(tema.contexto ?? "").trim(),
  };
}
