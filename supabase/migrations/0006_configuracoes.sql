-- ============================================================
-- Fostern · Migração 0006 — Configurações da conta
-- Tabela de preferências de notificação + trigger de criação.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

-- 1) Preferências de notificação ------------------------------
create table if not exists public.preferencias (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  email_mentoria boolean not null default true,
  email_prazos boolean not null default true,
  email_promocoes boolean not null default false,
  atualizado_em timestamptz not null default now()
);

alter table public.preferencias enable row level security;

-- Cada usuário só enxerga e altera as próprias preferências.
drop policy if exists "preferencias_select_own" on public.preferencias;
create policy "preferencias_select_own" on public.preferencias
  for select using (auth.uid() = usuario_id);

drop policy if exists "preferencias_insert_own" on public.preferencias;
create policy "preferencias_insert_own" on public.preferencias
  for insert with check (auth.uid() = usuario_id);

drop policy if exists "preferencias_update_own" on public.preferencias;
create policy "preferencias_update_own" on public.preferencias
  for update using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

drop policy if exists "preferencias_delete_own" on public.preferencias;
create policy "preferencias_delete_own" on public.preferencias
  for delete using (auth.uid() = usuario_id);

-- 2) Trigger: criar preferências no cadastro ------------------
create or replace function public.handle_novo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfis (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name'),
    new.email
  );
  insert into public.preferencias (usuario_id)
  values (new.id)
  on conflict (usuario_id) do nothing;
  return new;
end;
$$;
