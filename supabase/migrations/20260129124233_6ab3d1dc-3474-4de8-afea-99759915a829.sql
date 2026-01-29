-- Remove unique constraint on cpf column since CPF field was removed from the form
ALTER TABLE public.colaboradores DROP CONSTRAINT IF EXISTS colaboradores_cpf_key;