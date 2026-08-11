"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MODULE, completedCount } from "@/lib/learning";
import { useProgress } from "@/lib/use-progress";
import { useUser } from "@/lib/use-user";

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function Dashboard() {
  const { progress: learning } = useProgress();
  const { user } = useUser();

  const doneLessons = completedCount(learning);
  const pct = Math.round((doneLessons / MODULE.totalLessons) * 100);
  const currentLesson = MODULE.lessons.find((lesson) => !learning[lesson.id]) ?? MODULE.lessons[0];

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
        <Link href="/dashboard/aprender" className="group block p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-6">
            <div className="min-w-0 max-w-[560px]">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Continue aprendendo</p>
              <h2 className="mt-3 font-serif text-[clamp(1.4rem,2.3vw,1.9rem)] leading-tight tracking-[-.02em]">{MODULE.title}</h2>
              <p className="mt-2 text-[12px] leading-5 text-ivory/60">Aula {currentLesson.number}: {currentLesson.title}</p>
              <div className="mt-5 flex items-center gap-4">
                <div className="w-full max-w-[380px]">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-[.12em]">
                    <span className="text-ivory/55">{doneLessons} de {MODULE.totalLessons} aulas concluídas</span>
                    <span className="text-gold">{pct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-gold"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="inline-flex min-h-12 items-center justify-center gap-4 border border-gold bg-gold px-5 text-[11px] font-bold text-navy transition-[padding,transform] duration-500 ease-out group-hover:-translate-y-0.5 group-hover:px-7">
                Continuar módulo <span aria-hidden="true" className="text-base leading-none">→</span>
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
            {MODULE.lessons.map((lesson) => {
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
            {MODULE.locked.map((locked) => (
              <span
                key={`locked-${locked.number}`}
                className="grid h-7 w-7 place-items-center rounded-[5px] border border-white/10 text-[10px] text-ivory/25"
              >
                ·
              </span>
            ))}
          </div>
        </Link>
      </motion.section>

      <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: "Progresso do módulo", value: `${pct}%`, meta: `${doneLessons} de ${MODULE.totalLessons} aulas`, bar: pct, max: 100 },
          { label: "Aulas concluídas", value: `${doneLessons}`, meta: `módulo 1 · ${MODULE.title.split(":")[0]}`, bar: doneLessons, max: MODULE.totalLessons },
          { label: "Candidaturas", value: "0", meta: "nenhuma adicionada", bar: 0, max: 1 },
          { label: "Mentorias", value: "0", meta: "nenhuma agendada", bar: 0, max: 1 },
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

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <motion.section {...fade} transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-mist bg-white p-5 md:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-[1.35rem] tracking-[-.02em] text-navy">Sua jornada</h2>
            <Link href="/dashboard/aprender" className="text-[11px] font-bold text-gold hover:text-navy">Começar →</Link>
          </div>
          <div className="mt-6 flex items-start gap-4 rounded-md border border-mist bg-ivory p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy text-gold">
              <Icon d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-navy">Sua jornada ainda não começou.</p>
              <p className="mt-1 text-[12px] leading-5 text-graphite/60">
                Complete a primeira aula do módulo 1 e seus marcos vão aparecer aqui, um a um.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section {...fade} transition={{ duration: 0.7, delay: 0.38, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-mist bg-white p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-[1.35rem] tracking-[-.02em] text-navy">Próximos prazos</h2>
          </div>
          <p className="mt-5 text-[12px] leading-5 text-graphite/55">
            Nenhum prazo por enquanto. Seus compromissos e prazos de candidatura vão aparecer aqui conforme você avança.
          </p>
          <a href="#" onClick={(e) => e.preventDefault()} className="mt-4 block rounded-md border border-mist bg-ivory py-3 text-center text-[11px] font-bold text-navy transition-colors hover:border-gold hover:text-gold">
            Abrir calendário
          </a>
        </motion.section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <motion.section {...fade} transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-mist bg-white p-5 md:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-[1.35rem] tracking-[-.02em] text-navy">Universidades na mira</h2>
            <Link href="/dashboard/metas" className="text-[11px] font-bold text-gold hover:text-navy">Gerir lista →</Link>
          </div>
          <p className="mt-5 text-[12px] leading-5 text-graphite/55">
            Sua lista está vazia. Quando sua estratégia for definida, as universidades-alvo vão aparecer aqui com prazos e taxa de admissão.
          </p>
        </motion.section>

        <motion.section {...fade} transition={{ duration: 0.7, delay: 0.52, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col rounded-lg border border-mist bg-navy p-5 text-ivory md:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Próxima mentoria</p>
          <p className="mt-4 font-serif text-[1.6rem] leading-tight tracking-[-.02em]">Nenhuma sessão agendada.</p>
          <div className="mt-5 space-y-2.5 text-[12px] text-ivory/70">
            <p className="flex items-center gap-2.5"><Icon d="M4 7h16M4 7v9.5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5V7M4 7l2.5-3h11l2.5 3M9 15.5h6" className="h-4 w-4 text-gold" /> Você será convidado para suas mentorias aqui.</p>
            <p className="flex items-center gap-2.5"><Icon d="M12 3v3M5.6 5.6l2.1 2.1M3 12h3M18.4 5.6l-2.1 2.1M21 12h-3M12 21v-3M15.5 15.5l2 2M8.5 15.5l-2 2" className="h-4 w-4 text-gold" /> Acompanhe datas, temas e pauta de cada encontro.</p>
          </div>
          <Link href="/dashboard/mentoria" className="mt-5 rounded-md border border-gold bg-gold py-3 text-center text-[11px] font-bold text-navy transition-colors hover:bg-gold/90">
            Agendar sessão
          </Link>
        </motion.section>
      </div>
    </div>
  );
}
