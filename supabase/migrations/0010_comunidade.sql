-- ============================================================
-- Fostern · Migração 0010 — Comunidade
-- Feed simples de postagens entre estudantes.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

create table if not exists public.postagens (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 1000),
  criado_em timestamptz not null default now()
);

alter table public.postagens enable row level security;

-- Qualquer usuário logado lê o feed; cada um escreve e apaga as próprias.
drop policy if exists "postagens_select_auth" on public.postagens;
create policy "postagens_select_auth" on public.postagens
  for select using (auth.role() = 'authenticated');

drop policy if exists "postagens_insert_own" on public.postagens;
create policy "postagens_insert_own" on public.postagens
  for insert with check (auth.uid() = usuario_id);

drop policy if exists "postagens_delete_own" on public.postagens;
create policy "postagens_delete_own" on public.postagens
  for delete using (auth.uid() = usuario_id);
