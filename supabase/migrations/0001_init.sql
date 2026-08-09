-- ============================================================
-- Fostern · Migração 0001 — Estrutura inicial do banco
-- Como rodar: Dashboard Supabase -> SQL Editor -> colar e rodar.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

-- ============================================================
-- 1. EXTENSÕES
-- ============================================================
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================================================
-- 2. PERFIS
-- Espelho de auth.users com os dados públicos do estudante.
-- O trigger cria o perfil automaticamente em todo cadastro.
-- ============================================================
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text,
  serie text,                     -- ex.: "2º ano EM", "Terceirão"
  escola text,
  meta text,                      -- objetivo do estudante
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

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
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_novo_usuario();

-- ============================================================
-- 3. PLANOS (preços do site)
-- ============================================================
create table if not exists public.planos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  descricao text,
  preco_centavos integer not null default 0,
  periodo text not null default 'mensal',  -- mensal | semestral | anual | avulso
  destaque boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- ============================================================
-- 4. ASSINATURAS
-- ============================================================
create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  plano_id uuid references public.planos(id),
  status text not null default 'ativa',    -- ativa | pausada | cancelada | expirada
  inicio_em timestamptz,
  termino_em timestamptz,
  criado_em timestamptz not null default now()
);

-- ============================================================
-- 5. PAGAMENTOS
-- ============================================================
create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  assinatura_id uuid references public.assinaturas(id) on delete set null,
  valor_centavos integer not null,
  status text not null default 'pendente', -- pendente | pago | recusado | reembolsado
  metodo text,                             -- pix | cartao | boleto
  gateway text,                            -- asaas | stripe | mercadopago
  gateway_id text,                         -- id do pagamento no gateway
  pago_em timestamptz,
  criado_em timestamptz not null default now()
);

-- ============================================================
-- 6. MÓDULOS E AULAS
-- conteudo é JSONB no formato de lib/learning.ts:
-- { blocks: [...], exercicio: { pergunta, opcoes, correta, ... } }
-- ============================================================
create table if not exists public.modulos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  eyebrow text,
  titulo text not null,
  descricao text,
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.aulas (
  id text primary key,                     -- ex.: "lesson-1"
  modulo_id uuid not null references public.modulos(id) on delete cascade,
  numero integer not null,
  titulo text not null,
  tagline text,
  duracao text,                            -- ex.: "8 min"
  conteudo jsonb not null default '{}',
  aberta boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (modulo_id, numero)
);

-- ============================================================
-- 7. PROGRESSO DO ESTUDANTE
-- ============================================================
create table if not exists public.progresso_aulas (
  usuario_id uuid not null references auth.users(id) on delete cascade,
  aula_id text not null references public.aulas(id) on delete cascade,
  concluida boolean not null default true,
  pontuacao integer,                       -- nota do exercício (0-100)
  concluida_em timestamptz not null default now(),
  primary key (usuario_id, aula_id)
);

-- ============================================================
-- 8. MENTORIAS (agendamentos)
-- ============================================================
create table if not exists public.mentorias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  mentor_nome text,
  agendada_para timestamptz,
  duracao_min integer not null default 30,
  status text not null default 'agendada', -- agendada | realizada | cancelada
  link text,                               -- chamada (meet/zoom)
  notas text,
  criado_em timestamptz not null default now()
);

-- ============================================================
-- 9. DOCUMENTOS (ensaios, currículos, históricos)
-- ============================================================
create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  tipo text,                               -- ensaio | curriculo | historico | outro
  url text,
  storage_path text,
  tamanho_bytes bigint,
  criado_em timestamptz not null default now()
);

-- ============================================================
-- 10. ROW LEVEL SECURITY
-- Cada usuário só enxerga e altera os próprios dados.
-- ============================================================
alter table public.perfis enable row level security;
alter table public.planos enable row level security;
alter table public.assinaturas enable row level security;
alter table public.pagamentos enable row level security;
alter table public.modulos enable row level security;
alter table public.aulas enable row level security;
alter table public.progresso_aulas enable row level security;
alter table public.mentorias enable row level security;
alter table public.documentos enable row level security;

-- perfis
create policy "perfis_select_own" on public.perfis
  for select using (auth.uid() = id);
create policy "perfis_insert_own" on public.perfis
  for insert with check (auth.uid() = id);
create policy "perfis_update_own" on public.perfis
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- planos (leitura pública — exibidos no site)
create policy "planos_select_public" on public.planos
  for select using (true);

-- assinaturas
create policy "assinaturas_select_own" on public.assinaturas
  for select using (auth.uid() = usuario_id);

-- pagamentos
create policy "pagamentos_select_own" on public.pagamentos
  for select using (auth.uid() = usuario_id);

-- módulos e aulas (leitura para qualquer usuário logado)
create policy "modulos_select_auth" on public.modulos
  for select using (auth.role() = 'authenticated');
create policy "aulas_select_auth" on public.aulas
  for select using (auth.role() = 'authenticated');

-- progresso
create policy "progresso_select_own" on public.progresso_aulas
  for select using (auth.uid() = usuario_id);
create policy "progresso_insert_own" on public.progresso_aulas
  for insert with check (auth.uid() = usuario_id);
create policy "progresso_update_own" on public.progresso_aulas
  for update using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- mentorias
create policy "mentorias_select_own" on public.mentorias
  for select using (auth.uid() = usuario_id);
create policy "mentorias_insert_own" on public.mentorias
  for insert with check (auth.uid() = usuario_id);
create policy "mentorias_update_own" on public.mentorias
  for update using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- documentos
create policy "documentos_select_own" on public.documentos
  for select using (auth.uid() = usuario_id);
create policy "documentos_insert_own" on public.documentos
  for insert with check (auth.uid() = usuario_id);
create policy "documentos_delete_own" on public.documentos
  for delete using (auth.uid() = usuario_id);
