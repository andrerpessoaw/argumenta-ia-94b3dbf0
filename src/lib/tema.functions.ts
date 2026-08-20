import { createServerFn } from "@tanstack/react-start";

import type { TemaGerado } from "./tema.server";
import { temaLocal } from "./temas-banco";

export type { TemaGerado };

type GerarTemaInput = { temasAnteriores?: string[] };

export const gerarTema = createServerFn({ method: "POST" })
  .inputValidator((input: GerarTemaInput | undefined) => ({
    temasAnteriores: Array.isArray(input?.temasAnteriores)
      ? input!.temasAnteriores.slice(-10).map((t) => String(t).slice(0, 200))
      : [],
  }))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];

    if (apiKey) {
      try {
        const { gerarTemaComIA } = await import("./tema.server");
        const tema = await gerarTemaComIA({ apiKey, temasAnteriores: data.temasAnteriores });
        if (tema.titulo) return tema;
      } catch (error) {
        console.error("[tema] falha na IA, usando banco local:", error);
      }
    }

    // Fallback: banco de temas local, para o estudante nunca ficar sem tema.
    return temaLocal(data.temasAnteriores);
  });
