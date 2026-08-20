// Cliente da API global da OpenAI (api.openai.com), usada por todo o app.
// A chave fica somente no servidor, em OPENAI_API_KEY.

// Lido dentro do handler: variáveis de ambiente só existem em tempo de execução.
function modelo() {
  return process.env["OPENAI_MODEL"] || "gpt-5";
}

type Mensagem = { role: "system" | "user"; content: string };

/**
 * Envia o prompt para a Responses API da OpenAI em modo streaming (evita timeout
 * em respostas longas) e devolve o texto completo gerado.
 */
export async function pedirTextoOpenAI(args: {
  apiKey: string;
  input: Mensagem[];
  esforco?: "low" | "medium" | "high";
  sinal?: AbortSignal;
  formatoJson?: { nome: string; schema: Record<string, unknown> };
}): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: modelo(),
      input: args.input,
      reasoning: { effort: args.esforco ?? "low" },
      stream: true,
      store: false,
      ...(args.formatoJson
        ? {
            text: {
              format: {
                type: "json_schema",
                name: args.formatoJson.nome,
                strict: true,
                schema: args.formatoJson.schema,
              },
            },
          }
        : {}),
    }),
    ...(args.sinal ? { signal: args.sinal } : {}),
  });

  if (!response.ok || !response.body) {
    const detalhe = await response.text().catch(() => "");
    if (response.status === 401) {
      throw new Error(
        "A chave da OpenAI não foi aceita. Confira a chave configurada no app.",
      );
    }
    if (response.status === 429) {
      if (detalhe.includes("insufficient_quota")) {
        throw new Error(
          "A conta da OpenAI está sem créditos disponíveis. Adicione créditos em platform.openai.com (Billing) para liberar a correção.",
        );
      }
      throw new Error(
        "A OpenAI está limitando as requisições (ou os créditos acabaram). Aguarde um instante e tente de novo.",
      );
    }
    console.error("[openai] erro:", response.status, detalhe.slice(0, 300));
    throw new Error("Não foi possível falar com a IA agora. Tente novamente em alguns instantes.");
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

  return texto;
}

/** Extrai o primeiro objeto JSON válido da resposta do modelo. */
export function extrairJson<T>(texto: string, mensagemErro: string): T {
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio === -1 || fim === -1 || fim < inicio) throw new Error(mensagemErro);
  const bruto = texto.slice(inicio, fim + 1);
  try {
    return JSON.parse(bruto) as T;
  } catch {
    // Modelos às vezes emitem quebras de linha reais dentro das strings.
    try {
      return JSON.parse(escaparControlesEmStrings(bruto)) as T;
    } catch {
      throw new Error(mensagemErro);
    }
  }
}

function escaparControlesEmStrings(json: string) {
  let dentro = false;
  let escapado = false;
  let saida = "";
  for (const char of json) {
    if (escapado) {
      saida += char;
      escapado = false;
      continue;
    }
    if (char === "\\") {
      saida += char;
      escapado = dentro;
      continue;
    }
    if (char === '"') {
      dentro = !dentro;
      saida += char;
      continue;
    }
    if (dentro && char === "\n") saida += "\\n";
    else if (dentro && char === "\r") saida += "\\r";
    else if (dentro && char === "\t") saida += "\\t";
    else saida += char;
  }
  return saida;
}
