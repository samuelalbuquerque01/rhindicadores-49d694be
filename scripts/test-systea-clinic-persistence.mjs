// Run against an isolated PostgreSQL engine; never connects to the real project.
// npm install --prefix <temporary-directory> @electric-sql/pglite
// Set PGLITE_MODULE to its dist/index.js (absolute file URL).
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const { PGlite } = await import(process.env.PGLITE_MODULE || "@electric-sql/pglite");
const db = new PGlite();
const migration = (name) => readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8");
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated;
    INSERT INTO auth.users VALUES
      ('00000000-0000-0000-0000-000000000021'),
      ('00000000-0000-0000-0000-000000000022');
    CREATE TABLE public.filiais (id uuid PRIMARY KEY, nome text NOT NULL);
    CREATE TABLE public.colaboradores (id uuid PRIMARY KEY, filial_id uuid REFERENCES filiais(id));
    ALTER TABLE filiais ENABLE ROW LEVEL SECURITY;
    ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
    GRANT SELECT ON filiais, colaboradores TO authenticated;
    CREATE POLICY branches_read ON filiais FOR SELECT TO authenticated USING (true);
    CREATE POLICY employees_read ON colaboradores FOR SELECT TO authenticated USING (true);
    CREATE POLICY legacy_public_access ON colaboradores FOR ALL TO PUBLIC USING (true) WITH CHECK (true);
    GRANT SELECT ON colaboradores TO anon;
    CREATE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS
    $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
    INSERT INTO filiais VALUES
      ('00000000-0000-0000-0000-000000000001', 'Matriz'),
      ('00000000-0000-0000-0000-000000000002', 'Parquelândia'),
      ('00000000-0000-0000-0000-000000000003', 'Unidade Life'),
      ('00000000-0000-0000-0000-000000000004', 'Unidade Sul');
    INSERT INTO colaboradores VALUES
      ('00000000-0000-0000-0000-000000000011', null),
      ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002');
  `);
  await db.exec(await migration("20261007150000_add_systea_employee_clinic_assignments.sql"));
  await db.exec(await migration("20261008140000_reconcile_systea_clinics.sql"));
  await db.exec("INSERT INTO rh_data_readers(user_id) VALUES ('00000000-0000-0000-0000-000000000021')");
  const employee = "00000000-0000-0000-0000-000000000011";
  const preserved = "00000000-0000-0000-0000-000000000012";
  const reconcile = async (id, clinics) => (await db.query(
    "SELECT reconcile_systea_colaborador_filiais($1::uuid, $2::integer[]) AS inserted", [id, clinics]
  )).rows[0].inserted;
  assert.equal(await reconcile(employee, [1]), 1);
  assert.equal(await reconcile(employee, [1]), 0, "Recovery must be idempotent");
  assert.equal(await reconcile(employee, [3, 4]), 2);
  assert.equal(await reconcile(employee, []), 0);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM colaborador_filiais WHERE colaborador_id=$1", [employee])).rows[0].n, 3);
  assert.equal((await db.query("SELECT filial_id FROM colaboradores WHERE id=$1", [employee])).rows[0].filial_id, "00000000-0000-0000-0000-000000000001");
  assert.equal(await reconcile(preserved, [4]), 1);
  assert.equal((await db.query("SELECT filial_id FROM colaboradores WHERE id=$1", [preserved])).rows[0].filial_id, "00000000-0000-0000-0000-000000000002", "Preserve valid administrative branch");
  await assert.rejects(reconcile(employee, [2, 999]), /Invalid Systea clinic mapping/);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM colaborador_filiais WHERE colaborador_id=$1", [employee])).rows[0].n, 3, "Invalid mapping must write nothing");
  await db.exec("SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000022', false); SET ROLE authenticated");
  assert.equal((await db.query("SELECT * FROM colaboradores")).rows.length, 0, "Authentication alone must never grant employee access, even with legacy public policy");
  assert.equal((await db.query("SELECT * FROM colaborador_filiais")).rows.length, 0);
  assert.equal((await db.query("SELECT * FROM systea_clinic_filiais")).rows.length, 0);
  await assert.rejects(db.query("INSERT INTO rh_data_readers(user_id) VALUES ('00000000-0000-0000-0000-000000000022')"), /permission denied/);
  await db.exec("SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000021', false)");
  const displayed = await db.query(`SELECT f.nome FROM colaborador_filiais cf JOIN filiais f ON f.id=cf.filial_id WHERE cf.colaborador_id=$1 ORDER BY f.nome`, [employee]);
  assert.deepEqual(displayed.rows.map((r) => r.nome), ["Matriz", "Unidade Life", "Unidade Sul"]);
  await assert.rejects(reconcile(employee, [2]), /permission denied/);
  await db.exec("RESET ROLE; CREATE POLICY test_employee_scope ON colaboradores AS RESTRICTIVE FOR SELECT TO authenticated USING(false); SET ROLE authenticated");
  assert.equal((await db.query("SELECT * FROM colaborador_filiais")).rows.length, 0, "Links must obey employee RLS");
  await db.exec("RESET ROLE; SET ROLE anon");
  assert.equal((await db.query("SELECT * FROM colaboradores")).rows.length, 0, "Legacy public policy cannot bypass anonymous denial");
  await assert.rejects(db.query("SELECT * FROM colaborador_filiais"), /permission denied/);
  await db.exec("RESET ROLE; DROP POLICY test_employee_scope ON colaboradores; UPDATE rh_data_readers SET active=false; SET ROLE authenticated");
  assert.equal((await db.query("SELECT * FROM colaboradores")).rows.length, 0, "Inactive RH membership must deny access");
  assert.equal((await db.query("SELECT * FROM colaborador_filiais")).rows.length, 0);
  console.log("PASS: PostgreSQL persistence, idempotence, multi-branch reads, preservation, invalid mapping rollback; active RH allow, authenticated outsider deny, inactive RH deny, anonymous deny despite legacy public policy, membership self-enrollment deny, RPC denial.");
} finally {
  await db.close();
}
