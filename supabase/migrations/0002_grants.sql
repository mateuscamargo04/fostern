-- ============================================================
-- Fostern · Migração 0002 — Liberar acesso via Data API
-- Como o "Automatically expose new tables" foi desligado,
-- precisamos dar permissão explícita às roles anon e
-- authenticated. A segurança continua garantida pelo RLS.
-- ============================================================

grant usage on schema public to anon, authenticated;

grant all on table public.perfis to anon, authenticated;
grant all on table public.planos to anon, authenticated;
grant all on table public.assinaturas to anon, authenticated;
grant all on table public.pagamentos to anon, authenticated;
grant all on table public.modulos to anon, authenticated;
grant all on table public.aulas to anon, authenticated;
grant all on table public.progresso_aulas to anon, authenticated;
grant all on table public.mentorias to anon, authenticated;
grant all on table public.documentos to anon, authenticated;
