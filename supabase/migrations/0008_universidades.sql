-- ============================================================
-- Fostern · Migração 0008 — Metas & universidades
-- Tabela de universidades-alvo do estudante + RLS + trigger.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

create table if not exists public.universidades (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  pais text,
  curso text,
  prazo_candidatura date,
  taxa_candidatura text,
  status text not null default 'planejada', -- planejada | em_progresso | enviada | aceita | recusada
  nota integer,                            -- prioridade 1-5
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.universidades enable row level security;

-- Cada usuário só enxerga e altera as próprias universidades.
drop policy if exists "universidades_select_own" on public.universidades;
create policy "universidades_select_own" on public.universidades
  for select using (auth.uid() = usuario_id);

drop policy if exists "universidades_insert_own" on public.universidades;
create policy "universidades_insert_own" on public.universidades
  for insert with check (auth.uid() = usuario_id);

drop policy if exists "universidades_update_own" on public.universidades;
create policy "universidades_update_own" on public.universidades
  for update using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

drop policy if exists "universidades_delete_own" on public.universidades;
create policy "universidades_delete_own" on public.universidades
  for delete using (auth.uid() = usuario_id);

create or replace function public.touch_universidade()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists universidades_touch on public.universidades;
create trigger universidades_touch
  before update on public.universidades
  for each row execute function public.touch_universidade();
