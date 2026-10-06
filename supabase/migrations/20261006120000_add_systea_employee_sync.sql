-- Systea identifiers are external references; the internal UUID remains the primary key.
ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS systea_user_id bigint,
  ADD COLUMN IF NOT EXISTS systea_admin_id bigint,
  ADD COLUMN IF NOT EXISTS systea_sector_id bigint,
  ADD COLUMN IF NOT EXISTS systea_area_operation_id bigint,
  ADD COLUMN IF NOT EXISTS systea_status text,
  ADD COLUMN IF NOT EXISTS systea_is_shutdown boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS systea_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS systea_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS systea_regime_contratacao text,
  ADD COLUMN IF NOT EXISTS systea_area_name text,
  ADD COLUMN IF NOT EXISTS systea_area_type text,
  ADD COLUMN IF NOT EXISTS systea_primeiro_dia_trabalho date,
  ADD COLUMN IF NOT EXISTS systea_local_trabalho text,
  ADD COLUMN IF NOT EXISTS systea_carga_horaria_semanal_total numeric(8,2),
  ADD COLUMN IF NOT EXISTS systea_carga_horaria_atendimentos numeric(8,2);

ALTER TABLE public.colaboradores
  ADD CONSTRAINT colaboradores_systea_admin_id_key UNIQUE (systea_admin_id);

ALTER TABLE public.colaboradores
  ADD CONSTRAINT colaboradores_systea_user_id_key UNIQUE (systea_user_id);

ALTER TABLE public.colaboradores DROP CONSTRAINT IF EXISTS colaboradores_status_check;
ALTER TABLE public.colaboradores
  ADD CONSTRAINT colaboradores_status_check
  CHECK (status IN ('Ativo', 'Inativo', 'Afastado', 'Férias', 'Em desligamento', 'Pendente'));

