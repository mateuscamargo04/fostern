-- ============================================================
-- Fostern · Migração 0011 — Grants para as tabelas novas
-- A migração 0003 só concedeu privilégios às tabelas que existiam
-- na época. As tabelas criadas depois (universidades, preferencias,
-- postagens) ficaram sem permissão para authenticated/service_role
-- e com privilégios padrão (TRUNCATE/TRIGGER/REFERENCES) para anon.
-- Esta migração corrige e garante que tabelas futuras herdem os grants.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

-- Mínimos privilégios para anon (sem DDL sobre dados de usuário).
revoke all on table public.universidades from anon;
revoke all on table public.preferencias from anon;
revoke all on table public.postagens from anon;
grant select on table public.planos to anon;

-- authenticated: acesso controlado pelo RLS (apenas linhas próprias).
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;

-- service_role: acesso total para as rotas de servidor (backup, etc).
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;

-- Tabelas criadas no futuro herdam os mesmos grants automaticamente.
alter default privileges in schema public grant all on tables to authenticated;
alter default privileges in schema public grant all on tables to service_role;
