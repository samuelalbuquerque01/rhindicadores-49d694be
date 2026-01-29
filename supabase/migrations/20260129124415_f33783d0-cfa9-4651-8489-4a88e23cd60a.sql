-- Add finalizado column to treinamentos table
ALTER TABLE public.treinamentos 
ADD COLUMN IF NOT EXISTS finalizado boolean DEFAULT false;

-- Add finalizado column to eventos table
ALTER TABLE public.eventos 
ADD COLUMN IF NOT EXISTS finalizado boolean DEFAULT false;