CREATE TABLE IF NOT EXISTS public.systea_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  mode text NOT NULL CHECK (mode IN ('dry-run', 'sync')),
  status text NOT NULL CHECK (status IN ('completed', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  fetched integer NOT NULL DEFAULT 0 CHECK (fetched >= 0),
  created integer NOT NULL DEFAULT 0 CHECK (created >= 0),
  updated integer NOT NULL DEFAULT 0 CHECK (updated >= 0),
  unchanged integer NOT NULL DEFAULT 0 CHECK (unchanged >= 0),
  skipped integer NOT NULL DEFAULT 0 CHECK (skipped >= 0),
  errors integer NOT NULL DEFAULT 0 CHECK (errors >= 0),
  error_summary text
);

CREATE TABLE IF NOT EXISTS public.systea_sync_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.systea_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.systea_sync_admins ENABLE ROW LEVEL SECURITY;

-- No public policies: the Edge Function uses service role after validating the caller.
CREATE INDEX IF NOT EXISTS systea_sync_runs_finished_at_idx
  ON public.systea_sync_runs (finished_at DESC);

CREATE OR REPLACE FUNCTION public.apply_systea_colaboradores(payloads jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.colaboradores (
    nome,
    email,
    cargo,
    departamento,
    data_admissao,
    tipo_colaborador,
    status,
    systea_user_id,
    systea_admin_id,
    systea_sector_id,
    systea_area_operation_id,
    systea_status,
    systea_is_shutdown,
    systea_updated_at,
    systea_synced_at,
    systea_regime_contratacao,
    systea_area_name,
    systea_area_type,
    systea_primeiro_dia_trabalho,
    systea_local_trabalho,
    systea_carga_horaria_semanal_total,
    systea_carga_horaria_atendimentos
  )
  SELECT
    source.nome,
    source.email,
    source.cargo,
    source.departamento,
    source.data_admissao,
    source.tipo_colaborador,
    source.status,
    source.systea_user_id,
    source.systea_admin_id,
    source.systea_sector_id,
    source.systea_area_operation_id,
    source.systea_status,
    COALESCE(source.systea_is_shutdown, false),
    source.systea_updated_at,
    source.systea_synced_at,
    source.systea_regime_contratacao,
    source.systea_area_name,
    source.systea_area_type,
    source.systea_primeiro_dia_trabalho,
    source.systea_local_trabalho,
    source.systea_carga_horaria_semanal_total,
    source.systea_carga_horaria_atendimentos
  FROM jsonb_to_recordset(payloads) AS source(
    nome text,
    email text,
    cargo text,
    departamento text,
    data_admissao date,
    tipo_colaborador text,
    status text,
    systea_user_id bigint,
    systea_admin_id bigint,
    systea_sector_id bigint,
    systea_area_operation_id bigint,
    systea_status text,
    systea_is_shutdown boolean,
    systea_updated_at timestamptz,
    systea_synced_at timestamptz,
    systea_regime_contratacao text,
    systea_area_name text,
    systea_area_type text,
    systea_primeiro_dia_trabalho date,
    systea_local_trabalho text,
    systea_carga_horaria_semanal_total numeric,
    systea_carga_horaria_atendimentos numeric
  )
  ON CONFLICT (systea_admin_id) DO UPDATE SET
    nome = COALESCE(EXCLUDED.nome, colaboradores.nome),
    email = COALESCE(EXCLUDED.email, colaboradores.email),
    cargo = COALESCE(EXCLUDED.cargo, colaboradores.cargo),
    departamento = COALESCE(EXCLUDED.departamento, colaboradores.departamento),
    data_admissao = COALESCE(EXCLUDED.data_admissao, colaboradores.data_admissao),
    tipo_colaborador = COALESCE(EXCLUDED.tipo_colaborador, colaboradores.tipo_colaborador),
    status = COALESCE(EXCLUDED.status, colaboradores.status),
    systea_user_id = COALESCE(EXCLUDED.systea_user_id, colaboradores.systea_user_id),
    systea_sector_id = COALESCE(EXCLUDED.systea_sector_id, colaboradores.systea_sector_id),
    systea_area_operation_id = COALESCE(EXCLUDED.systea_area_operation_id, colaboradores.systea_area_operation_id),
    systea_status = COALESCE(EXCLUDED.systea_status, colaboradores.systea_status),
    systea_is_shutdown = COALESCE(EXCLUDED.systea_is_shutdown, colaboradores.systea_is_shutdown),
    systea_updated_at = COALESCE(EXCLUDED.systea_updated_at, colaboradores.systea_updated_at),
    systea_synced_at = EXCLUDED.systea_synced_at,
    systea_regime_contratacao = COALESCE(EXCLUDED.systea_regime_contratacao, colaboradores.systea_regime_contratacao),
    systea_area_name = COALESCE(EXCLUDED.systea_area_name, colaboradores.systea_area_name),
    systea_area_type = COALESCE(EXCLUDED.systea_area_type, colaboradores.systea_area_type),
    systea_primeiro_dia_trabalho = COALESCE(EXCLUDED.systea_primeiro_dia_trabalho, colaboradores.systea_primeiro_dia_trabalho),
    systea_local_trabalho = COALESCE(EXCLUDED.systea_local_trabalho, colaboradores.systea_local_trabalho),
    systea_carga_horaria_semanal_total = COALESCE(EXCLUDED.systea_carga_horaria_semanal_total, colaboradores.systea_carga_horaria_semanal_total),
    systea_carga_horaria_atendimentos = COALESCE(EXCLUDED.systea_carga_horaria_atendimentos, colaboradores.systea_carga_horaria_atendimentos);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_systea_colaboradores(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_systea_colaboradores(jsonb) TO service_role;

DROP TRIGGER IF EXISTS update_systea_sync_admins_updated_at ON public.systea_sync_admins;
CREATE TRIGGER update_systea_sync_admins_updated_at
BEFORE UPDATE ON public.systea_sync_admins
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();