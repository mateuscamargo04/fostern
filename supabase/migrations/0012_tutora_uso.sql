-- ============================================================
-- Fostern · Migração 0012 — Controle de uso da Tutora IA
-- Limite diário de mensagens por usuário (exclusivo de planos pagos).
-- Idempotente: usa IF NOT EXISTS.
-- ============================================================

create table if not exists public.tutora_uso (
  usuario_id uuid not null references auth.users(id) on delete cascade,
  dia date not null default current_date,
  contagem integer not null default 0,
  atualizado_em timestamptz not null default now(),
  primary key (usuario_id, dia)
);

alter table public.tutora_uso enable row level security;

drop policy if exists "tutora_uso_select_own" on public.tutora_uso;
create policy "tutora_uso_select_own"
  on public.tutora_uso for select
  to authenticated
  using (auth.uid() = usuario_id);

drop policy if exists "tutora_uso_insert_own" on public.tutora_uso;
create policy "tutora_uso_insert_own"
  on public.tutora_uso for insert
  to authenticated
  with check (auth.uid() = usuario_id);

drop policy if exists "tutora_uso_update_own" on public.tutora_uso;
create policy "tutora_uso_update_own"
  on public.tutora_uso for update
  to authenticated
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

revoke all on table public.tutora_uso from anon;
grant all on table public.tutora_uso to authenticated;
grant all on table public.tutora_uso to service_role;
