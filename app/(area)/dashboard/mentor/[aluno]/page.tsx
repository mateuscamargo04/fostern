"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
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

const UNI_STATUS: Record<string, { label: string; pill: string }> = {
  planejada: { label: "Planejada", pill: "border-mist bg-ivory text-graphite/60" },
  em_progresso: { label: "Em progresso", pill: "border-gold/50 bg-gold/[.08] text-navy" },
  enviada: { label: "Enviada", pill: "border-navy bg-navy text-ivory" },
  aceita: { label: "Aceita", pill: "border-gold bg-gold text-navy" },
  recusada: { label: "Recusada", pill: "border-[#E0A18C]/60 bg-[#FBF1EC] text-[#C96A52]" },
};

const DOC_CAT: Record<string, string> = {
  historico: "Histórico escolar",
  boletim: "Boletim",
  certificado: "Certificado",
  teste: "Nota de teste",
  ensaio: "Redação / Ensaio",
  carta: "Carta de recomendação",
  financas: "Comprovante financeiro",
  curriculo: "Currículo",
  outro: "Documento",
};

type App = {
  id: string;
  usuario_id: string;
  serie: string | null;
  escola: string | null;
  media_escolar: number | null;
  escala_media: string;
  posicao_turma: string | null;
  carga_horaria_semanal: string | null;
  sat: string | null;
  act: string | null;
  toefl: string | null;
  ielts: string | null;
  outros_testes: string | null;
  extracurriculares: { area: string; atividade: string; funcao: string; periodicidade: string; inicio: string; descricao: string }[];
  idiomas: { idioma: string; nivel: string }[];
  voluntariado: { organizacao: string; funcao: string; horas: string; periodo: string }[];
  orcamento_anual_usd: string | null;
  precisa_bolsa: boolean;
  financa_observacao: string | null;
  ensaio_tema: string | null;
  ensaio_versao: string | null;
  paises: string[];
  cursos: string[];
  preferencia_obs: string | null;
  status: string;
  pronta: boolean;
  revisao_mentor: string | null;
  revisada_em: string | null;
  atualizado_em: string | null;
};

type Doc = { id: string; nome: string; tipo: string | null; tamanho_bytes: number | null; criado_em: string; url?: string | null };
type Uni = { id: string; nome: string; pais: string | null; curso: string | null; prazo_candidatura: string | null; taxa_candidatura: string | null; status: string; nota: number | null };
type Mentoria = { id: string; mentor_nome: string | null; agendada_para: string | null; duracao_min: number; status: string; notas: string | null };

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const icons = {
  back: "M15 6l-6 6 6 6",
  doc: "M14 2.5H7a1.5 1.5 0 0 0-1.5 1.5v16A1.5 1.5 0 0 0 7 21.5h10a1.5 1.5 0 0 0 1.5-1.5V8zM14 2.5V8h5.5",
  download: "M12 4v12M7 11l5 5 5-5M4 20h16",
} as const;

