GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

CREATE TABLE public.usuarios_gerenciados (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  nome text,
  pode_gerenciar_conteudos boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.usuarios_gerenciados TO authenticated;
GRANT ALL ON public.usuarios_gerenciados TO service_role;

ALTER TABLE public.usuarios_gerenciados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_gerenciados_admin_select" ON public.usuarios_gerenciados
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION private.pode_gerenciar_conteudos(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.has_role(_user_id, 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1 FROM public.usuarios_gerenciados
        WHERE user_id = _user_id AND pode_gerenciar_conteudos
      );
$$;

REVOKE ALL ON FUNCTION private.pode_gerenciar_conteudos(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.pode_gerenciar_conteudos(uuid) TO authenticated;

DROP POLICY IF EXISTS conteudos_admin_insert ON public.conteudos;
DROP POLICY IF EXISTS conteudos_admin_update ON public.conteudos;
DROP POLICY IF EXISTS conteudos_admin_delete ON public.conteudos;

CREATE POLICY "conteudos_editor_insert" ON public.conteudos
  FOR INSERT TO authenticated
  WITH CHECK (private.pode_gerenciar_conteudos(auth.uid()));

CREATE POLICY "conteudos_editor_update" ON public.conteudos
  FOR UPDATE TO authenticated
  USING (private.pode_gerenciar_conteudos(auth.uid()))
  WITH CHECK (private.pode_gerenciar_conteudos(auth.uid()));

CREATE POLICY "conteudos_editor_delete" ON public.conteudos
  FOR DELETE TO authenticated
  USING (private.pode_gerenciar_conteudos(auth.uid()));

CREATE POLICY "profiles_admin_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "user_roles_admin_select" ON public.user_roles
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));