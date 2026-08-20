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
    const apiKey = process.env["LOVABLE_API_KEY"];

    if (!apiKey) {
      throw new Error(
        "A correção por IA está temporariamente indisponível por falta de configuração.",
      );
    }

    const { corrigirComIA } = await import("./correcao.server");
    return await corrigirComIA({ ...data, apiKey });
  });
