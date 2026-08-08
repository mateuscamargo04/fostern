"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MODULE, completedCount, loadProgress } from "@/lib/learning";

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

const navItems = [
  { label: "Visão geral", d: "M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5", active: true },
  { label: "Minha jornada", d: "M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6.6 5.5 5.5 0 0 1 21.5 12C19 16.5 12 21 12 21z" },
  { label: "Metas & universidades", d: "M12 2.5 3 6.5v5c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10v-5l-9-4zM8.5 12l2.5 2.5 4.5-5" },
  { label: "Documentos", d: "M14 2.5H7a1.5 1.5 0 0 0-1.5 1.5v16A1.5 1.5 0 0 0 7 21.5h10a1.5 1.5 0 0 0 1.5-1.5V8zM14 2.5V8h5.5M9 13h6M9 17h6" },
  { label: "Mentoria", d: "M2.5 20.5c.8-3 3-4.5 5-4.5s4.2 1.5 5 4.5M7.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM16 6.5a3.5 3.5 0 1 0-1.2 2.7M14.5 16.6c1.8-.4 3.8 0 5 1.9M19 4.5l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z", className: "h-[18px] w-[18px]" },
  { label: "Finanças", d: "M3.5 7.5A1.5 1.5 0 0 1 5 6h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 18H5a1.5 1.5 0 0 1-1.5-1.5zM3.5 10h17M16.5 14.5h2" },
  { label: "Comunidade", d: "M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" },
];

const timeline = [
  { title: "Diagnóstico inicial", note: "Perfil, histórico e pontos fortes mapeados", date: "Fev 2026", status: "done" },
  { title: "Estratégia definida", note: "Lista curta de universidades e plano de trabalho", date: "Mar 2026", status: "done" },
  { title: "Construção do perfil acadêmico", note: "Projeto autoral em andamento · 78%", date: "Agora", status: "current" },
  { title: "Testes padronizados", note: "SAT & IELTS agendados", date: "Set 2026", status: "upcoming" },
  { title: "Essays & candidaturas", note: "Redação e envio dos materiais", date: "Nov 2026", status: "upcoming" },
  { title: "Decisão de admissão", note: "Ciclo 2027/28", date: "2027", status: "upcoming" },
];

const deadlines = [
  { label: "Devolutiva do rascunho do perfil", date: "12 ago", tag: "Esta semana", tone: "gold" },
  { label: "Simulado SAT nº 3", date: "19 ago", tag: "Agendado", tone: "line" },
  { label: "Prazo recomendado · IELTS", date: "02 set", tag: "Meta", tone: "line" },
  { label: "Abertura de candidaturas · Oxford", date: "15 out", tag: "Janela", tone: "line" },
];

const universities = [
  { name: "MIT", place: "Cambridge, EUA", image: "/images/campuses/mit-dome-dusk.jpg", rate: "4%", fit: 92, prazo: "05 jan" },
  { name: "Oxford", place: "Oxford, Reino Unido", image: "/images/campuses/oxford.jpg", rate: "17%", fit: 86, prazo: "15 out" },
  { name: "Stanford", place: "Palo Alto, EUA", image: "/images/campuses/stanford.jpg", rate: "4%", fit: 78, prazo: "01 dez" },
];

const toneMap: Record<string, string> = {
  gold: "border-gold/50 bg-gold/10 text-gold",
  line: "border-mist bg-ivory text-graphite/70",
};

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 px-4">
      {navItems.map((item) => (
        <a
          key={item.label}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate?.();
          }}
          className={`flex items-center gap-3 rounded-md px-3.5 py-2.5 text-[12px] font-semibold transition-colors duration-200 ${
            item.active ? "bg-white/[.07] text-gold" : "text-ivory/60 hover:bg-white/[.04] hover:text-ivory"
          }`}
        >
          <Icon d={item.d} className="h-[17px] w-[17px]" />
          {item.label}
          {item.label === "Metas & universidades" && (
            <span className="ml-auto rounded-full border border-gold/40 px-1.5 py-0.5 text-[9px] font-bold leading-none text-gold">3</span>
          )}
        </a>
      ))}
    </nav>
  );
}

function MentorCard() {
  return (
    <div className="m-4 rounded-lg border border-white/10 bg-white/[.04] p-4">
      <p className="text-[9px] font-bold uppercase tracking-[.14em] text-gold">Próxima mentoria</p>
      <p className="mt-2 text-[12px] font-semibold text-ivory">Qui · 14 de ago · 15h</p>
      <p className="mt-0.5 text-[10px] leading-4 text-ivory/50">Devolutiva do perfil acadêmico</p>
    </div>
  );
}

