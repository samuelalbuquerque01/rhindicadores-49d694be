-- Read-only audit. Run with an authorized database connection / SQL Editor.
SELECT c.relname, c.relrowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN
  ('colaboradores', 'filiais', 'colaborador_filiais', 'systea_clinic_filiais');

SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' AND tablename IN
  ('colaboradores', 'filiais', 'colaborador_filiais', 'systea_clinic_filiais');

SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name IN
  ('colaboradores', 'filiais', 'colaborador_filiais', 'systea_clinic_filiais')
ORDER BY table_name, grantee, privilege_type;

SELECT m.systea_clinic_id, f.id AS filial_id, f.nome
FROM public.systea_clinic_filiais m JOIN public.filiais f ON f.id = m.filial_id
ORDER BY m.systea_clinic_id;

SELECT count(*) AS imported,
  count(*) FILTER (WHERE NOT EXISTS (
    SELECT 1 FROM public.colaborador_filiais cf WHERE cf.colaborador_id = c.id
  )) AS imported_without_links
FROM public.colaboradores c WHERE c.systea_user_id IS NOT NULL;

-- Snapshot before and after recovery. Keep this employee report private.
SELECT c.id, c.nome, c.systea_admin_id, c.systea_user_id,
  f.nome AS administrative_branch,
  COALESCE(array_agg(linked.nome ORDER BY linked.nome)
    FILTER (WHERE linked.id IS NOT NULL), ARRAY[]::text[]) AS assigned_branches
FROM public.colaboradores c
LEFT JOIN public.filiais f ON f.id = c.filial_id
LEFT JOIN public.colaborador_filiais cf ON cf.colaborador_id = c.id
LEFT JOIN public.filiais linked ON linked.id = cf.filial_id
WHERE c.systea_user_id IS NOT NULL
GROUP BY c.id, c.nome, c.systea_admin_id, c.systea_user_id, f.nome
ORDER BY c.nome;

-- Audit potential alternative access paths before claiming global confidentiality.
SELECT c.relname, c.reloptions
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('v', 'm');

SELECT p.proname, p.prosecdef, p.proacl
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef;

-- Inspect these separately if they duplicate employee information.
SELECT tablename, policyname, roles, cmd, qual
FROM pg_policies WHERE schemaname = 'public'
AND tablename IN ('afastamentos', 'contratacoes', 'desligamentos');
