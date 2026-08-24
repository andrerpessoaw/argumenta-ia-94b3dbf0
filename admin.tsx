import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { GerenciarUsuarios } from "@/components/admin/GerenciarUsuarios";
import { meuAcesso } from "@/lib/usuarios.functions";



export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel do administrador | Argumenta" },
      { name: "description", content: "Publique videoaulas do YouTube e tutoriais em texto para os estudantes." },
      { property: "og:title", content: "Painel do administrador | Argumenta" },
      { property: "og:description", content: "Gerencie videoaulas e tutoriais da plataforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

type Conteudo = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  youtube_url: string | null;
  texto: string | null;
  ordem: number;
};

function Admin() {
  const { user, isAdmin, carregando } = useSessao();
  const buscarAcesso = useServerFn(meuAcesso);
  const [podeConteudos, setPodeConteudos] = useState(false);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [tipo, setTipo] = useState<"video" | "texto">("video");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [texto, setTexto] = useState("");
  const [ordem, setOrdem] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    void buscarAcesso({ data: undefined })
      .then((acesso) => setPodeConteudos(acesso.podeGerenciarConteudos))
      .catch(() => setPodeConteudos(false));
  }, [buscarAcesso]);


  async function carregar() {
    const { data } = await supabase
      .from("conteudos")
      .select("*")
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: true });
    setConteudos((data ?? []) as Conteudo[]);
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function publicar(event: React.FormEvent) {
    event.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const { error } = await supabase.from("conteudos").insert({
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        tipo,
        youtube_url: tipo === "video" ? youtubeUrl.trim() : null,
        texto: tipo === "texto" ? texto.trim() : null,
        ordem,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
      setTitulo("");
      setDescricao("");
      setYoutubeUrl("");
      setTexto("");
      setOrdem(0);
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível publicar.");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: string) {
    await supabase.from("conteudos").delete().eq("id", id);
    await carregar();
  }

  if (carregando) {
    return <p className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">Carregando...</p>;
  }

  if (!isAdmin && !podeConteudos) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Acesso restrito</h1>
        <p className="mt-2 text-muted-foreground">Esta área é exclusiva do administrador da plataforma.</p>
      </div>
    );
  }


  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Painel do administrador</h1>
      <p className="mt-2 text-muted-foreground">Publique videoaulas do YouTube e tutoriais em texto.</p>

      <form onSubmit={publicar} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="flex gap-2">
          {(["video", "texto"] as const).map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => setTipo(valor)}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                tipo === valor
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {valor === "video" ? "Videoaula" : "Tutorial em texto"}
            </button>
          ))}
        </div>

        <input
          required
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          placeholder="Título"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          placeholder="Descrição (opcional)"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />

        {tipo === "video" ? (
          <input
            required
            value={youtubeUrl}
            onChange={(event) => setYoutubeUrl(event.target.value)}
            placeholder="Link do YouTube"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        ) : (
          <textarea
            required
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            rows={8}
            placeholder="Conteúdo do tutorial"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 outline-none focus:border-primary"
          />
        )}

        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground" htmlFor="ordem">
            Ordem de exibição
          </label>
          <input
            id="ordem"
            type="number"
            value={ordem}
            onChange={(event) => setOrdem(Number(event.target.value))}
            className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

        <button
          type="submit"
          disabled={salvando}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {salvando ? "Publicando..." : "Publicar"}
        </button>
      </form>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Conteúdos publicados</h2>
        {conteudos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum conteúdo ainda.</p>
        ) : (
          conteudos.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4"
            >
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {item.tipo === "video" ? "Videoaula" : "Tutorial"} · ordem {item.ordem}
                </p>
                <h3 className="mt-1 font-medium">{item.titulo}</h3>
                {item.descricao ? <p className="text-sm text-muted-foreground">{item.descricao}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => void remover(item.id)}
                className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive transition hover:bg-destructive/10"
              >
                Remover
              </button>
            </div>
          ))
        )}
      </section>

      {isAdmin ? <GerenciarUsuarios /> : null}

    </div>
  );
}