function ProfileBlock() {
  return (
    <div className="flex items-center gap-3 border-t border-white/10 px-7 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold font-serif text-[14px] font-semibold text-navy">LM</div>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-semibold text-ivory">Lucas Martins</p>
        <p className="text-[10px] text-ivory/45">Estudante · ciclo 2027</p>
      </div>
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="px-7 pb-6 pt-7">
        <img src="/images/fostern-logo.png" alt="Fostern" className="h-auto w-36" />
        <p className="mt-5 text-[9px] font-bold uppercase tracking-[.16em] text-ivory/40">Área do estudante</p>
      </div>
      <SidebarNav onNavigate={onNavigate} />
      <MentorCard />
      <ProfileBlock />
    </>
  );
}

export default function Dashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [learning, setLearning] = useState(() => loadProgress());

  useEffect(() => {
    const sync = () => setLearning(loadProgress());
    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  const doneLessons = completedCount(learning);
  const pct = Math.round((doneLessons / MODULE.totalLessons) * 100);
  const currentLesson = MODULE.lessons.find((lesson) => !learning[lesson.id]) ?? MODULE.lessons[0];

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-[100svh] bg-mist/40 text-graphite">
      <aside className="sticky top-0 hidden h-[100svh] w-[248px] shrink-0 flex-col bg-navy text-ivory lg:flex">
        <Sidebar />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-navy/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-navy text-ivory shadow-2xl lg:hidden"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="absolute right-3 top-5 grid h-10 w-10 place-items-center border border-white/20 text-ivory transition-colors hover:border-gold hover:text-gold"
              >
                <span className="text-lg leading-none">✕</span>
              </button>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-navy px-4 py-3.5 text-ivory md:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
            className="grid h-11 w-11 shrink-0 place-items-center border border-white/25 transition-colors hover:border-gold hover:text-gold lg:hidden"
          >
            <span className="grid gap-1.5">
              <span className="h-px w-5 bg-current" />
              <span className="h-px w-5 bg-current" />
              <span className="h-px w-5 bg-current" />
            </span>
          </button>
          <div className="lg:hidden">
            <img src="/images/fostern-logo.png" alt="Fostern" className="h-auto w-28" />
          </div>
          <div className="hidden items-center gap-2 text-[12px] text-ivory/50 lg:flex">
            <span className="font-semibold text-gold">Visão geral</span>
            <span>/</span>
            <span>Início do semestre</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[12px] text-ivory/60 md:flex">
              <Icon d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3" className="h-3.5 w-3.5" />
              Buscar material, tarefa…
            </div>
            <button className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-ivory/80 transition-colors hover:border-gold hover:text-gold">
              <Icon d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-gold" />
            </button>
            <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-gold font-serif text-[13px] font-semibold text-navy sm:flex">LM</div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-8 md:px-10 md:py-10">
          <motion.div {...fade}>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Quinta-feira, 6 de agosto</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <h1 className="font-serif text-[clamp(1.9rem,3vw,2.6rem)] leading-[1] tracking-[-.03em] text-navy">
                Boa tarde, Lucas<span className="text-gold">.</span>
              </h1>
              <p className="text-[12px] text-graphite/55">Você está 3 dias à frente do plano sugerido.</p>
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
              { label: "Progresso geral", value: "64%", meta: "+9% desde julho", bar: 64, accent: true },
              { label: "Candidaturas em andamento", value: "3", meta: "MIT · Oxford · Stanford", bar: 3, max: 5 },
              { label: "Prazos próximos", value: "4", meta: "nos próximos 60 dias", bar: 4, max: 6 },
              { label: "Estudo esta semana", value: "21h", meta: "meta: 15h · acima da meta", bar: 21, max: 15 },
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
                <a href="#" onClick={(e) => e.preventDefault()} className="text-[11px] font-bold text-gold hover:text-navy">Ver tudo →</a>
              </div>

              <ol className="mt-6">
                {timeline.map((step, i) => (
                  <li key={step.title} className="relative flex gap-4 pb-5 last:pb-0">
                    {i < timeline.length - 1 && (
                      <span className={`absolute left-[13px] top-7 h-[calc(100%-24px)] w-px ${step.status === "upcoming" ? "bg-mist" : "bg-gold/40"}`} />
                    )}
                    <span
                      className={`relative z-10 mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border ${
                        step.status === "done"
                          ? "border-gold bg-gold text-navy"
                          : step.status === "current"
                            ? "border-gold bg-navy text-gold ring-4 ring-gold/15"
                            : "border-mist bg-ivory text-mist"
                      }`}
                    >
                      {step.status === "done" ? (
                        <Icon d="M5 13l4 4L19 7" className="h-3.5 w-3.5" />
                      ) : (
                        <span className="text-[10px] font-bold">{i + 1}</span>
                      )}
                    </span>
                    <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-4">
                      <div>
                        <p className={`text-[13px] font-semibold ${step.status === "upcoming" ? "text-graphite/55" : "text-navy"}`}>{step.title}</p>
                        <p className="mt-0.5 text-[11px] text-graphite/50">{step.note}</p>
                      </div>
                      <p className={`text-[10px] font-bold uppercase tracking-[.1em] ${step.status === "current" ? "text-gold" : "text-graphite/40"}`}>{step.date}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.section>

            <motion.section {...fade} transition={{ duration: 0.7, delay: 0.38, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-mist bg-white p-5 md:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-[1.35rem] tracking-[-.02em] text-navy">Próximos prazos</h2>
              </div>
              <ul className="mt-5 divide-y divide-mist/70">
                {deadlines.map((item) => (
                  <li key={item.label} className="flex items-center gap-3 py-3.5">
                    <div className={`flex h-10 w-12 shrink-0 flex-col items-center justify-center rounded-md border ${toneMap[item.tone]}`}>
                      <span className="text-[9px] font-bold uppercase leading-none opacity-70">{item.date.split(" ")[1]}</span>
                      <span className="font-serif text-[15px] font-semibold leading-tight">{item.date.split(" ")[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-navy">{item.label}</p>
                      <p className="text-[10px] text-graphite/50">{item.tag}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <a href="#" onClick={(e) => e.preventDefault()} className="mt-4 block rounded-md border border-mist bg-ivory py-3 text-center text-[11px] font-bold text-navy transition-colors hover:border-gold hover:text-gold">
                Abrir calendário
              </a>
            </motion.section>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <motion.section {...fade} transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-mist bg-white p-5 md:p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-[1.35rem] tracking-[-.02em] text-navy">Universidades na mira</h2>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-[11px] font-bold text-gold hover:text-navy">Gerir lista →</a>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {universities.map((u) => (
                  <div key={u.name} className="group overflow-hidden rounded-md border border-mist transition-colors hover:border-gold/60">
                    <div className="relative h-24 overflow-hidden bg-navy">
                      <img src={u.image} alt={u.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute left-2 top-2 rounded-full bg-navy/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] text-gold backdrop-blur">{u.prazo}</span>
                    </div>
                    <div className="p-3.5">
                      <p className="font-serif text-[16px] font-semibold text-navy">{u.name}</p>
                      <p className="text-[10px] text-graphite/50">{u.place}</p>
                      <div className="mt-3 flex items-center justify-between text-[10px]">
                        <span className="text-graphite/45">Taxa de admissão</span>
                        <span className="font-bold text-graphite">{u.rate}</span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px]">
                        <span className="text-graphite/45">Afinidade</span>
                        <span className="font-bold text-gold">{u.fit}%</span>
                      </div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-mist">
                        <div className="h-full rounded-full bg-gold" style={{ width: `${u.fit}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section {...fade} transition={{ duration: 0.7, delay: 0.52, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col rounded-lg border border-mist bg-navy p-5 text-ivory md:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Próxima mentoria</p>
              <p className="mt-4 font-serif text-[1.6rem] leading-tight tracking-[-.02em]">Devolutiva do perfil acadêmico</p>
              <div className="mt-5 space-y-2.5 text-[12px] text-ivory/70">
                <p className="flex items-center gap-2.5"><Icon d="M4 7h16M4 7v9.5a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5V7M4 7l2.5-3h11l2.5 3M9 15.5h6" className="h-4 w-4 text-gold" /> Qui · 14 de agosto · 15h · 60 min</p>
                <p className="flex items-center gap-2.5"><Icon d="M12 3v3M5.6 5.6l2.1 2.1M3 12h3M18.4 5.6l-2.1 2.1M21 12h-3M12 21v-3M15.5 15.5l2 2M8.5 15.5l-2 2" className="h-4 w-4 text-gold" /> Tema: revisão do projeto autoral</p>
              </div>
              <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold font-serif text-[12px] font-semibold text-navy">D</div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-ivory">Daniel</p>
                  <p className="text-[10px] text-ivory/45">Direção de orientação</p>
                </div>
              </div>
              <button className="mt-5 rounded-md border border-gold bg-gold py-3 text-[11px] font-bold text-navy transition-colors hover:bg-gold/90">
                Preparar pauta
              </button>
            </motion.section>
          </div>
        </main>
      </div>
    </div>
  );
}
