-- Add target sector and responsible fields to eventos
ALTER TABLE public.eventos
ADD COLUMN IF NOT EXISTS setor_alvo TEXT;

ALTER TABLE public.eventos
ADD COLUMN IF NOT EXISTS responsavel TEXT;

-- Update tipo constraint to include additional values
ALTER TABLE public.eventos DROP CONSTRAINT IF EXISTS eventos_tipo_check;

ALTER TABLE public.eventos
ADD CONSTRAINT eventos_tipo_check
CHECK (tipo IN ('ConfraternizaÃ§Ã£o', 'Palestra', 'Workshop', 'IntegraÃ§Ã£o', 'Treinamento', 'Corporativo', 'Outro'));
