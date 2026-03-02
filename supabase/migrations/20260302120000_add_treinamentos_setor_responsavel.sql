-- Add target sector and responsible fields to treinamentos
ALTER TABLE public.treinamentos
ADD COLUMN IF NOT EXISTS setor_alvo TEXT;

ALTER TABLE public.treinamentos
ADD COLUMN IF NOT EXISTS responsavel TEXT;
