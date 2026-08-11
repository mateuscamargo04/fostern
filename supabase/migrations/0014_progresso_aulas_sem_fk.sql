-- ============================================================
-- Fostern · Migração 0014 — Progresso de aulas sem FK obrigatória
-- O conteúdo das aulas vive no frontend (lib/learning.ts, estático).
-- A FK progresso_aulas.aula_id -> aulas quebrava todo upsert de
-- progresso quando a tabela `aulas` não estava populada (o que
-- aconteceu em produção: aulas estava vazia). Como o app nunca lê
-- `aulas`, a referência só trazia risco — então ela é removida.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

alter table public.progresso_aulas
  drop constraint if exists progresso_aulas_aula_id_fkey;
