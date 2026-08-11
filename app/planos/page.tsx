"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useActivePlan } from "@/lib/use-active-plan";
import { formatarBRL, periodoLabel, type Plan } from "@/lib/plans";

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const check = "M5 13l4 4L19 7";
const back = "M15 6l-6 6 6 6";
const lock = "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3";
const spark = "M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z";

const featuresBySlug: Record<string, string[]> = {
  gratuito: [
    "Aulas 1 e 2 do módulo 1",
    "Entenda como funciona uma candidatura internacional",
    "Extracurriculares: o que realmente importa",
    "Exercício com correção e explicação",
  ],
  mensal: [
    "Acesso a todos os módulos",
    "Tutor de IA — assistente de estudos com o método Fostern",
    "Acesso à comunidade",
    "Estratégia para SAT e TOEFL",
    "Ensaios pessoais e recomendações",
    "Mentoria individual",
  ],
  anual: [
    "Tudo do plano Mensal",
    "Economia frente ao valor mensal",
    "Prioridade na mentoria",
    "Revisão de redações e projetos",
  ],
};

const incluido = [
  { termo: "Todos os módulos", descricao: "Módulos 1 a 8 com aulas, exercícios e correção.", icone: "M12 6.2c-1.7-1.1-4-1.6-6.4-1.6v13.2c2.4 0 4.7.5 6.4 1.6M12 6.2c1.7-1.1 4-1.6 6.4-1.6v13.2c-2.4 0-4.7.5-6.4 1.6M12 6.2v13.2" },
  { termo: "Tutor de IA", descricao: "Tire dúvidas, revise ensaios e organize o estudo a qualquer hora.", icone: "M4 4h13a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9l-4.5 4.5V8a4 4 0 0 1 4-4H4zM8.5 9h7M8.5 13h4" },
  { termo: "Comunidade", descricao: "Converse com outros estudantes na mesma jornada.", icone: "M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" },
  { termo: "Mentoria individual", descricao: "Sessões com mentoria focada na sua candidatura.", icone: "M2.5 20.5c.8-3 3-4.5 5-4.5s4.2 1.5 5 4.5M7.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" },
];

