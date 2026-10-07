-- `colaboradores.filial_id` remains the employee's administrative primary clinic.
-- This migration stores the complete Systea clinic eligibility separately.

CREATE TABLE IF NOT EXISTS public.systea_clinic_filiais (
  systea_clinic_id integer PRIMARY KEY CHECK (systea_clinic_id > 0),
  filial_id uuid NOT NULL UNIQUE REFERENCES public.filiais(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.colaborador_filiais (
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  filial_id uuid NOT NULL REFERENCES public.filiais(id) ON DELETE CASCADE,
  systea_clinic_id integer NOT NULL REFERENCES public.systea_clinic_filiais(systea_clinic_id) ON DELETE RESTRICT,
  is_primary boolean NOT NULL DEFAULT false,
  synced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (colaborador_id, filial_id),
  UNIQUE (colaborador_id, systea_clinic_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS colaborador_filiais_one_primary_per_employee_idx
  ON public.colaborador_filiais (colaborador_id)
  WHERE is_primary;

CREATE INDEX IF NOT EXISTS colaborador_filiais_filial_id_idx
  ON public.colaborador_filiais (filial_id);

ALTER TABLE public.systea_clinic_filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaborador_filiais ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_systea_clinic_filiais_updated_at ON public.systea_clinic_filiais;
CREATE TRIGGER update_systea_clinic_filiais_updated_at
BEFORE UPDATE ON public.systea_clinic_filiais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- The business-confirmed mapping is intentionally seeded by name rather than assuming UUIDs.
-- Fail closed if the four local branches have not been registered exactly once.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (VALUES ('Matriz'::text), ('Parquelândia'::text), ('Unidade Life'::text), ('Sul'::text)) AS expected(nome)
    WHERE (
      SELECT count(*)
      FROM public.filiais
      WHERE filiais.nome = expected.nome
    ) <> 1
  ) THEN
    RAISE EXCEPTION
      'Expected exactly one local filial named Matriz, Parquelândia, Unidade Life, and Sul before enabling Systea clinic mapping';
  END IF;
END;
$$;

INSERT INTO public.systea_clinic_filiais (systea_clinic_id, filial_id)
SELECT mapping.systea_clinic_id, filial.id
FROM (
  VALUES
    (1, 'Matriz'::text),
    (2, 'Parquelândia'::text),
    (3, 'Unidade Life'::text),
    (4, 'Sul'::text)
) AS mapping(systea_clinic_id, filial_nome)
JOIN public.filiais AS filial ON filial.nome = mapping.filial_nome
ON CONFLICT (systea_clinic_id) DO UPDATE
SET filial_id = EXCLUDED.filial_id;

CREATE OR REPLACE FUNCTION public.sync_colaborador_filial_principal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.filial_id IS DISTINCT FROM OLD.filial_id THEN
    UPDATE public.colaborador_filiais
    SET is_primary = false
    WHERE colaborador_id = NEW.id
      AND is_primary;

    IF NEW.filial_id IS NOT NULL THEN
      UPDATE public.colaborador_filiais
      SET is_primary = true
      WHERE colaborador_id = NEW.id
        AND filial_id = NEW.filial_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_colaborador_filial_principal_on_update ON public.colaboradores;
CREATE TRIGGER sync_colaborador_filial_principal_on_update
AFTER UPDATE OF filial_id ON public.colaboradores
FOR EACH ROW EXECUTE FUNCTION public.sync_colaborador_filial_principal();

CREATE OR REPLACE FUNCTION public.sync_systea_colaborador_filiais(
  p_colaborador_id uuid,
  p_systea_clinic_ids integer[],
  p_synced_at timestamptz DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment_count integer;
  v_primary_filial_id uuid;
  v_current_filial_id uuid;
BEGIN
  IF p_systea_clinic_ids IS NULL OR EXISTS (
    SELECT 1
    FROM unnest(p_systea_clinic_ids) AS clinic_id
    LEFT JOIN public.systea_clinic_filiais AS mapping ON mapping.systea_clinic_id = clinic_id
    WHERE clinic_id IS NULL OR mapping.systea_clinic_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot synchronize collaborator clinics without a valid Systea clinic mapping';
  END IF;

  INSERT INTO public.colaborador_filiais (
    colaborador_id,
    filial_id,
    systea_clinic_id,
    is_primary,
    synced_at
  )
  SELECT
    p_colaborador_id,
    mapping.filial_id,
    mapping.systea_clinic_id,
    false,
    p_synced_at
  FROM public.systea_clinic_filiais AS mapping
  WHERE mapping.systea_clinic_id = ANY (p_systea_clinic_ids)
  ON CONFLICT (colaborador_id, filial_id) DO UPDATE
  SET systea_clinic_id = EXCLUDED.systea_clinic_id,
      synced_at = EXCLUDED.synced_at;

  DELETE FROM public.colaborador_filiais AS assignment
  WHERE assignment.colaborador_id = p_colaborador_id
    AND NOT (assignment.systea_clinic_id = ANY (p_systea_clinic_ids));

  SELECT count(*)
  INTO v_assignment_count
  FROM public.colaborador_filiais
  WHERE colaborador_id = p_colaborador_id;

  IF v_assignment_count = 0 THEN
    RETURN;
  END IF;

  IF v_assignment_count = 1 THEN
    SELECT filial_id
    INTO v_primary_filial_id
    FROM public.colaborador_filiais
    WHERE colaborador_id = p_colaborador_id;

    UPDATE public.colaborador_filiais
    SET is_primary = false
    WHERE colaborador_id = p_colaborador_id;

    UPDATE public.colaborador_filiais
    SET is_primary = true
    WHERE colaborador_id = p_colaborador_id
      AND filial_id = v_primary_filial_id;

    UPDATE public.colaboradores
    SET filial_id = v_primary_filial_id
    WHERE id = p_colaborador_id;
    RETURN;
  END IF;

  SELECT filial_id
  INTO v_primary_filial_id
  FROM public.colaborador_filiais
  WHERE colaborador_id = p_colaborador_id
    AND is_primary
  LIMIT 1;

  IF v_primary_filial_id IS NULL THEN
    SELECT filial_id
    INTO v_current_filial_id
    FROM public.colaboradores
    WHERE id = p_colaborador_id;

    SELECT filial_id
    INTO v_primary_filial_id
    FROM public.colaborador_filiais
    WHERE colaborador_id = p_colaborador_id
      AND filial_id = v_current_filial_id
    LIMIT 1;

    IF v_primary_filial_id IS NOT NULL THEN
      UPDATE public.colaborador_filiais
      SET is_primary = false
      WHERE colaborador_id = p_colaborador_id
        AND is_primary;

      UPDATE public.colaborador_filiais
      SET is_primary = true
      WHERE colaborador_id = p_colaborador_id
        AND filial_id = v_primary_filial_id;
    END IF;
  END IF;

  IF v_primary_filial_id IS NOT NULL THEN
    UPDATE public.colaboradores
    SET filial_id = v_primary_filial_id
    WHERE id = p_colaborador_id
      AND filial_id IS DISTINCT FROM v_primary_filial_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_systea_colaborador_filiais_batch(
  p_assignments jsonb,
  p_synced_at timestamptz DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assignment record;
BEGIN
  IF p_assignments IS NULL OR jsonb_typeof(p_assignments) <> 'array' THEN
    RAISE EXCEPTION 'Systea clinic assignments must be a JSON array';
  END IF;

  FOR assignment IN
    SELECT source.colaborador_id, source.systea_clinic_ids
    FROM jsonb_to_recordset(p_assignments) AS source(
      colaborador_id uuid,
      systea_clinic_ids integer[]
    )
  LOOP
    PERFORM public.sync_systea_colaborador_filiais(
      assignment.colaborador_id,
      assignment.systea_clinic_ids,
      p_synced_at
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_systea_colaborador_filiais(uuid, integer[], timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_systea_colaborador_filiais(uuid, integer[], timestamptz) TO service_role;
REVOKE ALL ON FUNCTION public.sync_systea_colaborador_filiais_batch(jsonb, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_systea_colaborador_filiais_batch(jsonb, timestamptz) TO service_role;