import { createServerFn } from "@tanstack/react-start";

import type { CorrecaoIA } from "./correcao.server";

export type { CorrecaoIA };

type CorrigirInput = {
  tema: string;
  texto: string;
  pedirVersaoCorrigida: boolean;
};

export const corrigirRedacao = createServerFn({ method: "POST" })
  .inputValidator((input: CorrigirInput) => {
    if (!input || typeof input.texto !== "string" || input.texto.trim().length < 200) {
      throw new Error("Escreva um texto mais longo antes de pedir a correção.");
    }
    return {
      tema: String(input.tema ?? "").slice(0, 500),
      texto: input.texto.slice(0, 20000),
      pedirVersaoCorrigida: Boolean(input.pedirVersaoCorrigida),
    };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["OPENAI_API_KEY"];

    if (apiKey) {
      try {
        const { corrigirComIA } = await import("./correcao.server");
        return await corrigirComIA({ ...data, apiKey });
      } catch (error) {
        console.error("[correcao] falha na IA, usando correção local:", error);
      }
    }

    // Fallback: correção estimada local, para o estudante nunca ficar sem retorno.
    const { corrigirLocalmente } = await import("./correcao-local");
    return corrigirLocalmente(data.tema, data.texto);
  });
