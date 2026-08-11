-- ============================================================
-- Fostern · Migração 0013 — Notificações in-app
-- Central de notificações da área do estudante (sino no header).
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null default 'sistema',
  titulo text not null,
  corpo text,
  link text,
  lida boolean not null default false,
  criada_em timestamptz not null default now()
);

comment on table public.notificacoes is 'Notificações in-app da área do estudante.';

alter table public.notificacoes enable row level security;

drop policy if exists "notificacoes_select_own" on public.notificacoes;
create policy "notificacoes_select_own" on public.notificacoes
  for select to authenticated
  using (auth.uid() = usuario_id);

drop policy if exists "notificacoes_insert_own" on public.notificacoes;
create policy "notificacoes_insert_own" on public.notificacoes
  for insert to authenticated
  with check (auth.uid() = usuario_id);

drop policy if exists "notificacoes_update_own" on public.notificacoes;
create policy "notificacoes_update_own" on public.notificacoes
  for update to authenticated
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

drop policy if exists "notificacoes_delete_own" on public.notificacoes;
create policy "notificacoes_delete_own" on public.notificacoes
  for delete to authenticated
  using (auth.uid() = usuario_id);

create index if not exists notificacoes_usuario_criada_idx
  on public.notificacoes (usuario_id, criada_em desc);

-- Realtime: o sino atualiza ao vivo quando uma notificação chega.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'notificacoes'
     ) then
    alter publication supabase_realtime add table public.notificacoes;
  end if;
end
$$;

-- Boas-vindas no cadastro: estende o trigger handle_novo_usuario
-- (mantém perfil e preferências como antes e adiciona a notificação).
create or replace function public.handle_novo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfis (id, nome, email)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'nome', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    new.email
  )
  on conflict (id) do nothing;
  insert into public.preferencias (usuario_id)
  values (new.id)
  on conflict (usuario_id) do nothing;
  insert into public.notificacoes (usuario_id, tipo, titulo, corpo, link)
  values (
    new.id,
    'sistema',
    'Bem-vindo(a) à Fostern!',
    'Complete seu perfil e dê o primeiro passo da sua jornada internacional.',
    '/dashboard/perfil'
  );
  return new;
end;
$$;

-- Grants: anon sem acesso; authenticated e service_role com acesso total.
revoke all on table public.notificacoes from anon;
grant all on table public.notificacoes to authenticated;
grant all on table public.notificacoes to service_role;
