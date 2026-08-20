import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai-health")({
  server: {
    handlers: {
      GET: async () => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ ok: false, error: "missing_key" }, { status: 500 });
        const { corrigirComIA } = await import("@/lib/correcao.server");
        const result = await corrigirComIA({
          apiKey,
          tema: "Desafios para combater a desinformação digital no Brasil",
          pedirVersaoCorrigida: true,
          texto: "A Constituição Federal assegura o acesso à informação, mas a desinformação digital prejudica a cidadania brasileira. Nesse cenário, a baixa educação midiática e a atuação irresponsável de plataformas impedem a garantia desse direito. Por isso, o problema exige atenção coletiva.\n\nPrimeiramente, a ausência de formação crítica amplia a circulação de notícias falsas. Sem orientação adequada, muitos cidadãos não verificam fontes antes de compartilhar conteúdos. Assim, escolas precisam fortalecer a leitura crítica da mídia.\n\nAlém disso, plataformas digitais favorecem conteúdos de grande alcance sem transparência suficiente. Essa dinâmica pode ampliar mensagens enganosas e comprometer decisões sociais. Portanto, empresas devem aperfeiçoar mecanismos de verificação.\n\nLogo, cabe ao Ministério da Educação – órgão responsável pelas políticas educacionais – criar programas de educação midiática nas escolas, por meio de materiais e oficinas, a fim de formar cidadãos críticos. Também cabe às plataformas ampliar a transparência para reduzir a desinformação.",
        });
        return Response.json({
          ok: Boolean(result.avaliacaoGeral && result.competencias.length && result.versaoCorrigida?.trim()),
          notaTotal: result.notaTotal,
          hasVersion: Boolean(result.versaoCorrigida?.trim()),
        });
      },
    },
  },
});