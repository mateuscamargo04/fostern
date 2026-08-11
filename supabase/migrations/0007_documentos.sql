-- ============================================================
-- Fostern · Migração 0007 — Documentos do estudante
-- Bucket privado "documentos" + políticas por dono.
-- A tabela public.documentos já existe (migração 0001).
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos',
  'documentos',
  false,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do nothing;

-- Acesso restrito à própria pasta documentos/<uid>/
drop policy if exists "documentos_select_own" on storage.objects;
create policy "documentos_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documentos_insert_own" on storage.objects;
create policy "documentos_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documentos_delete_own" on storage.objects;
create policy "documentos_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text);
