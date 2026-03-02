-- Add attachment field to afastamentos
alter table if exists public.afastamentos
add column if not exists anexo_url text;

-- Create private bucket for attachments
insert into storage.buckets (id, name, public)
values ('atestados', 'atestados', false)
on conflict (id) do nothing;

-- Ensure RLS is enabled for storage objects
alter table if exists storage.objects enable row level security;

-- Storage policies: authenticated users only
create policy "atestados_read_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'atestados');

create policy "atestados_insert_authenticated"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'atestados');

create policy "atestados_update_authenticated"
on storage.objects
for update
to authenticated
using (bucket_id = 'atestados')
with check (bucket_id = 'atestados');

create policy "atestados_delete_authenticated"
on storage.objects
for delete
to authenticated
using (bucket_id = 'atestados');
