-- ============================================================
-- Fostern · Migração 0004 — Planos definidos e colunas do Stripe
-- Planos: Gratuito (implícito), Mensal e Anual.
-- Assinaturas ganham referências do Stripe para conciliação.
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

insert into public.planos (nome, slug, descricao, preco_centavos, periodo, destaque, ativo)
values
  ('Gratuito', 'gratuito', 'Pra começar: as primeiras aulas do módulo 1, sem custo.', 0, 'avulso', false, true),
  ('Mensal', 'mensal', 'Acesso completo à plataforma, mês a mês.', 2990, 'mensal', true, true),
  ('Anual', 'anual', 'Acesso completo por um ano, com renovação automática.', 19990, 'anual', false, true)
on conflict (slug) do update set
  nome = excluded.nome,
  descricao = excluded.descricao,
  preco_centavos = excluded.preco_centavos,
  periodo = excluded.periodo,
  destaque = excluded.destaque,
  ativo = excluded.ativo;

alter table public.assinaturas add column if not exists stripe_customer_id text;
alter table public.assinaturas add column if not exists stripe_subscription_id text;
