import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/aprender")({
  head: () => ({
    meta: [
      { title: "Aprender a redigir | Argumenta" },
      { name: "description", content: "Videoaulas e tutoriais em texto para aprender a estruturar a redação ENEM." },
      { property: "og:title", content: "Aprender a redigir | Argumenta" },
      { property: "og:description", content: "Videoaulas e tutoriais em texto sobre redação ENEM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Aprender,
});

export type Conteudo = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  youtube_url: string | null;
  texto: string | null;
  ordem: number;
};

export function youtubeEmbed(url: string) {
  const match = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function Aprender() {
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    void supabase
      .from("conteudos")
      .select("*")
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!ativo) return;
        setConteudos((data ?? []) as Conteudo[]);
        setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const videos = conteudos.filter((item) => item.tipo === "video");
  const textos = conteudos.filter((item) => item.tipo === "texto");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Aprender a fazer uma redação</h1>
      <p className="mt-2 text-muted-foreground">Videoaulas e tutoriais em texto publicados pelo administrador.</p>

      {carregando ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando conteúdos...</p>
      ) : conteudos.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          Ainda não há conteúdos publicados.
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Videoaulas</h2>
            {videos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma videoaula publicada ainda.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {videos.map((video) => {
                  const embed = video.youtube_url ? youtubeEmbed(video.youtube_url) : null;
                  return (
                    <article key={video.id} className="overflow-hidden rounded-xl border border-border bg-card">
                      {embed ? (
                        <div className="aspect-video w-full">
                          <iframe
                            src={embed}
                            title={video.titulo}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                            allowFullScreen
                            className="h-full w-full"
                          />
                        </div>
                      ) : null}
                      <div className="p-4">
                        <h3 className="font-semibold">{video.titulo}</h3>
                        {video.descricao ? (
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">{video.descricao}</p>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Tutoriais em texto</h2>
            {textos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum tutorial publicado ainda.</p>
            ) : (
              textos.map((tutorial) => (
                <article key={tutorial.id} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-lg font-semibold">{tutorial.titulo}</h3>
                  {tutorial.descricao ? (
                    <p className="mt-1 text-sm text-muted-foreground">{tutorial.descricao}</p>
                  ) : null}
                  {tutorial.texto ? (
                    <div className="mt-3 whitespace-pre-line text-sm leading-7">{tutorial.texto}</div>
                  ) : null}
                </article>
              ))
            )}
          </section>
        </div>
      )}
    </div>
  );
}
