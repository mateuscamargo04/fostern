-- ============================================================
-- Fostern — Migração 0016 — Avaliação por IA da simulação
-- Adiciona à public.aplicacoes o resultado da avaliação automática
-- (nota geral, notas por seção, pontos fortes/fracos e sugestões).
-- Como rodar: Dashboard Supabase -> SQL Editor -> colar e rodar.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

alter table public.aplicacoes
  add column if not exists avaliacao_ia jsonb,
  add column if not exists avaliada_ia_em timestamptz;

comment on column public.aplicacoes.avaliacao_ia is 'Resultado estruturado da avaliação da simulação de aplicação gerada pela IA (OpenAI).';
comment on column public.aplicacoes.avaliada_ia_em is 'Quando a última avaliação por IA foi gerada.';
