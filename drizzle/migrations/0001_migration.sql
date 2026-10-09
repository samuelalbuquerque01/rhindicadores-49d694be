CREATE OR REPLACE FUNCTION public.reconcile_systea_colaborador_filiais(p_colaborador_id uuid, p_systea_clinic_ids integer[], p_synced_at timestamp with time zone DEFAULT now())
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_inserted integer;
BEGIN
  -- Insert-only recovery: never touches colaboradores (filial_id preserved, including NULL)
  -- and never deletes or updates existing colaborador_filiais rows.
  IF NOT EXISTS (SELECT 1 FROM public.colaboradores WHERE id = p_colaborador_id) THEN
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
  RETURN v_inserted;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.reconcile_systea_colaborador_filiais(uuid, integer[], timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_systea_colaborador_filiais(uuid, integer[], timestamptz) TO service_role;