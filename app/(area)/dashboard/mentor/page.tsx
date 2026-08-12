"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const STATUS_INFO: Record<string, { label: string; pill: string }> = {
  rascunho: { label: "Rascunho", pill: "border-mist bg-ivory text-graphite/60" },
  pronta: { label: "Pronta p/ revisão", pill: "border-gold/60 bg-gold/[.08] text-navy" },
  em_revisao: { label: "Em revisão", pill: "border-navy bg-navy text-ivory" },
  revisada: { label: "Revisada", pill: "border-gold bg-gold text-navy" },
};

type Aluno = {
  id: string;
  nome: string | null;
  email: string | null;
  avatar_url: string | null;
  criado_em: string;
  aplicacao: {
    status: string;
    pronta: boolean;
    media_escolar: number | null;
    escala_media: string;
    sat: string | null;
    toefl: string | null;
    ielts: string | null;
    precisa_bolsa: boolean;
    atualizado_em: string | null;
    revisada_em: string | null;
  } | null;
  universidades: number;
  documentos: number;
  proxima_mentoria: string | null;
  mentorias_pendentes: number;
};

function fmtData(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function MentorPage() {
  const [alunos, setAlunos] = useState<Aluno[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/mentor/alunos");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (active) setErro(data.error ?? "Não foi possível carregar.");
          return;
        }
        if (active) setAlunos(data.alunos ?? []);
      } catch {
        if (active) setErro("Falha de conexão.");
      } finally {
        if (active) setCarregando(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (carregando) {
    return (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Painel do mentor</p>
        <p className="mt-4 text-[12px] text-graphite/55">Carregando…</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Painel do mentor</p>
        <p className="mt-4 text-[12px] text-[#C96A52]">{erro}</p>
      </div>
    );
  }

  const prontos = (alunos ?? []).filter((a) => a.aplicacao?.pronta).length;
  const mentorias = (alunos ?? []).reduce((acc, a) => acc + a.mentorias_pendentes, 0);

  return (
    <div>
      <motion.div {...fade}>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Painel do mentor</p>
        <h1 className="mt-2 font-serif text-[clamp(1.9rem,3vw,2.6rem)] leading-[1] tracking-[-.03em] text-navy">
          Estudantes<span className="text-gold">.</span>
        </h1>
        <p className="mt-2 max-w-[560px] text-[12px] leading-5 text-graphite/55">
          Todos os dossiês de aplicação dos seus estudantes. Abra um perfil para revisar a preparação completa antes da mentoria.
        </p>
      </motion.div>

      <motion.div {...fade} transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }} className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-mist bg-white p-5">
          <p className="text-[9px] font-bold uppercase tracking-[.16em] text-graphite/50">Estudantes</p>
          <p className="mt-2 font-serif text-[28px] leading-none text-navy">{(alunos ?? []).length}</p>
        </div>
        <div className="rounded-lg border border-mist bg-white p-5">
          <p className="text-[9px] font-bold uppercase tracking-[.16em] text-graphite/50">Dossiês prontos</p>
          <p className="mt-2 font-serif text-[28px] leading-none text-navy">{prontos}</p>
        </div>
        <div className="rounded-lg border border-mist bg-white p-5">
          <p className="text-[9px] font-bold uppercase tracking-[.16em] text-graphite/50">Mentorias agendadas</p>
          <p className="mt-2 font-serif text-[28px] leading-none text-navy">{mentorias}</p>
        </div>
      </motion.div>

      <motion.section {...fade} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="mt-8 rounded-lg border border-mist bg-white">
        {alunos!.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-[13px] font-semibold text-navy">Nenhum estudante cadastrado.</p>
          </div>
        ) : (
          <ul className="divide-y divide-mist/80">
            {alunos!.map((aluno) => {
              const status = STATUS_INFO[aluno.aplicacao?.status ?? "rascunho"] ?? STATUS_INFO.rascunho;
              const initials = (aluno.nome ?? aluno.email ?? "?")
                .split(" ")
                .filter(Boolean)
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <li key={aluno.id} className="flex flex-wrap items-center gap-4 px-5 py-4 md:px-7">
                  <span className="grid h-11 w-11 shrink-0 select-none place-items-center rounded-full bg-gold text-[13px] font-bold text-navy">
                    {initials || "F"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="truncate text-[13px] font-semibold text-navy">{aluno.nome ?? "Sem nome"}</p>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] ${status.pill}`}>
                        {status.label}
                      </span>
                      {aluno.aplicacao?.precisa_bolsa && <span className="text-[10px] font-semibold text-gold">precisa de bolsa</span>}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-graphite/55">
                      {aluno.email ?? "sem e-mail"}
                      <span className="mx-1.5 text-graphite/30">·</span>
                      {aluno.aplicacao?.media_escolar != null
                        ? `Média ${aluno.aplicacao.media_escolar}/${aluno.aplicacao.escala_media}`
                        : "Média não informada"}
                      {aluno.aplicacao?.sat ? ` · SAT ${aluno.aplicacao.sat}` : ""}
                    </p>
                    <p className="mt-0.5 text-[10px] text-graphite/45">
                      {aluno.documentos} docs · {aluno.universidades} universidades · entrou em {fmtData(aluno.criado_em)}
                      {aluno.proxima_mentoria ? ` · próxima mentoria ${fmtData(aluno.proxima_mentoria)}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/mentor/${aluno.id}`}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-navy bg-navy px-4 text-[10px] font-bold uppercase tracking-[.12em] text-ivory transition-colors hover:bg-deep-navy"
                  >
                    Ver dossiê
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </motion.section>
    </div>
  );
}