export default function PlanosPage() {
  const router = useRouter();
  const supabase = createClient();
  const { loading, ativo } = useActivePlan();
  const [planos, setPlanos] = useState<Plan[]>([]);
  const [assinarSlug, setAssinarSlug] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("planos").select("*").eq("ativo", true).order("preco_centavos");
      if (active && data) setPlanos(data as Plan[]);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  const assinar = async (slug: string) => {
    if (slug === "gratuito") {
      router.push("/dashboard/aprender");
      return;
    }
    setAssinarSlug(slug);
    setErro(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setErro(data.error ?? "Não foi possível iniciar o pagamento.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setErro("Não foi possível iniciar o pagamento. Tente novamente.");
    } finally {
      setAssinarSlug(null);
    }
  };

  const sair = async () => {
    await createClient().auth.signOut();
    window.location.href = "/";
  };

  const ordenados = [...planos].sort((a, b) => (a.slug === "anual" ? -1 : b.slug === "anual" ? 1 : a.preco_centavos - b.preco_centavos));

  return (
    <div className="min-h-[100svh] bg-ivory">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy text-ivory">
        <div className="mx-auto flex h-14 w-[min(100%-32px,1000px)] items-center gap-3">
          <button
            type="button"
            onClick={() => (ativo ? router.push("/dashboard") : router.push("/"))}
            className="group flex items-center gap-1.5 text-[12px] font-semibold text-ivory/70 transition-colors hover:text-gold"
          >
            <Icon d={back} className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">{ativo ? "Painel" : "Início"}</span>
          </button>
          <div className="mx-auto flex min-w-0 items-center gap-2 text-[9px] font-bold uppercase tracking-[.14em] text-ivory/40">
            <span>Fostern</span>
            <span className="text-gold">·</span>
            <span className="truncate text-gold">Planos</span>
          </div>
          <button
            type="button"
            onClick={sair}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-ivory/70 transition-colors hover:text-gold"
          >
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-[min(100%-32px,1000px)] py-12 md:py-20">
        <div className="max-w-[640px]">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-gold">
            <Icon d={spark} className="h-4 w-4" /> Plano certo, ambição à altura
          </p>
          <h1 className="mt-4 font-serif text-[clamp(2.1rem,4.5vw,3.4rem)] leading-[.98] tracking-[-.04em] text-navy">
            {ativo ? "Você já está no plano <em className='text-gold'>completo.</em>" : "Libere a plataforma completa."}
          </h1>
          <p className="mt-4 text-[14px] leading-7 text-graphite/75">
            {ativo
              ? "Sua assinatura está ativa. Continue de onde parou."
              : "Comece grátis com as primeiras aulas do módulo 1 e assine quando estiver pronto para o caminho completo."}
          </p>
        </div>

        {erro && (
          <div className="mt-8 rounded-md border border-[#E0A18C]/50 bg-[#FBF1EC] px-5 py-4 text-[13px] leading-6 text-[#C96A52]">
            {erro}
          </div>
        )}

        {loading ? (
          <p className="mt-14 text-[13px] text-graphite/50">Carregando planos…</p>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {ordenados.map((plano, index) => {
              const gratuito = plano.slug === "gratuito";
              const destaque = plano.slug === "anual";
              const escolhido = ativo && plano.slug !== "gratuito";
              return (
                <div
                  key={plano.id}
                  className={`relative flex flex-col border p-7 md:p-8 ${
                    destaque ? "border-navy bg-navy text-ivory shadow-[0_24px_60px_-30px_rgba(8,29,54,.55)]" : "border-mist bg-white"
                  }`}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {destaque && (
                    <span className="absolute -top-2.5 left-7 bg-gold px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.14em] text-navy">
                      Melhor valor
                    </span>
                  )}
                  <p className={`text-[10px] font-bold uppercase tracking-[.16em] ${destaque ? "text-gold" : "text-deep-navy"}`}>
                    {plano.nome}
                  </p>
                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className={`font-serif text-[clamp(2rem,4vw,2.9rem)] leading-none tracking-[-.03em] ${destaque ? "text-ivory" : "text-navy"}`}>
                      {formatarBRL(plano.preco_centavos)}
                    </span>
                    {plano.periodo !== "avulso" && (
                      <span className={`text-[12px] ${destaque ? "text-ivory/70" : "text-graphite/60"}`}>{periodoLabel(plano.periodo)}</span>
                    )}
                  </div>
                  <p className={`mt-3 text-[12px] leading-5 ${destaque ? "text-ivory/75" : "text-graphite/70"}`}>{plano.descricao}</p>

                  <ul className="mt-7 flex-1 space-y-3">
                    {(featuresBySlug[plano.slug] ?? []).map((feature) => (
                      <li key={feature} className={`flex items-start gap-2.5 text-[12px] leading-5 ${destaque ? "text-ivory/85" : "text-graphite/80"}`}>
                        <Icon d={check} className={`mt-[3px] h-3.5 w-3.5 shrink-0 ${destaque ? "text-gold" : "text-gold"}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() => assinar(plano.slug)}
                      disabled={assinarSlug !== null || escolhido}
                      className={`inline-flex min-h-12 w-full items-center justify-center gap-3 border px-6 text-[11px] font-bold transition-colors duration-300 disabled:cursor-wait disabled:opacity-60 ${
                        escolhido
                          ? "cursor-default border-gold/40 bg-gold/15 text-gold"
                          : destaque
                            ? "border-gold bg-gold text-navy hover:bg-gold/90"
                            : "border-navy bg-navy text-ivory hover:bg-deep-navy"
                      }`}
                    >
                      {escolhido ? (
                        <>
                          <Icon d={check} className="h-4 w-4" /> Plano ativo
                        </>
                      ) : assinarSlug === plano.slug ? (
                        "Abrindo pagamento…"
                      ) : gratuito ? (
                        "Começar grátis"
                      ) : (
                        "Assinar agora"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-16">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">O que está incluído</p>
          <h2 className="mt-3 max-w-xl font-serif text-[clamp(1.6rem,3.4vw,2.3rem)] leading-tight tracking-[-.03em] text-navy">
            Uma preparação completa, do planejamento à candidatura.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {incluido.map((item) => (
              <div key={item.termo} className="border border-mist bg-white p-5">
                <span className="grid h-11 w-11 place-items-center rounded-md border border-mist bg-ivory text-gold">
                  <Icon d={item.icone} className="h-5 w-5" />
                </span>
                <p className="mt-4 font-serif text-[17px] tracking-[-.02em] text-navy">{item.termo}</p>
                <p className="mt-1.5 text-[11px] leading-5 text-graphite/60">{item.descricao}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[10px] leading-5 text-graphite/50">
            A Tutora IA é exclusiva de planos pagos e tem limite diário de mensagens para uso responsável.
          </p>
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-md bg-mist/60 p-5 text-[12px] leading-5 text-graphite/70">
          <Icon d={lock} className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <p>
            Pagamento seguro processado pela Stripe (cartão ou Pix). Cancele quando quiser. Sem assinatura ativa, você continua no
            plano gratuito com as aulas de amostra — <Link href="/dashboard/aprender" className="font-semibold text-navy underline decoration-gold underline-offset-2">experimente agora</Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
