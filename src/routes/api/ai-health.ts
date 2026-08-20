import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai-health")({
  server: {
    handlers: {
      GET: async () => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ ok: false, error: "missing_key" }, { status: 500 });
        const { pedirTextoOpenAI } = await import("@/lib/openai.server");
        const text = await pedirTextoOpenAI({
          apiKey,
          input: [
            { role: "system", content: "Responda somente com a palavra OK." },
            { role: "user", content: "Teste de conexão." },
          ],
        });
        return Response.json({ ok: text.trim().toUpperCase().includes("OK") });
      },
    },
  },
});