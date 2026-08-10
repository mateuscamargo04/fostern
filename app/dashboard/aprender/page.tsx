"use client";

import Link from "next/link";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { useRef, useState } from "react";
import {
  Block,
  Exercise,
  Lesson,
  MODULE,
  completedCount,
} from "@/lib/learning";
import { useProgress } from "@/lib/use-progress";
import { useActivePlan } from "@/lib/use-active-plan";

const EASE = [0.22, 1, 0.36, 1] as const;

type ProgressMap = Record<string, boolean>;
type View = { name: "module" } | { name: "lesson"; lessonId: string };

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const icons = {
  back: "M15 6l-6 6 6 6",
  arrow: "M5 12h14M13 6l6 6-6 6",
  check: "M5 13l4 4L19 7",
  close: "M6 6l12 12M18 6L6 18",
  play: "M8 5v14l11-7z",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3",
  spark: "M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5z",
} as const;

function TopBar({ progress, onBack }: { progress: ProgressMap; onBack: () => void }) {
  const done = completedCount(progress);
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy text-ivory">
      <div className="mx-auto flex h-14 w-[min(100%-32px,1200px)] items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="group flex items-center gap-1.5 text-[12px] font-semibold text-ivory/70 transition-colors hover:text-gold"
        >
          <Icon d={icons.back} className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">Visão geral</span>
        </button>
        <div className="mx-auto flex min-w-0 items-center gap-2 text-[9px] font-bold uppercase tracking-[.14em] text-ivory/40">
          <span>Trilha</span>
          <span className="text-gold">·</span>
          <span className="truncate text-gold">Módulo 1</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold text-ivory/75">{done}/{MODULE.totalLessons} aulas</span>
          <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-gold font-serif text-[12px] font-semibold text-navy sm:flex">LM</span>
        </div>
      </div>
    </header>
  );
}

function StatusMark({ state }: { state: "done" | "current" | "locked" }) {
  if (state === "done") {
    return (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold text-navy">
        <Icon d={icons.check} className="h-4 w-4" />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-gold bg-navy font-serif text-[13px] font-semibold text-gold">
        {0}
      </span>
    );
  }
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-mist bg-ivory text-graphite/40">
      <Icon d={icons.lock} className="h-3.5 w-3.5" />
    </span>
  );
}

