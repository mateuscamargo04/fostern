-- ============================================================
-- Fostern · Migração 0005 — Perfil do estudante
-- 1) avatar_url em perfis + trigger de atualizado_em
-- 2) bucket público "avatars" no Storage com políticas por dono
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

-- 1) Avatar + timestamp de atualização ------------------------
alter table public.perfis add column if not exists avatar_url text;

create or replace function public.touch_perfil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists perfis_touch on public.perfis;
create trigger perfis_touch
  before update on public.perfis
  for each row execute function public.touch_perfil();

-- 2) Storage: bucket público de avatares ----------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;

-- Leitura pública (a foto do avatar pode ser exibida em qualquer lugar)
drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public" on storage.objects
  for select using (bucket_id = 'avatars');

-- Cada usuário só grava/sobrescreve/apaga a própria pasta avatars/<uid>/
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
