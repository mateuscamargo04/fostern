"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MODULES, TOTAL_LESSONS, completedCount, moduleDoneCount, isModuleAccessible, isLessonAccessible } from "@/lib/learning";
import { useProgress } from "@/lib/use-progress";
import { useUser } from "@/lib/use-user";
import { useActivePlan } from "@/lib/use-active-plan";
import { createClient } from "@/lib/supabase/client";

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const STATUS_LABEL: Record<string, string> = {
  planejada: "Planejada",
  em_progresso: "Em progresso",
  enviada: "Enviada",
  aceita: "Aceita",
  recusada: "Recusada",
};

const statusColors: Record<string, string> = {
  planejada: "border-mist bg-ivory text-graphite/60",
  em_progresso: "border-gold/50 bg-gold/[.08] text-navy",
  enviada: "border-navy bg-navy text-ivory",
  aceita: "border-gold bg-gold text-navy",
  recusada: "border-[#E0A18C]/60 bg-[#FBF1EC] text-[#C96A52]",
};

type Universidade = {
  id: string;
  nome: string;
  pais: string | null;
  curso: string | null;
  prazo_candidatura: string | null;
  taxa_candidatura: string | null;
  status: string;
  nota: number | null;
};

type Mentoria = {
  id: string;
  mentor_nome: string | null;
  agendada_para: string | null;
  duracao_min: number | null;
  status: string;
};

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const icons = {
  spark: "M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z",
  uni: "M12 2.5 3 6.5v5c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10v-5l-9-4zM8.5 12l2.5 2.5 4.5-5",
  check: "M5 13l4 4L19 7",
  arrow: "M5 12h14M13 6l6 6-6 6",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5z",
  calendar: "M8 2v4M16 2v4M3 9h18M4.5 5h15a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-13A1.5 1.5 0 0 1 4.5 5z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",
} as const;

