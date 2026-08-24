import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

/** Cache simples por usuário: evita refazer a consulta de papel a cada re-render/refresh de token. */
const cacheAdmin = new Map<string, boolean>();

export function useSessao() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let ativo = true;

    function aplicar(nova: Session | null) {
      if (!ativo) return;
      const novoId = nova?.user?.id ?? null;
      // Só atualiza o estado quando a identidade muda (ignora TOKEN_REFRESHED e INITIAL_SESSION repetidos).
      if (novoId === userIdRef.current) {
        setCarregando(false);
        return;
      }
      userIdRef.current = novoId;
      setSession(nova);
      setIsAdmin(novoId ? (cacheAdmin.get(novoId) ?? false) : false);
      setCarregando(false);

      if (!novoId || cacheAdmin.has(novoId)) return;
      void supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", novoId)
        .eq("role", "admin")
        .maybeSingle()
        .then(({ data }) => {
          const admin = Boolean(data);
          cacheAdmin.set(novoId, admin);
          if (ativo && userIdRef.current === novoId) setIsAdmin(admin);
        });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, nova) => aplicar(nova));
    void supabase.auth.getSession().then(({ data }) => aplicar(data.session));

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, isAdmin, carregando };
}
