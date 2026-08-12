-- ============================================================
-- Fostern — Migração 0015 — Aplicação & Simulação
-- 1) tabela public.aplicacoes (dossiê de candidatura do estudante)
-- 2) RLS por dono + trigger de atualizado_em
-- 3) colunas de revisão do mentor
-- Como rodar: Dashboard Supabase -> SQL Editor -> colar e rodar.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

create table if not exists public.aplicacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade unique,

  -- Perfil acadêmico
  serie text,                          -- ex.: "2º ano EM", "Terceirão"
  escola text,
  media_escolar numeric,               -- número dentro da escala escolhida
  escala_media text not null default '10', -- '10' | '100' | 'gpa'
  posicao_turma text,                  -- ex.: "Top 5%"
  carga_horaria_semanal text,

  -- Testes padronizados
  sat text,
  act text,
  toefl text,
  ielts text,
  outros_testes text,                  -- ex.: "Enem 2025: 780"

  -- Currículo (listas dinâmicas)
  extracurriculares jsonb not null default '[]',
  idiomas jsonb not null default '[]',
  voluntariado jsonb not null default '[]',

  -- Finanças
  orcamento_anual_usd text,
  precisa_bolsa boolean not null default false,
  financa_observacao text,

  -- Ensaios
  ensaio_tema text,
  ensaio_versao text,

  -- Preferências de destino
  paises jsonb not null default '[]',
  cursos jsonb not null default '[]',
  preferencia_obs text,

  -- Fluxo de revisão
  status text not null default 'rascunho', -- rascunho | pronta | em_revisao | revisada
  pronta boolean not null default false,
  revisao_mentor text,
  revisada_em timestamptz,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.aplicacoes is 'Dossiê completo do estudante para simulação de aplicação e análise na mentoria.';

alter table public.aplicacoes enable row level security;

-- Cada usuário só enxerga e altera a própria aplicação.
drop policy if exists "aplicacoes_select_own" on public.aplicacoes;
create policy "aplicacoes_select_own" on public.aplicacoes
  for select using (auth.uid() = usuario_id);

drop policy if exists "aplicacoes_insert_own" on public.aplicacoes;
create policy "aplicacoes_insert_own" on public.aplicacoes
  for insert with check (auth.uid() = usuario_id);

drop policy if exists "aplicacoes_update_own" on public.aplicacoes;
create policy "aplicacoes_update_own" on public.aplicacoes
  for update using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

drop policy if exists "aplicacoes_delete_own" on public.aplicacoes;
create policy "aplicacoes_delete_own" on public.aplicacoes
  for delete using (auth.uid() = usuario_id);

create or replace function public.touch_aplicacao()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists aplicacoes_touch on public.aplicacoes;
create trigger aplicacoes_touch
  before update on public.aplicacoes
  for each row execute function public.touch_aplicacao();

-- Grants (segue o padrão das migrações 0011/0013)
revoke all on table public.aplicacoes from anon;
grant all on table public.aplicacoes to authenticated;
grant all on table public.aplicacoes to service_role;
