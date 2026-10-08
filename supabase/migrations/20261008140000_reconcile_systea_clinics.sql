-- Explicit RH membership. Authentication alone never grants employee access.
-- Provision only reviewed auth.users IDs through an administrative connection.
CREATE TABLE IF NOT EXISTS public.rh_data_readers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rh_data_readers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rh_data_readers FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.rh_data_readers TO service_role;

CREATE OR REPLACE FUNCTION public.is_rh_data_reader()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rh_data_readers r
    WHERE r.user_id = (SELECT auth.uid()) AND r.active
  );
$$;
REVOKE ALL ON FUNCTION public.is_rh_data_reader() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_rh_data_reader() TO authenticated, service_role;

-- Restrictive gates combine with existing permissive policies using AND.
-- Legacy PUBLIC/USING(true) policies must not bypass RH membership.
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "RH membership required" ON public.colaboradores;
CREATE POLICY "RH membership required" ON public.colaboradores
AS RESTRICTIVE FOR ALL TO authenticated
USING ((SELECT public.is_rh_data_reader()))
WITH CHECK ((SELECT public.is_rh_data_reader()));
DROP POLICY IF EXISTS "Anonymous employee access denied" ON public.colaboradores;
CREATE POLICY "Anonymous employee access denied" ON public.colaboradores
AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS "RH users can read employees" ON public.colaboradores;
CREATE POLICY "RH users can read employees" ON public.colaboradores
FOR SELECT TO authenticated USING ((SELECT public.is_rh_data_reader()));
GRANT SELECT ON public.colaboradores TO authenticated;

REVOKE ALL ON public.colaborador_filiais, public.systea_clinic_filiais FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON public.colaborador_filiais, public.systea_clinic_filiais FROM authenticated;
GRANT SELECT ON public.colaborador_filiais, public.systea_clinic_filiais TO authenticated;
GRANT ALL ON public.colaborador_filiais, public.systea_clinic_filiais TO service_role;
ALTER TABLE public.colaborador_filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.systea_clinic_filiais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "RH membership required" ON public.colaborador_filiais;
CREATE POLICY "RH membership required" ON public.colaborador_filiais
AS RESTRICTIVE FOR ALL TO authenticated
USING ((SELECT public.is_rh_data_reader()))
WITH CHECK ((SELECT public.is_rh_data_reader()));
DROP POLICY IF EXISTS "RH membership required" ON public.systea_clinic_filiais;
CREATE POLICY "RH membership required" ON public.systea_clinic_filiais
AS RESTRICTIVE FOR ALL TO authenticated
USING ((SELECT public.is_rh_data_reader()))
WITH CHECK ((SELECT public.is_rh_data_reader()));
DROP POLICY IF EXISTS "Authenticated users can read collaborator branches" ON public.colaborador_filiais;
CREATE POLICY "Authenticated users can read collaborator branches"
ON public.colaborador_filiais FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.colaboradores c WHERE c.id = colaborador_id)
  AND EXISTS (SELECT 1 FROM public.filiais f WHERE f.id = filial_id)
);
DROP POLICY IF EXISTS "Authenticated users can read Systea clinic mapping" ON public.systea_clinic_filiais;
CREATE POLICY "Authenticated users can read Systea clinic mapping"
ON public.systea_clinic_filiais FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.filiais f WHERE f.id = filial_id));

-- Recovery is additive. Ordinary sync retains its existing authoritative behavior.
CREATE OR REPLACE FUNCTION public.reconcile_systea_colaborador_filiais(
  p_colaborador_id uuid,
  p_systea_clinic_ids integer[],
  p_synced_at timestamptz DEFAULT now()
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_filial_id uuid;
  v_inserted integer;
BEGIN
  SELECT filial_id INTO v_filial_id FROM public.colaboradores
  WHERE id = p_colaborador_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Collaborator not found';
  END IF;
  IF p_systea_clinic_ids IS NULL OR EXISTS (
    SELECT 1 FROM unnest(p_systea_clinic_ids) clinic_id
    LEFT JOIN public.systea_clinic_filiais m ON m.systea_clinic_id = clinic_id
    WHERE clinic_id IS NULL OR m.systea_clinic_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Invalid Systea clinic mapping';
  END IF;
  INSERT INTO public.colaborador_filiais
    (colaborador_id, filial_id, systea_clinic_id, is_primary, synced_at)
  SELECT p_colaborador_id, m.filial_id, m.systea_clinic_id, false, p_synced_at
  FROM public.systea_clinic_filiais m
  WHERE m.systea_clinic_id = ANY(p_systea_clinic_ids)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  -- Only populate an absent administrative branch when there is one real link.
  IF v_filial_id IS NULL AND (
    SELECT count(*) FROM public.colaborador_filiais WHERE colaborador_id = p_colaborador_id
  ) = 1 THEN
    UPDATE public.colaboradores SET filial_id = (
      SELECT filial_id FROM public.colaborador_filiais WHERE colaborador_id = p_colaborador_id
    ) WHERE id = p_colaborador_id;
  END IF;
  RETURN v_inserted;
END;
$$;
REVOKE ALL ON FUNCTION public.reconcile_systea_colaborador_filiais(uuid, integer[], timestamptz)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_systea_colaborador_filiais(uuid, integer[], timestamptz)
TO service_role;
