import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type CompetenciaNota = { nome: string; nota: number };

export type RedacaoRegistro = {
  id: string;
  tema: string;
  nota_total: number;
  competencias: CompetenciaNota[];
  palavras: number;
  paragrafos: number;
  linhas: number;
  created_at: string;
};

function normalizar(row: Record<string, unknown>): RedacaoRegistro {
  const comps = Array.isArray(row.competencias) ? (row.competencias as CompetenciaNota[]) : [];
  return {
    id: String(row.id),
    tema: String(row.tema ?? ""),
    nota_total: Number(row.nota_total ?? 0),
    competencias: comps.map((c, i) => ({
      nome: String(c?.nome ?? `Competência ${i + 1}`),
      nota: Number(c?.nota ?? 0),
    })),
    palavras: Number(row.palavras ?? 0),
    paragrafos: Number(row.paragrafos ?? 0),
    linhas: Number(row.linhas ?? 0),
    created_at: String(row.created_at ?? ""),
  };
}

export function useRedacoes() {
  const [redacoes, setRedacoes] = useState<RedacaoRegistro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from("redacoes")
      .select("id, tema, nota_total, competencias, palavras, paragrafos, linhas, created_at")
      .order("created_at", { ascending: true });
    if (error) setErro(error.message);
    else {
      setErro(null);
      setRedacoes((data ?? []).map((row) => normalizar(row as Record<string, unknown>)));
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { redacoes, carregando, erro, recarregar };
}

export function formatarData(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function mediaCompetencias(redacoes: RedacaoRegistro[]) {
  const somas = [0, 0, 0, 0, 0];
  const contagens = [0, 0, 0, 0, 0];
  for (const r of redacoes) {
    r.competencias.slice(0, 5).forEach((c, i) => {
      somas[i] += c.nota;
      contagens[i] += 1;
    });
  }
  return somas.map((soma, i) => (contagens[i] ? Math.round(soma / contagens[i]) : 0));
}
