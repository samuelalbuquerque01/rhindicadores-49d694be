GRANT SELECT ON public.colaborador_filiais TO authenticated;
GRANT SELECT ON public.systea_clinic_filiais TO authenticated;
GRANT ALL ON public.colaborador_filiais TO service_role;
GRANT ALL ON public.systea_clinic_filiais TO service_role;

DROP POLICY IF EXISTS "Authenticated users can read collaborator branches" ON public.colaborador_filiais;
CREATE POLICY "Authenticated users can read collaborator branches"
ON public.colaborador_filiais FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can read Systea clinic mapping" ON public.systea_clinic_filiais;
CREATE POLICY "Authenticated users can read Systea clinic mapping"
ON public.systea_clinic_filiais FOR SELECT TO authenticated USING (true);