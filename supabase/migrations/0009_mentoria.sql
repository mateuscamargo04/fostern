-- ============================================================
-- Fostern · Migração 0009 — Mentoria
-- Completa as políticas de RLS da tabela public.mentorias
-- (select/insert/update já existem na 0001; falta delete).
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

drop policy if exists "mentorias_delete_own" on public.mentorias;
create policy "mentorias_delete_own" on public.mentorias
  for delete using (auth.uid() = usuario_id);
