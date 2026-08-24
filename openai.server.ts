import { streamText } from "ai";

import { createOpenAIProvider } from "./ai-gateway.server";

// Modelo real da OpenAI (api.openai.com). "gpt-4o-mini" é rápido e barato; troque
// para "gpt-4o" se precisar de respostas mais elaboradas na correção de redações.
const MODELO = "gpt-4o-mini";

type Mensagem = { role: "system" | "user"; content: string };

/**
 * Envia o prompt para a API da OpenAI em modo streaming (evita timeout
 * em respostas longas) e devolve o texto completo gerado.
 */
export async function pedirTextoOpenAI(args: {
  apiKey: string;
  input: Mensagem[];
  esforco?: "low" | "medium" | "high";
  sinal?: AbortSignal;
  formatoJson?: { nome: string; schema: Record<string, unknown> };
}): Promise<string> {
  const gateway = createOpenAIProvider(args.apiKey);
  const schemaInstruction = args.formatoJson
    ? `\n\nRetorne somente JSON válido conforme este JSON Schema: ${JSON.stringify(args.formatoJson.schema)}`
    : "";
  const systemMessage = args.input.find((mensagem) => mensagem.role === "system");
  const userMessages = args.input.filter((mensagem) => mensagem.role === "user");

  try {
    const result = streamText({
      model: gateway(MODELO),
      instructions: `${systemMessage?.content ?? ""}${schemaInstruction}`,
      messages: userMessages,
      maxRetries: 2,
      ...(args.sinal ? { abortSignal: args.sinal } : {}),
    });
    const texto = await result.text;
    if (!texto.trim()) throw new Error("A IA concluiu a análise sem gerar texto. Tente novamente.");
    return texto;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    const mensagem = error instanceof Error ? error.message : String(error);
    throw new Error(`Não foi possível concluir a correção: ${mensagem}`);
  }
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