function ModuleOverview({
  progress,
  onOpenLesson,
  onBack,
  planoAtivo,
}: {
  progress: ProgressMap;
  onOpenLesson: (id: string) => void;
  onBack: () => void;
  planoAtivo: boolean;
}) {
  const done = completedCount(progress);
  const pct = Math.round((done / MODULE.totalLessons) * 100);
  const currentLesson = MODULE.lessons.find((lesson) => !progress[lesson.id]) ?? MODULE.lessons[0];

  const items: (
    | { type: "lesson"; lesson: Lesson; state: "done" | "current" }
    | { type: "locked"; number: number; title: string; state: "locked" }
  )[] = [
    ...MODULE.lessons.map((lesson) => {
      const state: "done" | "current" = progress[lesson.id] ? "done" : lesson.id === currentLesson.id ? "current" : "done";
      return { type: "lesson" as const, lesson, state };
    }),
    ...MODULE.locked.map((locked) => ({ type: "locked" as const, number: locked.number, title: locked.title, state: "locked" as const })),
  ].sort((a, b) => {
    const na = a.type === "lesson" ? a.lesson.number : a.number;
    const nb = b.type === "lesson" ? b.lesson.number : b.number;
    return na - nb;
  });

  return (
    <div className="min-h-[100svh] bg-ivory">
      <TopBar progress={progress} onBack={onBack} />

      {!planoAtivo && (
        <div className="bg-navy text-ivory">
          <div className="mx-auto flex w-[min(100%-32px,1000px)] flex-wrap items-center gap-x-4 gap-y-2 py-4">
            <p className="flex items-center gap-2.5 text-[12px] font-semibold">
              <Icon d={icons.spark} className="h-4 w-4 text-gold" />
              Você está no plano gratuito: aulas 1 e 2 disponíveis.
            </p>
            <Link
              href="/planos"
              className="ml-auto inline-flex min-h-9 items-center gap-2 border border-gold bg-gold px-4 text-[10px] font-bold text-navy transition-colors hover:bg-gold/90"
            >
              Assinar para liberar tudo <Icon d={icons.arrow} className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      <div className="mx-auto w-[min(100%-32px,1000px)] py-10 md:py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-[.14em]">
            <span className="text-gold">{MODULE.eyebrow}</span>
            <span className="hidden h-px w-8 bg-gold/40 sm:block" />
            <span className="text-graphite/50">{MODULE.totalLessons} aulas · {done} concluídas</span>
          </div>

          <h1 className="mt-5 max-w-[640px] font-serif text-[clamp(2.1rem,4vw,3.4rem)] leading-[.98] tracking-[-.04em] text-navy">
            {MODULE.title}
          </h1>
          <p className="mt-5 max-w-[520px] text-[14px] leading-7 text-graphite/75">{MODULE.description}</p>

          <div className="mt-8 flex items-center gap-5">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-[.12em]">
                <span className="text-graphite/55">Progresso do módulo</span>
                <span className="text-gold">{pct}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: EASE }} className="h-full rounded-full bg-gold" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
          className="mt-10 rounded-lg border border-mist bg-white"
        >
          <div className="flex items-center justify-between border-b border-mist px-5 py-4 md:px-7">
            <p className="font-serif text-[19px] tracking-[-.02em] text-navy">Conteúdo do módulo</p>
            <span className="hidden text-[10px] font-bold uppercase tracking-[.12em] text-graphite/50 sm:block">Uma aula por vez</span>
          </div>

          <ol>
            {items.map((item, index) => {
              if (item.type === "lesson") {
                const isCurrent = item.state === "current";
                return (
                  <li key={item.lesson.id} className="border-b border-mist/80 last:border-0">
                    <button
                      type="button"
                      onClick={() => onOpenLesson(item.lesson.id)}
                      className={`group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gold/[.04] md:px-7 ${isCurrent ? "bg-gold/[.05]" : ""}`}
                    >
                      <StatusMark state={item.state} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[9px] font-bold uppercase tracking-[.14em] text-gold">Aula {item.lesson.number}</span>
                        <span className={`mt-0.5 block text-[14px] font-semibold leading-snug ${isCurrent ? "text-navy" : "text-navy/85"}`}>{item.lesson.title}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="hidden items-center gap-1.5 text-[10px] font-semibold text-graphite/50 sm:flex">
                          <Icon d={icons.clock} className="h-3.5 w-3.5" />
                          {item.lesson.duration}
                        </span>
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-2 border border-gold bg-gold px-3.5 py-2 text-[10px] font-bold text-navy transition-transform duration-300 group-hover:translate-x-0.5">
                            Continuar <Icon d={icons.arrow} className="h-3 w-3" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-1 py-2 text-[10px] font-bold uppercase tracking-[.1em] text-gold">
                            Concluída <Icon d={icons.check} className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              }
              return (
                <li key={`locked-${item.number}`} className="border-b border-mist/80 px-5 py-4 last:border-0 md:px-7">
                  <div className="flex items-center gap-4">
                    <StatusMark state="locked" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[9px] font-bold uppercase tracking-[.14em] text-graphite/40">Aula {item.number}</span>
                      <span className="mt-0.5 block truncate text-[14px] font-semibold leading-snug text-graphite/70">{item.title}</span>
                    </span>
                    {planoAtivo ? (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-[.12em] text-graphite/40">Em breve</span>
                    ) : (
                      <Link
                        href="/planos"
                        className="inline-flex shrink-0 items-center gap-2 border border-gold bg-gold px-3.5 py-2 text-[10px] font-bold text-navy transition-colors hover:bg-gold/90"
                      >
                        Assinar <Icon d={icons.arrow} className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 flex items-center gap-3 text-[11px] text-graphite/50">
          <Icon d={icons.book} className="h-4 w-4 text-gold" />
          Protótipo de demonstração — as aulas 3 a 8 serão abertas nos próximos módulos.
        </motion.div>
      </div>
    </div>
  );
}

function CompareCard({ data, strong }: { data: { label: string; title: string; text: string; note: string }; strong: boolean }) {
  return (
    <div className={`rounded-md border p-5 ${strong ? "border-gold/50 bg-gold/[.05]" : "border-mist bg-white"}`}>
      <span className={`inline-block px-2 py-1 text-[8px] font-bold uppercase tracking-[.14em] ${strong ? "bg-gold text-navy" : "bg-mist text-graphite/60"}`}>
        {data.label}
      </span>
      <p className={`mt-3 font-serif text-[19px] leading-tight ${strong ? "text-navy" : "text-graphite/70"}`}>{data.title}</p>
      <p className="mt-2 text-[13px] leading-6 text-graphite/75">{data.text}</p>
      <p className={`mt-3 text-[12px] italic leading-5 ${strong ? "text-gold" : "text-graphite/50"}`}>{data.note}</p>
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "eyebrow":
      return <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">{block.text}</p>;
    case "heading":
      return <h2 className="mt-10 font-serif text-[26px] leading-[1.15] tracking-[-.02em] text-navy md:text-[30px]">{block.text}</h2>;
    case "paragraph":
      return <p className="mt-5 text-[15px] leading-[1.75] text-graphite/80">{block.text}</p>;
    case "list":
      return (
        <ul className="mt-6 space-y-3">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3.5 text-[14px] leading-6 text-graphite/80">
              <span className="mt-[11px] h-px w-4 shrink-0 bg-gold" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "callout":
      return (
        <div className="mt-9 border-l-2 border-gold bg-navy p-6 text-ivory">
          <p className="text-[9px] font-bold uppercase tracking-[.16em] text-gold">{block.title}</p>
          <p className="mt-2 font-serif text-[19px] leading-snug text-ivory/90">{block.text}</p>
        </div>
      );
    case "video":
      return (
        <div className="group relative mt-9 aspect-video overflow-hidden bg-navy">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_20%,rgba(212,175,55,.2),transparent_70%)]" />
          <div aria-hidden className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full border border-gold/60 bg-gold/10 text-gold backdrop-blur transition-transform duration-300 group-hover:scale-110">
              <Icon d={icons.play} className="ml-0.5 h-5 w-5" />
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-ivory">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[.14em] text-gold">{block.meta}</p>
              <p className="mt-1 font-serif text-[18px] leading-tight">{block.title}</p>
            </div>
            <span className="hidden shrink-0 rounded-full border border-white/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-ivory/60 sm:block">Aula 01</span>
          </div>
        </div>
      );
    case "concepts":
      return (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {block.items.map((item, index) => (
            <motion.div
              key={item.term}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, delay: index * 0.06, ease: EASE }}
              className="rounded-md border border-mist bg-white p-5 transition-colors duration-300 hover:border-gold/60"
            >
              <p className="flex items-center gap-2.5 font-serif text-[18px] text-navy">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {item.term}
              </p>
              <p className="mt-2.5 text-[13px] leading-6 text-graphite/70">{item.text}</p>
            </motion.div>
          ))}
        </div>
      );
    case "compare":
      return (
        <div className="mt-9">
          {block.title && <h3 className="mb-4 font-serif text-[22px] tracking-[-.02em] text-navy">{block.title}</h3>}
          <div className="grid gap-4 sm:grid-cols-2">
            <CompareCard data={block.left} strong={false} />
            <CompareCard data={block.right} strong />
          </div>
          <div className="mt-4 rounded-md bg-navy p-5 text-ivory">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-gold">
              <Icon d={icons.spark} className="h-3.5 w-3.5" /> Por quê
            </p>
            <p className="mt-2 text-[13px] leading-6 text-ivory/85">{block.verdict}</p>
          </div>
        </div>
      );
    default:
      return null;
  }
}

function ExerciseBlock({ exercise, completed, onConclude }: { exercise: Exercise; completed: boolean; onConclude: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const correct = answered && selected === exercise.correct;

  const submit = () => {
    if (!selected) return;
    setAnswered(true);
  };

  return (
    <section className="mt-14 border-t border-mist pt-9">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-gold">
          <Icon d={icons.spark} className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[.16em] text-gold">Exercício</p>
          <p className="text-[12px] font-semibold text-navy">Aplique o que você aprendeu</p>
        </div>
      </div>

      <h3 className="mt-7 max-w-[560px] font-serif text-[26px] leading-tight tracking-[-.02em] text-navy">{exercise.question}</h3>

      <div className="mt-7 space-y-3">
        {exercise.options.map((option) => {
          const isSelected = selected === option.id;
          const isCorrect = option.id === exercise.correct;
          const showResult = answered;
          let classes = "border-mist bg-white hover:border-gold/70";
          if (showResult) {
            if (isCorrect) classes = "border-gold bg-gold/[.08]";
            else if (isSelected) classes = "border-[#E0A18C] bg-[#FBF1EC]";
            else classes = "border-mist bg-white opacity-50";
          } else if (isSelected) {
            classes = "border-navy bg-white";
          }
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => !answered && setSelected(option.id)}
              className={`group flex w-full items-start gap-4 rounded-md border px-4 py-4 text-left transition-all duration-200 ${classes}`}
            >
              <span
                className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-bold transition-colors ${
                  showResult && isCorrect
                    ? "border-gold bg-gold text-navy"
                    : showResult && isSelected
                      ? "border-[#E0A18C] bg-[#E0A18C] text-white"
                      : isSelected
                        ? "border-navy bg-navy text-ivory"
                        : "border-mist bg-ivory text-graphite/60 group-hover:border-gold group-hover:text-gold"
                }`}
              >
                {option.id}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold leading-snug text-navy">{option.label}</span>
                <span className="mt-1 block text-[12px] leading-5 text-graphite/55">{option.detail}</span>
              </span>
              {showResult && isCorrect && <Icon d={icons.check} className="mt-1 h-5 w-5 shrink-0 text-gold" />}
              {showResult && isSelected && !isCorrect && <Icon d={icons.close} className="mt-1 h-4 w-4 shrink-0 text-[#C96A52]" />}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {!answered ? (
          <motion.button
            key="submit"
            type="button"
            onClick={submit}
            disabled={!selected}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 border border-gold bg-gold px-6 text-[11px] font-bold text-navy transition-colors duration-300 hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Responder
          </motion.button>
        ) : (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className={`mt-7 rounded-md border p-6 ${correct ? "border-gold/40 bg-gold/[.06]" : "border-[#E0A18C]/50 bg-[#FBF1EC]"}`}
          >
            <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.14em] text-navy">
              <span className={`grid h-7 w-7 place-items-center rounded-full ${correct ? "bg-gold text-navy" : "bg-[#E0A18C] text-white"}`}>
                <Icon d={correct ? icons.check : icons.close} className="h-4 w-4" />
              </span>
              {correct ? "Correto" : "Quase lá"}
            </p>
            <p className="mt-3 text-[14px] font-medium leading-6 text-navy">{correct ? exercise.correctFeedback : exercise.wrongFeedback}</p>
            <div className="mt-3 border-l-2 border-gold/60 pl-4">
              <p className="text-[13px] leading-6 text-graphite/75">{exercise.explanation}</p>
            </div>
            <button
              type="button"
              onClick={onConclude}
              disabled={completed}
              className={`mt-6 inline-flex min-h-12 items-center justify-center gap-3 border px-6 text-[11px] font-bold transition-colors duration-300 ${
                completed ? "cursor-default border-gold/40 bg-gold/15 text-gold" : "border-navy bg-navy text-ivory hover:bg-deep-navy"
              }`}
            >
              {completed ? "Concluída ✓" : "Concluir aula"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ModuleRail({ progress, currentLessonId }: { progress: ProgressMap; currentLessonId: string }) {
  const done = completedCount(progress);
  const pct = Math.round((done / MODULE.totalLessons) * 100);
  const items = [
    ...MODULE.lessons.map((lesson) => ({ number: lesson.number, title: lesson.title, id: lesson.id, locked: false as const })),
    ...MODULE.locked.map((locked) => ({ number: locked.number, title: locked.title, id: `locked-${locked.number}`, locked: true as const })),
  ].sort((a, b) => a.number - b.number);

  return (
    <aside className="sticky top-20 w-[280px] shrink-0 rounded-lg border border-mist bg-white p-5">
      <p className="text-[9px] font-bold uppercase tracking-[.16em] text-gold">Progresso do módulo</p>
      <p className="mt-1 text-[12px] text-graphite/60">{done} de {MODULE.totalLessons} aulas concluídas</p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-mist">
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: EASE }} className="h-full rounded-full bg-gold" />
      </div>

      <ol className="mt-5 space-y-1">
        {items.map((item) => {
          const isCurrent = item.id === currentLessonId;
          const isDone = !item.locked && progress[item.id];
          return (
            <li
              key={item.id}
              className={`flex items-center gap-3 rounded-md px-2.5 py-2 ${isCurrent ? "bg-navy text-ivory" : isDone ? "text-graphite/75" : "text-graphite/40"}`}
            >
              <span className={`grid h-5 w-5 shrink-0 place-items-center text-[9px] font-bold ${isCurrent ? "bg-gold text-navy" : isDone ? "text-gold" : ""}`}>
                {isDone ? <Icon d={icons.check} className="h-3 w-3" /> : isCurrent ? <span className="rounded-full bg-gold" style={{ width: 6, height: 6 }} /> : item.number}
              </span>
              <span className="truncate text-[11px] font-semibold leading-4">{item.title}</span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function LessonView({
  lesson,
  progress,
  onComplete,
  onBack,
  onOpenLesson,
}: {
  lesson: Lesson;
  progress: ProgressMap;
  onComplete: (id: string) => void;
  onBack: () => void;
  onOpenLesson: (id: string) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: contentRef, offset: ["start 56px", "end 55%"] });
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 32, restDelta: 0.001 });

  const completed = !!progress[lesson.id];
  const nextLesson = MODULE.lessons.find((candidate) => candidate.number > lesson.number && !progress[candidate.id]);

  return (
    <div className="min-h-[100svh] bg-ivory">
      <TopBar progress={progress} onBack={onBack} />
      <motion.div style={{ scaleX }} className="fixed inset-x-0 top-14 z-30 h-[2px] origin-left bg-gold" />

      <div className="mx-auto flex w-[min(100%-32px,1200px)] items-start gap-12 py-10 md:py-14">
        <div ref={contentRef} className="min-w-0 flex-1">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-[.14em]">
              <span className="text-gold">Aula {lesson.number} de {MODULE.totalLessons}</span>
              <span className="hidden h-px w-8 bg-gold/40 sm:block" />
              <span className="text-graphite/50">{lesson.duration} de leitura</span>
            </div>
            <h1 className="mt-4 max-w-[600px] font-serif text-[clamp(1.9rem,3.4vw,2.8rem)] leading-[1.02] tracking-[-.035em] text-navy">
              {lesson.title}
            </h1>
            <p className="mt-4 max-w-[520px] text-[14px] leading-7 text-graphite/70">{lesson.tagline}</p>
          </motion.div>

          <div className="mt-10">
            {lesson.blocks.map((block, index) => (
              <motion.div
                key={`${block.type}-${index}`}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.6, delay: 0.04, ease: EASE }}
              >
                <BlockView block={block} />
              </motion.div>
            ))}
          </div>

          <ExerciseBlock exercise={lesson.exercise} completed={completed} onConclude={() => onComplete(lesson.id)} />

          {completed && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mt-6 rounded-md border border-gold/40 bg-navy p-6 text-ivory"
            >
              <p className="text-[9px] font-bold uppercase tracking-[.16em] text-gold">Progresso do módulo</p>
              <p className="mt-2 font-serif text-[22px] leading-tight">Aula concluída.</p>
              <p className="mt-1 text-[12px] text-ivory/65">
                {completedCount(progress)} de {MODULE.totalLessons} aulas concluídas · {Math.round((completedCount(progress) / MODULE.totalLessons) * 100)}%
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex min-h-11 items-center gap-2 border border-white/25 px-5 text-[11px] font-bold text-ivory transition-colors hover:border-gold hover:text-gold"
                >
                  <Icon d={icons.back} className="h-4 w-4" /> Voltar ao módulo
                </button>
                {nextLesson && (
                  <button
                    type="button"
                    onClick={() => onOpenLesson(nextLesson.id)}
                    className="inline-flex min-h-11 items-center gap-3 border border-gold bg-gold px-5 text-[11px] font-bold text-navy transition-colors hover:bg-gold/90"
                  >
                    Próxima aula: {nextLesson.title.split(":")[0].split("?")[0].trim()}
                    <Icon d={icons.arrow} className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <div className="hidden xl:block">
          <ModuleRail progress={progress} currentLessonId={lesson.id} />
        </div>
      </div>
    </div>
  );
}

export default function LearnPage() {
  const { progress, complete } = useProgress();
  const { loading: carregandoPlano, ativo: planoAtivo } = useActivePlan();
  const [view, setView] = useState<View>({ name: "module" });

  const activeLesson = view.name === "lesson" ? MODULE.lessons.find((lesson) => lesson.id === view.lessonId) : undefined;

  return (
    <>
      {view.name === "lesson" && activeLesson ? (
        <LessonView
          lesson={activeLesson}
          progress={progress}
          onComplete={complete}
          onBack={() => setView({ name: "module" })}
          onOpenLesson={(id) => {
            setView({ name: "lesson", lessonId: id });
            window.scrollTo({ top: 0 });
          }}
        />
      ) : (
        <ModuleOverview
          progress={progress}
          planoAtivo={!carregandoPlano && planoAtivo}
          onBack={() => {
            window.location.href = "/dashboard";
          }}
          onOpenLesson={(id) => {
            setView({ name: "lesson", lessonId: id });
            window.scrollTo({ top: 0 });
          }}
        />
      )}
    </>
  );
}
