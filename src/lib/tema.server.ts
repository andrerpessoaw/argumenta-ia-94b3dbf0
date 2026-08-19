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
  const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": args.apiKey,
    },
    body: JSON.stringify({
      model: "openai/gpt-5.6-sol",
      input: [
        { role: "system", content: GUIA_TEMA },
        {
          role: "user",
          content: `Temas já usados (não repita nem crie variações próximas):\n${
            args.temasAnteriores.length ? args.temasAnteriores.join("\n") : "(nenhum)"
          }\n\nGere um novo tema agora. Semente de variação: ${Math.random()
            .toString(36)
            .slice(2)}`,
        },
      ],
      reasoning: { effort: "low" },
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Falha ao gerar tema (${response.status}): ${detail.slice(0, 200)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let texto = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const linhas = buffer.split("\n");
    buffer = linhas.pop() ?? "";
    for (const linha of linhas) {
      const trimmed = linha.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evento = JSON.parse(payload) as { type?: string; delta?: string };
        if (evento.type === "response.output_text.delta" && typeof evento.delta === "string") {
          texto += evento.delta;
        }
      } catch {
        // chunk parcial
      }
    }
  }

  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio === -1 || fim === -1) {
    throw new Error("Não foi possível interpretar o tema gerado.");
  }

  const tema = JSON.parse(texto.slice(inicio, fim + 1)) as TemaGerado;
  return {
    titulo: String(tema.titulo ?? "").trim(),
    eixo: String(tema.eixo ?? "").trim(),
    repertorio: Array.isArray(tema.repertorio) ? tema.repertorio.slice(0, 4).map(String) : [],
    contexto: String(tema.contexto ?? "").trim(),
  };
}
