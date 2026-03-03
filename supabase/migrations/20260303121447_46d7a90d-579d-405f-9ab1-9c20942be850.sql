
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  mensagem text NOT NULL,
  data timestamp with time zone NOT NULL DEFAULT now(),
  lida boolean NOT NULL DEFAULT false,
  prioridade text NOT NULL DEFAULT 'media',
  colaborador_id uuid REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público notificacoes" ON public.notificacoes
  FOR ALL
  USING (true)
  WITH CHECK (true);