function formatarData(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatarDataLonga(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date(0);
  if (Number.isNaN(d.getTime())) return "Sessão agendada";
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

function formatarHora(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function Skeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <div>
        <div className="h-3 w-40 rounded bg-mist/70" />
        <div className="mt-3 h-8 w-64 rounded bg-mist/70" />
      </div>
      <div className="h-56 rounded-lg bg-mist/40" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-mist/60" />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { progress: learning, ready: progressReady } = useProgress();
  const { user } = useUser();
  const { loading: planoCargando, ativo: planoAtivo } = useActivePlan();

  const [mounted, setMounted] = useState(false);
  const [universidades, setUniversidades] = useState<Universidade[]>([]);
  const [mentorias, setMentorias] = useState<Mentoria[]>([]);
  const [dadosCarregando, setDadosCarregando] = useState(true);
  const [modulosVisiveis, setModulosVisiveis] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          if (active) setDadosCarregando(false);
          return;
        }
        const [unisRes, mentRes] = await Promise.all([
          supabase.from("universidades").select("*").order("nota", { ascending: false }).order("nome"),
          supabase.from("mentorias").select("*").eq("status", "agendada").order("agendada_para", { ascending: true }),
        ]);
        if (!active) return;
        if (unisRes.error) console.warn("universidades:", unisRes.error.message);
        else if (unisRes.data) setUniversidades(unisRes.data as Universidade[]);
        if (mentRes.error) console.warn("mentorias:", mentRes.error.message);
        else if (mentRes.data) setMentorias(mentRes.data as Mentoria[]);
      } catch (e) {
        console.warn("Falha ao carregar a visão geral:", e);
      } finally {
        if (active) setDadosCarregando(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!mounted) return <Skeleton />;

  const doneLessons = completedCount(learning);
  const pct = Math.round((doneLessons / TOTAL_LESSONS) * 100);

  const currentModule =
    MODULES.find((m) => isModuleAccessible(m, !!planoAtivo) && m.lessons.some((l) => isLessonAccessible(m, l, !!planoAtivo) && !learning[l.id])) ?? MODULES[0];
  const currentLesson =
    currentModule.lessons.find((l) => isLessonAccessible(currentModule, l, !!planoAtivo) && !learning[l.id]) ??
    currentModule.lessons.find((l) => isLessonAccessible(currentModule, l, !!planoAtivo)) ??
    currentModule.lessons[0];
  const moduleDone = moduleDoneCount(currentModule, learning);
  const modulePct = Math.round((moduleDone / currentModule.totalLessons) * 100);

  const modulosIniciados = MODULES.filter((m) => moduleDoneCount(m, learning) > 0).length;
  const proximaMentoria = mentorias.find((m) => {
    const data = m.agendada_para ? new Date(m.agendada_para).getTime() : 0;
    return !Number.isNaN(data) && data >= Date.now();
  });

  const jornadaUrl = `/dashboard/aprender?modulo=${currentModule.slug}`;
  const aulaUrl = `${jornadaUrl}&aula=${currentLesson.id}`;

  const carregandoGeral = dadosCarregando || !progressReady || planoCargando;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const todayLabel = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const todayLabelCapitalized = todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1);

  return (
    <div>
      <motion.div {...fade}>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">{todayLabelCapitalized}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-serif text-[clamp(1.9rem,3vw,2.6rem)] leading-[1] tracking-[-.03em] text-navy">
            {greeting}, {user?.firstName ?? "estudante"}<span className="text-gold">.</span>
          </h1>
          <p className="text-[12px] text-graphite/55">Seu painel começa limpo — a primeira aula é o primeiro passo.</p>
        </div>
      </motion.div>

      <motion.section
        {...fade}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 overflow-hidden rounded-lg bg-navy text-ivory"
      >
        <Link href={jornadaUrl} className="group block p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-6">
            <div className="min-w-0 max-w-[560px]">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Continue aprendendo</p>
              <h2 className="mt-3 font-serif text-[clamp(1.4rem,2.3vw,1.9rem)] leading-tight tracking-[-.02em]">
                {currentModule.title}
              </h2>
              <p className="mt-2 text-[12px] leading-5 text-ivory/60">
                {doneLessons > 0 ? `Próxima: Aula ${currentLesson.number} — ${currentLesson.title}` : `Aula ${currentLesson.number}: ${currentLesson.title}`}
              </p>
              <div className="mt-5 flex items-center gap-4">
                <div className="w-full max-w-[380px]">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-[.12em]">
                    <span className="text-ivory/55">{moduleDone} de {currentModule.totalLessons} aulas do módulo concluídas</span>
                    <span className="text-gold">{modulePct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${modulePct}%` }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-gold"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="inline-flex min-h-12 items-center justify-center gap-4 border border-gold bg-gold px-5 text-[11px] font-bold text-navy transition-[padding,transform] duration-500 ease-out group-hover:-translate-y-0.5 group-hover:px-7">
                {doneLessons > 0 ? "Continuar módulo" : "Começar módulo"} <span aria-hidden="true" className="text-base leading-none">→</span>
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
            {currentModule.lessons.map((lesson) => {
              const isDone = !!learning[lesson.id];
              const isCurrent = lesson.id === currentLesson.id && !isDone;
              return (
                <span
                  key={lesson.id}
                  className={`grid h-7 w-7 place-items-center rounded-[5px] border text-[10px] font-bold ${
                    isDone
                      ? "border-gold bg-gold text-navy"
                      : isCurrent
                        ? "border-gold text-gold"
                        : "border-white/20 text-ivory/35"
                  }`}
                >
                  {isDone ? "✓" : lesson.number}
                </span>
              );
            })}
          </div>
        </Link>
      </motion.section>

      <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: "Progresso da trilha", value: `${pct}%`, meta: `${doneLessons} de ${TOTAL_LESSONS} aulas`, bar: pct, max: 100 },
          { label: "Aulas concluídas", value: `${doneLessons}`, meta: `${modulosIniciados} ${modulosIniciados === 1 ? "módulo iniciado" : "módulos iniciados"}`, bar: doneLessons, max: TOTAL_LESSONS },
          { label: "Candidaturas", value: `${universidades.length}`, meta: universidades.length === 0 ? "nenhuma adicionada" : "na sua lista", bar: Math.min(universidades.length, 10), max: 10 },
          { label: "Mentorias", value: `${mentorias.length}`, meta: mentorias.length === 0 ? "nenhuma agendada" : "agendada(s)", bar: Math.min(mentorias.length, 5), max: 5 },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            {...fade}
            transition={{ duration: 0.7, delay: 0.08 * (i + 1), ease: [0.22, 1, 0.36, 1] }}
            className="rounded-lg border border-mist bg-white p-4 md:p-5"
          >
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-graphite/45">{card.label}</p>
            <p className="mt-2 font-serif text-[1.9rem] leading-none tracking-[-.02em] text-navy md:text-[2.2rem]">{card.value}</p>
            <p className="mt-1.5 text-[10px] text-graphite/50">{card.meta}</p>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-mist">
              <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, (card.bar / (card.max ?? 100)) * 100)}%` }} />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.section
        {...fade}
        transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-[1.45rem] tracking-[-.02em] text-navy">Seus módulos</h2>
            <p className="mt-1 text-[12px] text-graphite/55">10 módulos, da base até a decisão final. {TOTAL_LESSONS} aulas no total.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setModulosVisiveis((v) => !v)}
              aria-expanded={modulosVisiveis}
              className="text-[11px] font-bold text-graphite/50 transition-colors hover:text-navy"
            >
              {modulosVisiveis ? "Ocultar módulos" : "Mostrar módulos"}
            </button>
            <Link href="/dashboard/aprender" className="text-[11px] font-bold text-gold hover:text-navy">Ver trilha completa →</Link>
          </div>
        </div>
        {modulosVisiveis && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {MODULES.map((module, index) => {
            const acessivel = isModuleAccessible(module, !!planoAtivo);
            const mDone = moduleDoneCount(module, learning);
            const mPct = Math.round((mDone / module.totalLessons) * 100);
            const concluido = mDone === module.totalLessons;
            return (
              <Link
                key={module.slug}
                href={acessivel ? `/dashboard/aprender?modulo=${module.slug}` : "/planos"}
                className={`group flex flex-col rounded-lg border p-5 transition-colors ${acessivel ? "border-mist bg-white hover:border-gold/70" : "border-mist bg-mist/30"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-bold uppercase tracking-[.14em] text-gold">Módulo {module.number}</span>
                  {!acessivel ? (
                    <span className="flex items-center gap-1.5 rounded-full border border-mist px-2 py-0.5 text-[8px] font-bold uppercase tracking-[.1em] text-graphite/50">
                      <Icon d={icons.lock} className="h-3 w-3" /> Plano pago
                    </span>
                  ) : concluido ? (
                    <span className="rounded-full bg-gold px-2 py-0.5 text-[8px] font-bold uppercase tracking-[.1em] text-navy">Concluído</span>
                  ) : mDone > 0 ? (
                    <span className="rounded-full border border-gold/50 bg-gold/[.08] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[.1em] text-navy">Em andamento</span>
                  ) : null}
                </div>
                <h3 className={`mt-2.5 font-serif text-[17px] leading-snug tracking-[-.01em] ${acessivel ? "text-navy" : "text-graphite/55"}`}>{module.title}</h3>
                <div className="mt-4">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-[.1em]">
                    <span className="text-graphite/45">{mDone} de {module.totalLessons} aulas</span>
                    <span className="text-gold">{acessivel ? `${mPct}%` : "—"}</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-mist">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${acessivel ? mPct : 0}%` }} />
                  </div>
                </div>
                <span className={`mt-4 text-[10px] font-bold transition-colors ${acessivel ? "text-gold group-hover:text-navy" : "text-graphite/50"}`}>
                  {!acessivel ? "Assinar para liberar" : concluido ? "Rever módulo" : mDone > 0 ? "Continuar →" : "Começar →"}
                </span>
              </Link>
            );
          })}
          </div>
        )}
      </motion.section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <motion.section {...fade} transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-mist bg-white p-5 md:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-[1.35rem] tracking-[-.02em] text-navy">Sua jornada</h2>
            <Link href={jornadaUrl} className="text-[11px] font-bold text-gold hover:text-navy">Continuar →</Link>
          </div>
          {carregandoGeral ? (
            <p className="mt-6 text-[12px] text-graphite/55">Carregando seu progresso…</p>
          ) : doneLessons === 0 ? (
            <div className="mt-6 flex items-start gap-4 rounded-md border border-mist bg-ivory p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy text-gold">
                <Icon d={icons.spark} className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-navy">Sua jornada ainda não começou.</p>
                <p className="mt-1 text-[12px] leading-5 text-graphite/60">
                  Complete a primeira aula do módulo 1 e seus marcos vão aparecer aqui, um a um.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-4 rounded-md border border-mist bg-ivory p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-navy">
                  <Icon d={icons.check} className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-navy">Você está em movimento.</p>
                  <p className="mt-1 text-[12px] leading-5 text-graphite/60">
                    {doneLessons} {doneLessons === 1 ? "aula concluída" : "aulas concluídas"} · {modulosIniciados} {modulosIniciados === 1 ? "módulo iniciado" : "módulos iniciados"} · {universidades.length} {universidades.length === 1 ? "universidade na mira" : "universidades na mira"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 rounded-md border border-gold/40 bg-gold/[.05] p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy text-gold">
                  <Icon d={icons.book} className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold">Próxima aula</p>
                  <p className="mt-1 text-[13px] font-semibold text-navy">{currentLesson.title}</p>
                  <p className="mt-0.5 text-[11px] text-graphite/55">Módulo {currentModule.number} · Aula {currentLesson.number}</p>
                </div>
                <Link
                  href={aulaUrl}
                  className="inline-flex min-h-10 items-center gap-2 border border-gold bg-gold px-4 text-[10px] font-bold text-navy transition-colors hover:bg-gold/90"
                >
                  Continuar <Icon d={icons.arrow} className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </motion.section>

        <motion.section {...fade} transition={{ duration: 0.7, delay: 0.38, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-mist bg-white p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-[1.35rem] tracking-[-.02em] text-navy">Próximos prazos</h2>
          </div>
          {dadosCarregando ? (
            <p className="mt-5 text-[12px] text-graphite/55">Carregando…</p>
          ) : universidades.some((uni) => uni.prazo_candidatura) ? (
            <ul className="mt-5 space-y-3">
              {universidades
                .filter((uni) => uni.prazo_candidatura)
                .slice(0, 3)
                .map((uni) => {
                  const prazo = formatarData(uni.prazo_candidatura);
                  return prazo ? (
                    <li key={uni.id} className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-mist bg-ivory text-gold">
                        <Icon d={icons.calendar} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-navy">{uni.nome}</p>
                        <p className="text-[10px] text-graphite/55">Prazo: {prazo}</p>
                      </div>
                    </li>
                  ) : null;
                })}
            </ul>
          ) : (
            <p className="mt-5 text-[12px] leading-5 text-graphite/55">
              Nenhum prazo por enquanto. Os prazos de candidatura aparecem aqui conforme você adiciona universidades na sua lista.
            </p>
          )}
          <Link href="/dashboard/metas" className="mt-4 block rounded-md border border-mist bg-ivory py-3 text-center text-[11px] font-bold text-navy transition-colors hover:border-gold hover:text-gold">
            Gerenciar universidades
          </Link>
        </motion.section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <motion.section {...fade} transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-mist bg-white p-5 md:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-[1.35rem] tracking-[-.02em] text-navy">Universidades na mira</h2>
            <Link href="/dashboard/metas" className="text-[11px] font-bold text-gold hover:text-navy">Gerir lista →</Link>
          </div>
          {dadosCarregando ? (
            <p className="mt-5 text-[12px] text-graphite/55">Carregando…</p>
          ) : universidades.length === 0 ? (
            <p className="mt-5 text-[12px] leading-5 text-graphite/55">
              Sua lista está vazia. Quando sua estratégia for definida, as universidades-alvo vão aparecer aqui com prazos e taxa de admissão.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-mist/80">
              {universidades.slice(0, 4).map((uni) => (
                <li key={uni.id} className="flex items-center gap-4 py-3.5 first:pt-1 last:pb-1">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-mist bg-ivory text-gold">
                    <Icon d={icons.uni} className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="truncate text-[13px] font-semibold text-navy">{uni.nome}</p>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] ${statusColors[uni.status] ?? statusColors.planejada}`}>
                        {STATUS_LABEL[uni.status] ?? uni.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-graphite/55">
                      {[uni.pais, uni.curso].filter(Boolean).join(" · ") || "Sem detalhes"}
                      {uni.prazo_candidatura ? ` · Prazo: ${formatarData(uni.prazo_candidatura)}` : ""}
                    </p>
                  </div>
                  {uni.nota ? (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold/50 bg-gold/[.08] text-[10px] font-bold text-gold">{uni.nota}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {universidades.length > 4 && (
            <Link href="/dashboard/metas" className="mt-4 block text-center text-[11px] font-bold text-gold hover:text-navy">
              Ver todas as {universidades.length} universidades →
            </Link>
          )}
        </motion.section>

        <motion.section {...fade} transition={{ duration: 0.7, delay: 0.52, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col rounded-lg border border-mist bg-navy p-5 text-ivory md:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Próxima mentoria</p>
          {proximaMentoria ? (
            <>
              <p className="mt-4 font-serif text-[1.4rem] leading-tight tracking-[-.02em]">
                {formatarDataLonga(proximaMentoria.agendada_para)}
              </p>
              <p className="mt-1 text-[12px] text-ivory/70">
                {formatarHora(proximaMentoria.agendada_para)}
                {proximaMentoria.mentor_nome ? ` · com ${proximaMentoria.mentor_nome}` : ""}
                {proximaMentoria.duracao_min ? ` · ${proximaMentoria.duracao_min} min` : ""}
              </p>
            </>
          ) : (
            <>
              <p className="mt-4 font-serif text-[1.6rem] leading-tight tracking-[-.02em]">Nenhuma sessão agendada.</p>
              <div className="mt-5 space-y-2.5 text-[12px] text-ivory/70">
                <p className="flex items-center gap-2.5"><Icon d={icons.calendar} className="h-4 w-4 text-gold" /> Você será convidado para suas mentorias aqui.</p>
                <p className="flex items-center gap-2.5"><Icon d={icons.clock} className="h-4 w-4 text-gold" /> Acompanhe datas, temas e pauta de cada encontro.</p>
              </div>
            </>
          )}
          <Link href="/dashboard/mentoria" className="mt-5 rounded-md border border-gold bg-gold py-3 text-center text-[11px] font-bold text-navy transition-colors hover:bg-gold/90">
            {proximaMentoria ? "Ver detalhes" : "Agendar sessão"}
          </Link>
        </motion.section>
      </div>
    </div>
  );
}
