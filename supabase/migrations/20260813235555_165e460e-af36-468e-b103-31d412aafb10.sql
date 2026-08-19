CREATE TABLE public.redacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tema TEXT NOT NULL,
  texto TEXT NOT NULL,
  nota_total INTEGER NOT NULL DEFAULT 0,
  competencias JSONB NOT NULL DEFAULT '[]'::jsonb,
  palavras INTEGER NOT NULL DEFAULT 0,
  paragrafos INTEGER NOT NULL DEFAULT 0,
  linhas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.redacoes TO authenticated;
GRANT ALL ON public.redacoes TO service_role;

ALTER TABLE public.redacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem suas redacoes" ON public.redacoes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuarios criam suas redacoes" ON public.redacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios editam suas redacoes" ON public.redacoes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios apagam suas redacoes" ON public.redacoes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX redacoes_user_created_idx ON public.redacoes (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_redacoes_updated_at BEFORE UPDATE ON public.redacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();