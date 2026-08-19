import { createFileRoute } from "@tanstack/react-router";

import { EssayWorkspace } from "@/components/EssayWorkspace";

export const Route = createFileRoute("/_authenticated/redacao/tema-livre")({
  head: () => ({
    meta: [
      { title: "Tema livre | Argumenta" },
      { name: "description", content: "Digite o tema que você precisa treinar e receba correção comentada no padrão ENEM." },
      { property: "og:title", content: "Tema livre | Argumenta" },
      { property: "og:description", content: "Treine com o seu próprio tema e receba correção comentada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <EssayWorkspace modo="livre" />,
});
