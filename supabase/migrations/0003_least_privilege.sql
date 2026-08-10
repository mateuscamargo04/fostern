-- ============================================================
-- Fostern · Migração 0003 — Mínimos privilégios para anon
-- O RLS já bloqueia o acesso, mas reduzimos ainda mais o que a
-- role anon pode tentar: apenas leitura pública de planos.
-- Todo o resto fica para authenticated (controlado pelo RLS).
-- service_role recebe acesso total para as rotas de servidor
-- (checkout, webhook, backup), já que o projeto não expõe
-- tabelas automaticamente.
-- ============================================================

revoke all on all tables in schema public from anon;

grant usage on schema public to anon;
grant select on table public.planos to anon;

grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
