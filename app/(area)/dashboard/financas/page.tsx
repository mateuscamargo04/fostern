"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

type Pagamento = {
  id: string;
  valor_centavos: number;
  status: string;
  metodo: string | null;
  pago_em: string | null;
  criado_em: string;
  plano_nome: string | null;
};

type PlanoAtual = {
  plano_nome: string;
  inicio_em: string | null;
  termino_em: string | null;
  status: string;
};

const icons = {
  card: "M3.5 7.5A1.5 1.5 0 0 1 5 6h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 18H5a1.5 1.5 0 0 1-1.5-1.5zM3.5 10h17",
  check: "M5 13l4 4L19 7",
  pending: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3",
  receipt: "M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21zM9 8h6M9 12h6",
} as const;

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function fmtValor(centavos: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
}

const statusPagamento: Record<string, { label: string; color: string }> = {
  pago: { label: "Pago", color: "border-gold bg-gold/[.08] text-navy" },
  pendente: { label: "Pendente", color: "border-gold/50 bg-ivory text-graphite/60" },
  recusado: { label: "Recusado", color: "border-[#E0A18C]/60 bg-[#FBF1EC] text-[#C96A52]" },
  reembolsado: { label: "Reembolsado", color: "border-mist bg-ivory text-graphite/60" },
};

export default function FinancasPage() {
  const [plano, setPlano] = useState<PlanoAtual | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (active) setCarregando(false);
        return;
      }
      const [{ data: assinatura }, { data: pagos }] = await Promise.all([
        supabase
          .from("assinaturas")
          .select("status, inicio_em, termino_em, planos(nome)")
          .eq("usuario_id", session.user.id)
          .order("inicio_em", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("pagamentos")
          .select("id, valor_centavos, status, metodo, pago_em, criado_em, assinaturas(planos(nome))")
          .eq("usuario_id", session.user.id)
          .order("criado_em", { ascending: false }),
      ]);
      if (!active) return;
      if (assinatura) {
        const planoObj = Array.isArray(assinatura.planos) ? assinatura.planos[0] : assinatura.planos;
        setPlano({
          plano_nome: (planoObj as { nome?: string } | null)?.nome ?? "Plano",
          inicio_em: assinatura.inicio_em,
          termino_em: assinatura.termino_em,
          status: assinatura.status,
        });
      }
      if (pagos) {
        setPagamentos(
          pagos.map((p) => {
            const sub = p.assinaturas as { planos?: { nome?: string } | { nome?: string }[] } | null;
            const planoNome = sub?.planos ? (Array.isArray(sub.planos) ? sub.planos[0]?.nome : sub.planos.nome) : null;
            return {
              id: p.id,
              valor_centavos: p.valor_centavos,
              status: p.status,
              metodo: p.metodo,
              pago_em: p.pago_em,
              criado_em: p.criado_em,
              plano_nome: planoNome ?? null,
            };
          })
        );
      }
      setCarregando(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const fmtData = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

  return (
    <div>
      <motion.div {...fade}>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Sua assinatura</p>
        <h1 className="mt-2 font-serif text-[clamp(1.9rem,3vw,2.6rem)] leading-[1] tracking-[-.03em] text-navy">
          Finanças<span className="text-gold">.</span>
        </h1>
        <p className="mt-2 max-w-[520px] text-[12px] leading-5 text-graphite/55">
          Veja o status da sua assinatura, quando ela renova e o histórico de cobranças da Fostern.
        </p>
      </motion.div>

      {carregando ? (
        <p className="mt-8 text-[12px] text-graphite/55">Carregando…</p>
      ) : (
        <>
          <motion.section {...fade} transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }} className="mt-8 flex flex-col justify-between gap-6 rounded-lg bg-navy p-6 text-ivory md:flex-row md:items-end md:p-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">
                {plano?.status === "ativa" ? "Plano ativo" : "Plano atual"}
              </p>
              <p className="mt-3 font-serif text-[clamp(1.6rem,3vw,2.4rem)] leading-tight tracking-[-.02em]">{plano?.plano_nome ?? "Plano gratuito"}</p>
              {plano?.status === "ativa" ? (
                <p className="mt-2 text-[12px] text-ivory/60">
                  Ativo desde {fmtData(plano.inicio_em)} · renova em {fmtData(plano.termino_em)}
                </p>
              ) : (
                <p className="mt-2 text-[12px] text-ivory/60">Você está aproveitando as aulas de amostra.</p>
              )}
            </div>
            {plano?.status !== "ativa" && (
              <Link href="/planos" className="inline-flex min-h-11 items-center justify-center gap-3 border border-gold bg-gold px-5 text-[11px] font-bold text-navy transition-colors hover:bg-gold/90">
                Assinar um plano
              </Link>
            )}
          </motion.section>

          <motion.section {...fade} transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 1, 0.36, 1] }} className="mt-6 rounded-lg border border-mist bg-white">
            <div className="border-b border-mist px-5 py-4 md:px-7">
              <h2 className="font-serif text-[1.3rem] tracking-[-.02em] text-navy">Histórico de pagamentos</h2>
            </div>
            {pagamentos.length === 0 ? (
              <div className="p-10 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-navy text-gold">
                  <Icon d={icons.receipt} className="h-5 w-5" />
                </span>
                <p className="mt-4 text-[13px] font-semibold text-navy">Nenhum pagamento ainda.</p>
                <p className="mt-1 text-[12px] leading-5 text-graphite/55">Ao assinar, cada cobrança e reembolso aparecem aqui com data e valor.</p>
              </div>
            ) : (
              <ul className="divide-y divide-mist/80">
                {pagamentos.map((p) => {
                  const st = statusPagamento[p.status] ?? statusPagamento.pendente;
                  return (
                    <li key={p.id} className="flex items-center gap-4 px-5 py-4 md:px-7">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-mist bg-ivory text-graphite/50">
                        <Icon d={p.status === "pago" ? icons.check : icons.pending} className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-navy">
                          {p.plano_nome ?? "Assinatura Fostern"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-graphite/55">
                          {fmtData(p.pago_em ?? p.criado_em)} · {p.metodo === "cartao" ? "Cartão" : (p.metodo ?? "—")}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] ${st.color}`}>
                        {st.label}
                      </span>
                      <span className="w-24 shrink-0 text-right font-serif text-[16px] text-navy">{fmtValor(p.valor_centavos)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.section>
        </>
      )}
    </div>
  );
}