function fmtData(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function Info({ label, value, invert = false }: { label: string; value: string | number | null; invert?: boolean }) {
  if (value === null || value === "" || value === undefined) return null;
  return (
    <div>
      <p className={`text-[9px] font-bold uppercase tracking-[.14em] ${invert ? "text-ivory/40" : "text-graphite/45"}`}>{label}</p>
      <p className={`mt-1 text-[13px] leading-5 ${invert ? "text-ivory/90" : "text-navy"}`}>{value}</p>
    </div>
  );
}

function Card({ titulo, children, delay = 0 }: { titulo: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section {...fade} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-mist bg-white p-5 md:p-6">
      <h2 className="font-serif text-[1.3rem] tracking-[-.02em] text-navy">{titulo}</h2>
      <div className="mt-5">{children}</div>
    </motion.section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-[12px] italic text-graphite/40">{text}</p>;
}

export default function MentorAlunoPage() {
  const params = useParams<{ aluno: string }>();
  const alunoId = params.aluno;

  const [perfil, setPerfil] = useState<{ id: string; nome: string | null; email: string | null; avatar_url: string | null; serie: string | null; escola: string | null; meta: string | null; criado_em: string } | null>(null);
  const [app, setApp] = useState<App | null>(null);
  const [documentos, setDocumentos] = useState<Doc[]>([]);
  const [unis, setUnis] = useState<Uni[]>([]);
  const [mentorias, setMentorias] = useState<Mentoria[]>([]);
  const [aulasConcluidas, setAulasConcluidas] = useState(0);

  const [revisao, setRevisao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/mentor/alunos/${alunoId}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (active) setErro(data.error ?? "Não foi possível carregar o dossiê.");
          return;
        }
        if (!active) return;
        const { aluno } = data;
        setPerfil(aluno.perfil);
        setApp(aluno.aplicacao);
        setDocumentos(aluno.documentos ?? []);
        setUnis(aluno.universidades ?? []);
        setMentorias(aluno.mentorias ?? []);
        setAulasConcluidas(aluno.aulas_concluidas ?? 0);
        setRevisao(aluno.aplicacao?.revisao_mentor ?? "");
      } catch {
        if (active) setErro("Falha de conexão.");
      } finally {
        if (active) setCarregando(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [alunoId]);

  const atualizarStatus = async (event: FormEvent, status: string) => {
    event.preventDefault();
    setSalvando(true);
    setErro(null);
    setOk(null);
    try {
      const res = await fetch(`/api/mentor/alunos/${alunoId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, revisao_mentor: revisao.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível atualizar.");
      setApp(data.aplicacao);
      setOk(status === "revisada" ? "Revisão concluída e registrada." : "Status atualizado.");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao atualizar.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Dossiê do estudante</p>
        <p className="mt-4 text-[12px] text-graphite/55">Carregando…</p>
      </div>
    );
  }

  if (erro && !perfil) {
    return (
      <div>
        <Link href="/dashboard/mentor" className="inline-flex items-center gap-2 text-[11px] font-bold text-graphite/60 transition-colors hover:text-gold">
          <Icon d={icons.back} className="h-4 w-4" /> Voltar aos estudantes
        </Link>
        <p className="mt-6 text-[12px] text-[#C96A52]">{erro}</p>
      </div>
    );
  }

  const status = STATUS_INFO[app?.status ?? "rascunho"] ?? STATUS_INFO.rascunho;
  const initials = (perfil?.nome ?? perfil?.email ?? "?")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      <Link href="/dashboard/mentor" className="inline-flex items-center gap-2 text-[11px] font-bold text-graphite/60 transition-colors hover:text-gold">
        <Icon d={icons.back} className="h-4 w-4" /> Voltar aos estudantes
      </Link>

      <motion.div {...fade} className="mt-4">
        <div className="flex flex-wrap items-center gap-5">
          {perfil?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={perfil.avatar_url} alt={perfil.nome ?? "Estudante"} className="h-16 w-16 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="grid h-16 w-16 shrink-0 select-none place-items-center rounded-full bg-gold text-[20px] font-bold text-navy">{initials || "F"}</span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-[clamp(1.9rem,3vw,2.6rem)] leading-[1] tracking-[-.03em] text-navy">{perfil?.nome ?? "Estudante"}</h1>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[.1em] ${status.pill}`}>{status.label}</span>
            </div>
            <p className="mt-1 text-[12px] text-graphite/55">
              {perfil?.email ?? "sem e-mail"}
              <span className="mx-1.5 text-graphite/30">·</span>
              entrou em {fmtData(perfil?.criado_em ?? null)}
              <span className="mx-1.5 text-graphite/30">·</span>
              {aulasConcluidas} aulas concluídas
            </p>
          </div>
        </div>

        {(erro || ok) && (
          <p className={`mt-4 text-[12px] leading-5 ${erro ? "text-[#C96A52]" : "text-gold"}`}>{erro ?? ok}</p>
        )}
      </motion.div>

      <form
        onSubmit={(e) => atualizarStatus(e, "em_revisao")}
        className="mt-6 rounded-lg border border-mist bg-white p-5 md:p-6"
      >
        <h2 className="font-serif text-[1.3rem] tracking-[-.02em] text-navy">Revisão do mentor</h2>
        <p className="mt-1.5 text-[12px] leading-5 text-graphite/55">Registre aqui suas impressões e orientações para o estudante.</p>
        <textarea
          value={revisao}
          onChange={(e) => setRevisao(e.target.value)}
          rows={4}
          placeholder="Pontos fortes, riscos, próximos passos…"
          className="mt-5 w-full resize-y border-b border-mist bg-transparent pb-3 pt-1 text-[15px] text-navy placeholder:text-graphite/35 focus:border-gold focus:outline-none"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" disabled={salvando} className="inline-flex min-h-11 items-center justify-center gap-3 border border-navy bg-navy px-5 text-[11px] font-bold text-ivory transition-colors hover:bg-deep-navy disabled:cursor-wait disabled:opacity-60">
            {salvando ? "Salvando…" : "Marcar em revisão"}
          </button>
          <button
            type="button"
            onClick={(e) => atualizarStatus(e as unknown as FormEvent, "revisada")}
            disabled={salvando}
            className="inline-flex min-h-11 items-center justify-center gap-3 border border-gold bg-gold px-5 text-[11px] font-bold text-navy transition-colors hover:bg-gold/90 disabled:cursor-wait disabled:opacity-60"
          >
            Concluir revisão
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card titulo="Perfil acadêmico" delay={0.05}>
          <div className="grid gap-5 md:grid-cols-2">
            <Info label="Série / ano" value={(perfil?.serie ?? app?.serie) ?? null} />
            <Info label="Escola" value={(perfil?.escola ?? app?.escola) ?? null} />
            <Info label="Média geral" value={app?.media_escolar != null ? `${app.media_escolar}/${app.escala_media}` : null} />
            <Info label="Posição na turma" value={app?.posicao_turma ?? null} />
            <Info label="Carga horária semanal" value={app?.carga_horaria_semanal ?? null} />
          </div>
        </Card>

        <Card titulo="Testes padronizados" delay={0.07}>
          {!app?.sat && !app?.act && !app?.toefl && !app?.ielts && !app?.outros_testes ? (
            <Empty text="Nenhum teste informado." />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              <Info label="SAT" value={app?.sat} />
              <Info label="ACT" value={app?.act} />
              <Info label="TOEFL" value={app?.toefl} />
              <Info label="IELTS" value={app?.ielts} />
              <Info label="Outros testes" value={app?.outros_testes} />
            </div>
          )}
        </Card>

        <Card titulo="Atividades extracurriculares" delay={0.09}>
          {!app?.extracurriculares?.length ? (
            <Empty text="Nenhuma atividade registrada." />
          ) : (
            <ul className="space-y-3">
              {app.extracurriculares.map((extra, i) => (
                <li key={i} className="border-l-2 border-gold/60 pl-4">
                  <p className="text-[13px] font-semibold text-navy">
                    {extra.atividade || "Atividade"}
                    {extra.area ? <span className="font-normal text-graphite/50"> · {extra.area}</span> : null}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-5 text-graphite/55">
                    {[extra.funcao, extra.periodicidade, extra.inicio].filter(Boolean).join(" · ") || "Sem detalhes"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card titulo="Idiomas" delay={0.11}>
          {!app?.idiomas?.length ? (
            <Empty text="Nenhum idioma registrado." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {app.idiomas.map((item, i) => (
                <span key={i} className="rounded-full border border-mist bg-ivory px-3 py-1.5 text-[12px] text-navy">
                  {item.idioma}
                  {item.nivel ? <span className="text-graphite/50"> · {item.nivel}</span> : null}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card titulo="Voluntariado" delay={0.13}>
          {!app?.voluntariado?.length ? (
            <Empty text="Nenhum voluntariado registrado." />
          ) : (
            <ul className="space-y-3">
              {app.voluntariado.map((item, i) => (
                <li key={i} className="border-l-2 border-gold/60 pl-4">
                  <p className="text-[13px] font-semibold text-navy">{item.organizacao || "Organização"}</p>
                  <p className="mt-0.5 text-[11px] leading-5 text-graphite/55">{[item.funcao, item.horas, item.periodo].filter(Boolean).join(" · ") || "Sem detalhes"}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card titulo="Finanças" delay={0.15}>
          {!app?.orcamento_anual_usd && !app?.precisa_bolsa && !app?.financa_observacao ? (
            <Empty text="Nada informado." />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              <Info label="Orçamento anual (USD)" value={app?.orcamento_anual_usd} />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.14em] text-graphite/45">Precisa de bolsa</p>
                <p className="mt-1 text-[13px] text-navy">{app?.precisa_bolsa ? "Sim" : "Não informado"}</p>
              </div>
              <Info label="Observações" value={app?.financa_observacao} />
            </div>
          )}
        </Card>

        <Card titulo="Ensaio" delay={0.17}>
          {!app?.ensaio_tema && !app?.ensaio_versao ? (
            <Empty text="Nenhum ensaio registrado." />
          ) : (
            <div className="space-y-4">
              <Info label="Tema" value={app?.ensaio_tema} />
              {app?.ensaio_versao && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[.14em] text-graphite/45">Versão atual</p>
                  <p className="mt-1 whitespace-pre-wrap rounded-md border border-mist bg-ivory p-4 text-[12px] leading-6 text-graphite/80">{app.ensaio_versao}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card titulo="Preferências de destino" delay={0.19}>
          {!app?.paises?.length && !app?.cursos?.length && !app?.preferencia_obs ? (
            <Empty text="Nada informado." />
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.14em] text-graphite/45">Países</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {app?.paises?.length ? app.paises.map((p, i) => <span key={i} className="rounded-full border border-mist bg-ivory px-3 py-1.5 text-[12px] text-navy">{p}</span>) : <span className="text-[12px] text-graphite/40">—</span>}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.14em] text-graphite/45">Cursos</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {app?.cursos?.length ? app.cursos.map((c, i) => <span key={i} className="rounded-full border border-mist bg-ivory px-3 py-1.5 text-[12px] text-navy">{c}</span>) : <span className="text-[12px] text-graphite/40">—</span>}
                </div>
              </div>
              <Info label="Observações" value={app?.preferencia_obs} />
            </div>
          )}
        </Card>
      </div>

      <Card titulo="Universidades-alvo" delay={0.21}>
        {unis.length === 0 ? (
          <Empty text="Nenhuma universidade adicionada." />
        ) : (
          <ul className="divide-y divide-mist/80">
            {unis.map((uni) => {
              const uniStatus = UNI_STATUS[uni.status] ?? UNI_STATUS.planejada;
              return (
                <li key={uni.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-navy">{uni.nome}</p>
                    <p className="mt-0.5 text-[11px] text-graphite/55">{[uni.curso, uni.pais].filter(Boolean).join(" · ") || "Sem detalhes"}</p>
                    <p className="mt-0.5 text-[10px] text-graphite/45">
                      Prazo: {fmtData(uni.prazo_candidatura)} {uni.taxa_candidatura ? ` · Taxa: ${uni.taxa_candidatura}` : ""} {uni.nota ? ` · Prioridade ${uni.nota}/5` : ""}
                    </p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] ${uniStatus.pill}`}>{uniStatus.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card titulo="Documentos" delay={0.23}>
        {documentos.length === 0 ? (
          <Empty text="Nenhum documento enviado." />
        ) : (
          <ul className="divide-y divide-mist/80">
            {documentos.map((doc) => (
              <li key={doc.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-mist bg-ivory text-graphite/50">
                  <Icon d={icons.doc} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-navy">{doc.nome}</p>
                  <p className="mt-0.5 text-[10px] text-graphite/50">
                    {DOC_CAT[doc.tipo ?? "outro"] ?? "Documento"}
                    <span className="mx-1 text-graphite/30">·</span>
                    {fmtData(doc.criado_em)}
                  </p>
                </div>
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 shrink-0 items-center gap-2 border border-mist px-3 text-[10px] font-bold text-graphite/60 transition-colors hover:border-gold hover:text-gold">
                    <Icon d={icons.download} className="h-3.5 w-3.5" /> Abrir
                  </a>
                ) : (
                  <span className="shrink-0 text-[10px] text-graphite/40">sem arquivo</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card titulo="Mentorias" delay={0.25}>
        {mentorias.length === 0 ? (
          <Empty text="Nenhuma mentoria registrada." />
        ) : (
          <ul className="divide-y divide-mist/80">
            {mentorias.map((m) => (
              <li key={m.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[13px] font-semibold text-navy">
                    {m.agendada_para ? new Date(m.agendada_para).toLocaleString("pt-BR") : "Data a confirmar"}
                  </p>
                  <span className="rounded-full border border-mist bg-ivory px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] text-graphite/60">
                    {m.status} · {m.duracao_min} min
                  </span>
                </div>
                {m.notas && <p className="mt-1 text-[11px] text-graphite/55">Pauta: {m.notas}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
