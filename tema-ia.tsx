import { createFileRoute } from "@tanstack/react-router";

import { EssayWorkspace } from "@/components/EssayWorkspace";

export const Route = createFileRoute("/_authenticated/redacao/tema-ia")({
  head: () => ({
    meta: [
      { title: "Tema da IA | Argumenta" },
      { name: "description", content: "Escreva sua redação a partir de um tema inédito gerado pela IA no estilo ENEM." },
      { property: "og:title", content: "Tema da IA | Argumenta" },
      { property: "og:description", content: "Tema inédito gerado pela IA e correção comentada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <EssayWorkspace modo="ia" />,
});
