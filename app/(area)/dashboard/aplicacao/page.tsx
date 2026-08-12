"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const inputClass =
  "w-full border-b border-mist bg-transparent pb-3 pt-1 text-[15px] text-navy placeholder:text-graphite/35 focus:border-gold focus:outline-none";
const selectClass =
  "w-full border-b border-mist bg-ivory pb-3 pt-1 text-[14px] text-navy focus:border-gold focus:outline-none";

const cardClass = "rounded-lg border border-mist bg-white p-5 md:p-6";

const icons = {
  save: "M5 3h12l3 3v15H4V3zM8 3v6h8V3M8 21v-7h8v7",
  check: "M5 13l4 4L19 7",
  plus: "M12 5v14M5 12h14",
  trash: "M4 7h16M9 7V4h6v3M6.5 7l1 14h9l1-14M10 11v6M14 11v6",
  doc: "M14 2.5H7a1.5 1.5 0 0 0-1.5 1.5v16A1.5 1.5 0 0 0 7 21.5h10a1.5 1.5 0 0 0 1.5-1.5V8zM14 2.5V8h5.5",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  download: "M12 4v12M7 11l5 5 5-5M4 20h16",
  flag: "M6 21V4M6 5h12l-2.5 3.5L18 12H6",
  spark: "M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z",
} as const;

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

type Extra = { area: string; atividade: string; funcao: string; periodicidade: string; horas: string; inicio: string; fim: string; descricao: string };
type Idioma = { idioma: string; nivel: string };
type Voluntariado = { organizacao: string; funcao: string; horas: string; periodo: string };

type Aplicacao = {
  id?: string;
  serie: string;
  escola: string;
  media_escolar: string;
  escala_media: string;
  posicao_turma: string;
  carga_horaria_semanal: string;
  sat: string;
  act: string;
  toefl: string;
  ielts: string;
  outros_testes: string;
  extracurriculares: Extra[];
  idiomas: Idioma[];
  voluntariado: Voluntariado[];
  orcamento_anual_usd: string;
  precisa_bolsa: boolean;
  financa_observacao: string;
  ensaio_tema: string;
  ensaio_versao: string;
  paises: string[];
  cursos: string[];
  preferencia_obs: string;
  status: string;
  pronta: boolean;
};

const aplicacaoVazia: Aplicacao = {
  serie: "",
  escola: "",
  media_escolar: "",
  escala_media: "10",
  posicao_turma: "",
  carga_horaria_semanal: "",
  sat: "",
  act: "",
  toefl: "",
  ielts: "",
  outros_testes: "",
  extracurriculares: [],
  idiomas: [],
  voluntariado: [],
  orcamento_anual_usd: "",
  precisa_bolsa: false,
  financa_observacao: "",
  ensaio_tema: "",
  ensaio_versao: "",
  paises: [],
  cursos: [],
  preferencia_obs: "",
  status: "rascunho",
  pronta: false,
};

const STATUS_INFO: Record<string, { label: string; pill: string }> = {
  rascunho: { label: "Rascunho", pill: "border-mist bg-ivory text-graphite/60" },
  pronta: { label: "Pronta para revisão", pill: "border-gold/60 bg-gold/[.08] text-navy" },
  em_revisao: { label: "Em revisão", pill: "border-navy bg-navy text-ivory" },
  revisada: { label: "Revisada", pill: "border-gold bg-gold text-navy" },
};

const DOC_CATEGORIAS = [
  { valor: "historico", label: "Histórico escolar" },
  { valor: "boletim", label: "Boletim" },
  { valor: "certificado", label: "Certificado" },
  { valor: "teste", label: "Nota de teste (SAT/TOEFL)" },
  { valor: "ensaio", label: "Redação / Ensaio" },
  { valor: "carta", label: "Carta de recomendação" },
  { valor: "financas", label: "Comprovante financeiro" },
  { valor: "curriculo", label: "Currículo" },
  { valor: "outro", label: "Outro" },
];

function catLabel(valor: string | null): string {
  return DOC_CATEGORIAS.find((c) => c.valor === valor)?.label ?? "Documento";
}

type Documento = {
  id: string;
  nome: string;
  tipo: string | null;
  storage_path: string | null;
  tamanho_bytes: number | null;
  criado_em: string;
};

function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SectionCard({ titulo, desc, children, delay = 0 }: { titulo: string; desc: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section {...fade} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }} className={cardClass}>
      <h2 className="font-serif text-[1.3rem] tracking-[-.02em] text-navy">{titulo}</h2>
      <p className="mt-1.5 text-[12px] leading-5 text-graphite/55">{desc}</p>
      <div className="mt-6">{children}</div>
    </motion.section>
  );
}

function Field({ id, label, children, className = "md:col-span-1" }: { id: string; label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
        {label}
      </label>
      {children}
    </div>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 border-b border-mist/70 py-4 last:border-0">{children}</div>;
}

export default function AplicacaoPage() {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [aplicacao, setAplicacao] = useState<Aplicacao>(aplicacaoVazia);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const getClient = useCallback(() => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }, []);

  const carregar = useCallback(async () => {
    const supabase = getClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setCarregando(false);
      return;
    }
    const [{ data: app }, { data: docs }] = await Promise.all([
      supabase.from("aplicacoes").select("*").eq("usuario_id", session.user.id).maybeSingle(),
      supabase.from("documentos").select("*").order("criado_em", { ascending: false }),
    ]);
    if (app) {
      setAplicacao({
        ...aplicacaoVazia,
        ...app,
        extracurriculares: Array.isArray(app.extracurriculares) ? app.extracurriculares : [],
        idiomas: Array.isArray(app.idiomas) ? app.idiomas : [],
        voluntariado: Array.isArray(app.voluntariado) ? app.voluntariado : [],
        paises: Array.isArray(app.paises) ? app.paises : [],
        cursos: Array.isArray(app.cursos) ? app.cursos : [],
        media_escolar: app.media_escolar != null ? String(app.media_escolar) : "",
      } as Aplicacao);
    }
    if (docs) setDocumentos(docs as Documento[]);
    setCarregando(false);
  }, [getClient]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const set = <K extends keyof Aplicacao>(key: K, value: Aplicacao[K]) => {
    setAplicacao((prev) => ({ ...prev, [key]: value }));
    setErro(null);
    setOk(null);
  };

  const salvar = async (pronta?: boolean) => {
    const supabase = getClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setErro("Não autenticado.");
      return false;
    }
    setSalvando(true);
    setErro(null);
    setOk(null);
    try {
      const payload = {
        serie: aplicacao.serie.trim() || null,
        escola: aplicacao.escola.trim() || null,
        media_escolar: aplicacao.media_escolar ? Number(aplicacao.media_escolar.replace(",", ".")) : null,
        escala_media: aplicacao.escala_media,
        posicao_turma: aplicacao.posicao_turma.trim() || null,
        carga_horaria_semanal: aplicacao.carga_horaria_semanal.trim() || null,
        sat: aplicacao.sat.trim() || null,
        act: aplicacao.act.trim() || null,
        toefl: aplicacao.toefl.trim() || null,
        ielts: aplicacao.ielts.trim() || null,
        outros_testes: aplicacao.outros_testes.trim() || null,
        extracurriculares: aplicacao.extracurriculares,
        idiomas: aplicacao.idiomas,
        voluntariado: aplicacao.voluntariado,
        orcamento_anual_usd: aplicacao.orcamento_anual_usd.trim() || null,
        precisa_bolsa: aplicacao.precisa_bolsa,
        financa_observacao: aplicacao.financa_observacao.trim() || null,
        ensaio_tema: aplicacao.ensaio_tema.trim() || null,
        ensaio_versao: aplicacao.ensaio_versao.trim() || null,
        paises: aplicacao.paises,
        cursos: aplicacao.cursos,
        preferencia_obs: aplicacao.preferencia_obs.trim() || null,
        status: pronta ? "pronta" : aplicacao.status,
        pronta: pronta ?? aplicacao.pronta,
        atualizado_em: new Date().toISOString(),
      };
      const { error } = await supabase.from("aplicacoes").upsert({ usuario_id: session.user.id, ...payload }, { onConflict: "usuario_id" });
      if (error) throw error;
      setAplicacao((prev) => ({ ...prev, status: pronta ? "pronta" : prev.status, pronta: pronta ?? prev.pronta }));
      setOk(pronta ? "Aplicação enviada para revisão do seu mentor." : "Rascunho salvo.");
      return true;
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const secoesCompletas = [
    !!(aplicacao.serie && aplicacao.escola && aplicacao.media_escolar),
    !!(aplicacao.sat || aplicacao.act || aplicacao.toefl || aplicacao.ielts || aplicacao.outros_testes),
    aplicacao.extracurriculares.length > 0,
    aplicacao.idiomas.length > 0,
    !!(aplicacao.orcamento_anual_usd || aplicacao.financa_observacao),
    !!aplicacao.ensaio_tema,
    aplicacao.paises.length > 0,
    documentos.length > 0,
  ];
  const secoesFeitas = secoesCompletas.filter(Boolean).length;
  const pct = Math.round((secoesFeitas / secoesCompletas.length) * 100);
  const status = STATUS_INFO[aplicacao.status] ?? STATUS_INFO.rascunho;

  const enviarDoc = async (file: File, categoria: string) => {
    setErro(null);
    setOk(null);
    if (file.size > 20 * 1024 * 1024) return setErro("O arquivo deve ter até 20 MB.");
    setSalvando(true);
    const supabase = getClient();
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado.");
      const path = `${session.user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("documentos").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("documentos").insert({
        usuario_id: session.user.id,
        nome: file.name,
        tipo: categoria,
        storage_path: path,
        tamanho_bytes: file.size,
      });
      if (dbErr) throw dbErr;
      setOk("Documento enviado.");
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar.");
    } finally {
      setSalvando(false);
    }
  };

  const baixarDoc = async (doc: Documento) => {
    const supabase = getClient();
    if (!doc.storage_path) return;
    setErro(null);
    try {
      const { data, error } = await supabase.storage.from("documentos").createSignedUrl(doc.storage_path, 3600);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível baixar.");
    }
  };

  const excluirDoc = async (doc: Documento) => {
    if (!window.confirm(`Excluir "${doc.nome}"?`)) return;
    const supabase = getClient();
    setErro(null);
    try {
      if (doc.storage_path) {
        const { error: stErr } = await supabase.storage.from("documentos").remove([doc.storage_path]);
        if (stErr) throw stErr;
      }
      const { error: dbErr } = await supabase.from("documentos").delete().eq("id", doc.id);
      if (dbErr) throw dbErr;
      setDocumentos((prev) => prev.filter((item) => item.id !== doc.id));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível excluir.");
    }
  };

  if (carregando) {
    return (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Simulação de aplicação</p>
        <p className="mt-4 text-[12px] text-graphite/55">Carregando…</p>
      </div>
    );
  }

  return (
    <div>
      <motion.div {...fade}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Simulação de aplicação</p>
            <h1 className="mt-2 font-serif text-[clamp(1.9rem,3vw,2.6rem)] leading-[1] tracking-[-.03em] text-navy">
              Aplicação<span className="text-gold">.</span>
            </h1>
            <p className="mt-2 max-w-[560px] text-[12px] leading-5 text-graphite/55">
              Monte o seu dossiê completo: perfil acadêmico, testes, currículo, finanças, ensaios e documentos. Quando você agendar uma mentoria, seu mentor analisa tudo por aqui.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => salvar(false)}
              disabled={salvando}
              className="inline-flex min-h-11 items-center justify-center gap-3 border border-navy bg-navy px-5 text-[11px] font-bold text-ivory transition-colors hover:bg-deep-navy disabled:cursor-wait disabled:opacity-60"
            >
              <Icon d={icons.save} className="h-4 w-4" />
              {salvando ? "Salvando…" : "Salvar rascunho"}
            </button>
            <button
              type="button"
              onClick={() => salvar(true)}
              disabled={salvando}
              className="inline-flex min-h-11 items-center justify-center gap-3 border border-gold bg-gold px-5 text-[11px] font-bold text-navy transition-colors hover:bg-gold/90 disabled:cursor-wait disabled:opacity-60"
            >
              <Icon d={icons.flag} className="h-4 w-4" />
              {aplicacao.pronta ? "Atualizar e manter pronta" : "Marcar como pronta para revisão"}
            </button>
          </div>
        </div>

        {(erro || ok) && (
          <motion.p {...fade} transition={{ duration: 0.4 }} className={`mt-5 text-[12px] leading-5 ${erro ? "text-[#C96A52]" : "text-gold"}`}>
            {erro ?? ok}
          </motion.p>
        )}
      </motion.div>

      <motion.section
        {...fade}
        transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 grid gap-6 rounded-lg border border-mist bg-white p-5 md:grid-cols-[1fr_auto] md:p-6"
      >
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] ${status.pill}`}>
              <Icon d={icons.spark} className="h-3.5 w-3.5" />
              {status.label}
            </span>
            {aplicacao.pronta && <span className="text-[11px] text-graphite/50">Seu mentor já pode ver este dossiê.</span>}
          </div>
          <div className="mt-5 flex items-center gap-4">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-mist/70">
              <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[12px] font-bold text-navy">{secoesFeitas}/8</p>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-graphite/50">
            Seções completas: perfil acadêmico, testes, atividades, idiomas, finanças, ensaios, preferências e documentos.
          </p>
        </div>
      </motion.section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SectionCard titulo="Perfil acadêmico" desc="Onde você estuda hoje e como é o seu desempenho." delay={0.08}>
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="ap-serie" label="Série / ano atual">
              <input id="ap-serie" value={aplicacao.serie} onChange={(e) => set("serie", e.target.value)} placeholder="Ex.: 2º ano EM" className={inputClass} />
            </Field>
            <Field id="ap-escola" label="Escola">
              <input id="ap-escola" value={aplicacao.escola} onChange={(e) => set("escola", e.target.value)} placeholder="Nome da escola" className={inputClass} />
            </Field>
            <Field id="ap-media" label="Média geral">
              <div className="flex items-end gap-3">
                <input id="ap-media" value={aplicacao.media_escolar} onChange={(e) => set("media_escolar", e.target.value)} placeholder="Ex.: 9,2" inputMode="decimal" className={inputClass} />
                <select value={aplicacao.escala_media} onChange={(e) => set("escala_media", e.target.value)} className={selectClass + " w-28 shrink-0"}>
                  <option value="10">de 10</option>
                  <option value="100">de 100</option>
                  <option value="gpa">GPA 4.0</option>
                </select>
              </div>
            </Field>
            <Field id="ap-posicao" label="Posição na turma (opcional)">
              <input id="ap-posicao" value={aplicacao.posicao_turma} onChange={(e) => set("posicao_turma", e.target.value)} placeholder="Ex.: Top 5%" className={inputClass} />
            </Field>
            <Field id="ap-carga" label="Carga horária semanal (opcional)" className="md:col-span-2">
              <input id="ap-carga" value={aplicacao.carga_horaria_semanal} onChange={(e) => set("carga_horaria_semanal", e.target.value)} placeholder="Ex.: 30h de aula + 6h de estudo guiado" className={inputClass} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard titulo="Testes padronizados" desc="Notas e previsões dos exames que você pretende usar." delay={0.1}>
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="ap-sat" label="SAT">
              <input id="ap-sat" value={aplicacao.sat} onChange={(e) => set("sat", e.target.value)} placeholder="Ex.: 1450" className={inputClass} />
            </Field>
            <Field id="ap-act" label="ACT">
              <input id="ap-act" value={aplicacao.act} onChange={(e) => set("act", e.target.value)} placeholder="Ex.: 31" className={inputClass} />
            </Field>
            <Field id="ap-toefl" label="TOEFL">
              <input id="ap-toefl" value={aplicacao.toefl} onChange={(e) => set("toefl", e.target.value)} placeholder="Ex.: 105" className={inputClass} />
            </Field>
            <Field id="ap-ielts" label="IELTS">
              <input id="ap-ielts" value={aplicacao.ielts} onChange={(e) => set("ielts", e.target.value)} placeholder="Ex.: 7.5" className={inputClass} />
            </Field>
            <Field id="ap-outros" label="Outros testes" className="md:col-span-2">
              <input id="ap-outros" value={aplicacao.outros_testes} onChange={(e) => set("outros_testes", e.target.value)} placeholder="Ex.: ENEM 2025 — 780 pontos" className={inputClass} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard titulo="Atividades extracurriculares" desc="Projetos, clubes, esportes e lideranças — o que você faz fora da sala." delay={0.12}>
          {aplicacao.extracurriculares.length === 0 && <p className="text-[12px] text-graphite/50">Nenhuma atividade adicionada.</p>}
          <div className="space-y-2">
            {aplicacao.extracurriculares.map((extra, index) => (
              <ListItem key={index}>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field id={`ex-area-${index}`} label="Área">
                    <input id={`ex-area-${index}`} value={extra.area} onChange={(e) => set("extracurriculares", aplicacao.extracurriculares.map((item, i) => (i === index ? { ...item, area: e.target.value } : item)))} placeholder="Ex.: Ciência, Artes, Esportes" className={inputClass} />
                  </Field>
                  <Field id={`ex-atividade-${index}`} label="Atividade">
                    <input id={`ex-atividade-${index}`} value={extra.atividade} onChange={(e) => set("extracurriculares", aplicacao.extracurriculares.map((item, i) => (i === index ? { ...item, atividade: e.target.value } : item)))} placeholder="Ex.: Clube de Robótica" className={inputClass} />
                  </Field>
                  <Field id={`ex-funcao-${index}`} label="Função">
                    <input id={`ex-funcao-${index}`} value={extra.funcao} onChange={(e) => set("extracurriculares", aplicacao.extracurriculares.map((item, i) => (i === index ? { ...item, funcao: e.target.value } : item)))} placeholder="Ex.: Capitã de equipe" className={inputClass} />
                  </Field>
                  <Field id={`ex-per-${index}`} label="Periodicidade / horas">
                    <input id={`ex-per-${index}`} value={extra.periodicidade} onChange={(e) => set("extracurriculares", aplicacao.extracurriculares.map((item, i) => (i === index ? { ...item, periodicidade: e.target.value } : item)))} placeholder="Ex.: 2x por semana, 4h" className={inputClass} />
                  </Field>
                  <Field id={`ex-peri-${index}`} label="Período">
                    <input id={`ex-peri-${index}`} value={extra.inicio} onChange={(e) => set("extracurriculares", aplicacao.extracurriculares.map((item, i) => (i === index ? { ...item, inicio: e.target.value } : item)))} placeholder="Ex.: 2024 – 2026" className={inputClass} />
                  </Field>
                  <div className="flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => set("extracurriculares", aplicacao.extracurriculares.filter((_, i) => i !== index))}
                      aria-label="Remover atividade"
                      className="grid h-10 w-10 place-items-center border border-mist text-graphite/60 transition-colors hover:border-[#E0A18C] hover:text-[#C96A52]"
                    >
                      <Icon d={icons.trash} className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </ListItem>
            ))}
          </div>
          <button
            type="button"
            onClick={() => set("extracurriculares", [...aplicacao.extracurriculares, { area: "", atividade: "", funcao: "", periodicidade: "", horas: "", inicio: "", fim: "", descricao: "" }])}
            className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 border border-mist px-4 text-[10px] font-bold uppercase tracking-[.12em] text-graphite/60 transition-colors hover:border-gold hover:text-gold"
          >
            <Icon d={icons.plus} className="h-4 w-4" /> Adicionar atividade
          </button>
        </SectionCard>

        <SectionCard titulo="Idiomas" desc="Quais línguas você fala e o seu nível de cada uma." delay={0.14}>
          {aplicacao.idiomas.length === 0 && <p className="text-[12px] text-graphite/50">Nenhum idioma adicionado.</p>}
          <div className="space-y-2">
            {aplicacao.idiomas.map((item, index) => (
              <ListItem key={index}>
                <div className="grid gap-5 md:grid-cols-[1fr_1fr_auto]">
                  <Field id={`id-id-${index}`} label="Idioma">
                    <input id={`id-id-${index}`} value={item.idioma} onChange={(e) => set("idiomas", aplicacao.idiomas.map((it, i) => (i === index ? { ...it, idioma: e.target.value } : it)))} placeholder="Ex.: Inglês" className={inputClass} />
                  </Field>
                  <Field id={`id-nivel-${index}`} label="Nível">
                    <input id={`id-nivel-${index}`} value={item.nivel} onChange={(e) => set("idiomas", aplicacao.idiomas.map((it, i) => (i === index ? { ...it, nivel: e.target.value } : it)))} placeholder="Ex.: Avançado / C1" className={inputClass} />
                  </Field>
                  <div className="flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => set("idiomas", aplicacao.idiomas.filter((_, i) => i !== index))}
                      aria-label="Remover idioma"
                      className="grid h-10 w-10 place-items-center border border-mist text-graphite/60 transition-colors hover:border-[#E0A18C] hover:text-[#C96A52]"
                    >
                      <Icon d={icons.trash} className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </ListItem>
            ))}
          </div>
          <button
            type="button"
            onClick={() => set("idiomas", [...aplicacao.idiomas, { idioma: "", nivel: "" }])}
            className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 border border-mist px-4 text-[10px] font-bold uppercase tracking-[.12em] text-graphite/60 transition-colors hover:border-gold hover:text-gold"
          >
            <Icon d={icons.plus} className="h-4 w-4" /> Adicionar idioma
          </button>
        </SectionCard>

        <SectionCard titulo="Voluntariado" desc="Trabalho voluntário e projetos de impacto." delay={0.16}>
          {aplicacao.voluntariado.length === 0 && <p className="text-[12px] text-graphite/50">Nenhum voluntariado adicionado.</p>}
          <div className="space-y-2">
            {aplicacao.voluntariado.map((item, index) => (
              <ListItem key={index}>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field id={`vo-org-${index}`} label="Organização">
                    <input id={`vo-org-${index}`} value={item.organizacao} onChange={(e) => set("voluntariado", aplicacao.voluntariado.map((it, i) => (i === index ? { ...it, organizacao: e.target.value } : it)))} placeholder="Ex.: ONG local" className={inputClass} />
                  </Field>
                  <Field id={`vo-fun-${index}`} label="Função">
                    <input id={`vo-fun-${index}`} value={item.funcao} onChange={(e) => set("voluntariado", aplicacao.voluntariado.map((it, i) => (i === index ? { ...it, funcao: e.target.value } : it)))} placeholder="Ex.: Professor de reforço" className={inputClass} />
                  </Field>
                  <Field id={`vo-horas-${index}`} label="Horas / frequência">
                    <input id={`vo-horas-${index}`} value={item.horas} onChange={(e) => set("voluntariado", aplicacao.voluntariado.map((it, i) => (i === index ? { ...it, horas: e.target.value } : it)))} placeholder="Ex.: 3h por semana" className={inputClass} />
                  </Field>
                  <Field id={`vo-per-${index}`} label="Período">
                    <input id={`vo-per-${index}`} value={item.periodo} onChange={(e) => set("voluntariado", aplicacao.voluntariado.map((it, i) => (i === index ? { ...it, periodo: e.target.value } : it)))} placeholder="Ex.: 2025 – 2026" className={inputClass} />
                  </Field>
                  <div className="flex items-end justify-end md:col-span-2">
                    <button
                      type="button"
                      onClick={() => set("voluntariado", aplicacao.voluntariado.filter((_, i) => i !== index))}
                      aria-label="Remover voluntariado"
                      className="grid h-10 w-10 place-items-center border border-mist text-graphite/60 transition-colors hover:border-[#E0A18C] hover:text-[#C96A52]"
                    >
                      <Icon d={icons.trash} className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </ListItem>
            ))}
          </div>
          <button
            type="button"
            onClick={() => set("voluntariado", [...aplicacao.voluntariado, { organizacao: "", funcao: "", horas: "", periodo: "" }])}
            className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 border border-mist px-4 text-[10px] font-bold uppercase tracking-[.12em] text-graphite/60 transition-colors hover:border-gold hover:text-gold"
          >
            <Icon d={icons.plus} className="h-4 w-4" /> Adicionar voluntariado
          </button>
        </SectionCard>

        <SectionCard titulo="Finanças" desc="Orçamento anual e necessidade de bolsa — importante para a estratégia." delay={0.18}>
          <div className="grid gap-5 md:grid-cols-2">
            <Field id="ap-orc" label="Orçamento anual (USD, opcional)">
              <input id="ap-orc" value={aplicacao.orcamento_anual_usd} onChange={(e) => set("orcamento_anual_usd", e.target.value)} placeholder="Ex.: 25.000" className={inputClass} />
            </Field>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">Precisa de bolsa ou auxílio?</label>
              <button
                type="button"
                role="switch"
                aria-checked={aplicacao.precisa_bolsa}
                onClick={() => set("precisa_bolsa", !aplicacao.precisa_bolsa)}
                className={`relative mt-1.5 h-6 w-11 rounded-full transition-colors duration-300 ${aplicacao.precisa_bolsa ? "bg-gold" : "bg-mist"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${aplicacao.precisa_bolsa ? "translate-x-[22px]" : "translate-x-0.5"}`} />
              </button>
            </div>
            <Field id="ap-finobs" label="Observações financeiras" className="md:col-span-2">
              <input id="ap-finobs" value={aplicacao.financa_observacao} onChange={(e) => set("financa_observacao", e.target.value)} placeholder="Ex.: aceito morar em cidade de menor custo" className={inputClass} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard titulo="Ensaios" desc="Tema da redação e versão atual do seu texto." delay={0.2}>
          <div className="grid gap-5">
            <Field id="ap-ens-tema" label="Tema da redação">
              <input id="ap-ens-tema" value={aplicacao.ensaio_tema} onChange={(e) => set("ensaio_tema", e.target.value)} placeholder="Ex.: como a robótica mudou meu jeito de aprender" className={inputClass} />
            </Field>
            <Field id="ap-ens-versao" label="Versão atual (cole ou resuma o que já escreveu)">
              <textarea id="ap-ens-versao" value={aplicacao.ensaio_versao} onChange={(e) => set("ensaio_versao", e.target.value)} rows={5} placeholder="Escreva aqui a sua versão atual do ensaio…" className={inputClass + " resize-y"} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard titulo="Preferências de destino" desc="Países, áreas e cursos que você quer explorar." delay={0.22}>
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">Países</label>
              <div className="flex flex-wrap gap-2">
                {aplicacao.paises.map((pais, index) => (
                  <span key={index} className="inline-flex items-center gap-2 border border-mist bg-ivory px-3 py-2 text-[12px] text-navy">
                    {pais}
                    <button
                      type="button"
                      onClick={() => set("paises", aplicacao.paises.filter((_, i) => i !== index))}
                      aria-label={`Remover ${pais}`}
                      className="text-graphite/40 transition-colors hover:text-[#C96A52]"
                    >
                      <Icon d={icons.trash} className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <PaisInput onAdd={(pais) => set("paises", [...aplicacao.paises, pais])} />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">Cursos / áreas de interesse</label>
              <div className="flex flex-wrap gap-2">
                {aplicacao.cursos.map((curso, index) => (
                  <span key={index} className="inline-flex items-center gap-2 border border-mist bg-ivory px-3 py-2 text-[12px] text-navy">
                    {curso}
                    <button
                      type="button"
                      onClick={() => set("cursos", aplicacao.cursos.filter((_, i) => i !== index))}
                      aria-label={`Remover ${curso}`}
                      className="text-graphite/40 transition-colors hover:text-[#C96A52]"
                    >
                      <Icon d={icons.trash} className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <CursoInput onAdd={(curso) => set("cursos", [...aplicacao.cursos, curso])} />
            </div>
            <Field id="ap-pref-obs" label="Observações de preferência">
              <input id="ap-pref-obs" value={aplicacao.preferencia_obs} onChange={(e) => set("preferencia_obs", e.target.value)} placeholder="Ex.: prefiro universidades menores e com ênfase em pesquisa" className={inputClass} />
            </Field>
          </div>
        </SectionCard>
      </div>

      <DocumentosSection
        documentos={documentos}
        carregando={carregando}
        salvando={salvando}
        onEnviar={enviarDoc}
        onBaixar={baixarDoc}
        onExcluir={excluirDoc}
      />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-mist bg-white p-5 md:p-6">
        <div>
          <p className="font-serif text-[1.3rem] tracking-[-.02em] text-navy">Tudo pronto?</p>
          <p className="mt-1 text-[12px] leading-5 text-graphite/55">
            Ao marcar como pronta, o dossiê fica disponível para o seu mentor revisar antes da mentoria.
          </p>
        </div>
        <button
          type="button"
          onClick={() => salvar(true)}
          disabled={salvando}
          className="inline-flex min-h-12 items-center justify-center gap-3 border border-gold bg-gold px-6 text-[11px] font-bold text-navy transition-colors hover:bg-gold/90 disabled:cursor-wait disabled:opacity-60"
        >
          <Icon d={icons.flag} className="h-4 w-4" />
          {salvando ? "Enviando…" : aplicacao.pronta ? "Atualizar dossiê" : "Marcar como pronta para revisão"}
        </button>
      </div>
    </div>
  );
}

function PaisInput({ onAdd }: { onAdd: (pais: string) => void }) {
  const [value, setValue] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue("");
  };
  return (
    <form onSubmit={submit} className="mt-3 flex items-end gap-3">
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ex.: Estados Unidos" className={inputClass} />
      <button type="submit" aria-label="Adicionar país" className="grid h-10 w-10 shrink-0 place-items-center border border-mist text-graphite/60 transition-colors hover:border-gold hover:text-gold">
        <Icon d={icons.plus} className="h-4 w-4" />
      </button>
    </form>
  );
}

function CursoInput({ onAdd }: { onAdd: (curso: string) => void }) {
  const [value, setValue] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue("");
  };
  return (
    <form onSubmit={submit} className="mt-3 flex items-end gap-3">
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ex.: Ciência da Computação" className={inputClass} />
      <button type="submit" aria-label="Adicionar curso" className="grid h-10 w-10 shrink-0 place-items-center border border-mist text-graphite/60 transition-colors hover:border-gold hover:text-gold">
        <Icon d={icons.plus} className="h-4 w-4" />
      </button>
    </form>
  );
}

function DocumentosSection({
  documentos,
  carregando,
  salvando,
  onEnviar,
  onBaixar,
  onExcluir,
}: {
  documentos: Documento[];
  carregando: boolean;
  salvando: boolean;
  onEnviar: (file: File, categoria: string) => void;
  onBaixar: (doc: Documento) => void;
  onExcluir: (doc: Documento) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [categoria, setCategoria] = useState("historico");

  return (
    <motion.section {...fade} transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }} className={cardClass + " mt-6"}>
      <h2 className="font-serif text-[1.3rem] tracking-[-.02em] text-navy">Documentos da aplicação</h2>
      <p className="mt-1.5 text-[12px] leading-5 text-graphite/55">
        Histórico, boletins, certificados, notas de teste, redações, cartas e comprovantes — até 20 MB por arquivo (PDF, DOC/DOCX, TXT, PNG, JPG).
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="w-full md:w-64">
          <label htmlFor="doc-categoria" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
            Categoria
          </label>
          <select id="doc-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} className={selectClass}>
            {DOC_CATEGORIAS.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={salvando}
          className="inline-flex min-h-11 items-center justify-center gap-3 border border-gold bg-gold px-5 text-[11px] font-bold text-navy transition-colors hover:bg-gold/90 disabled:cursor-wait disabled:opacity-60"
        >
          <Icon d={icons.upload} className="h-4 w-4" />
          {salvando ? "Enviando…" : "Enviar documento"}
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,image/png,image/jpeg"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onEnviar(file, categoria);
            event.target.value = "";
          }}
        />
      </div>

      <div className="mt-6 divide-y divide-mist/80 rounded-lg border border-mist">
        {carregando ? (
          <p className="p-6 text-[12px] text-graphite/55">Carregando documentos…</p>
        ) : documentos.length === 0 ? (
          <p className="p-6 text-[12px] text-graphite/55">Nenhum documento ainda. Envie o primeiro acima.</p>
        ) : (
          documentos.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 px-5 py-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-mist bg-ivory text-graphite/50">
                <Icon d={icons.doc} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-navy">{doc.nome}</p>
                <p className="mt-0.5 text-[10px] text-graphite/50">
                  {catLabel(doc.tipo)}
                  {doc.tamanho_bytes ? ` · ${fmtBytes(doc.tamanho_bytes)}` : ""}
                  <span className="mx-1 text-graphite/30">·</span>
                  {new Date(doc.criado_em).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => onBaixar(doc)} aria-label="Baixar" className="grid h-9 w-9 place-items-center rounded-md border border-mist text-graphite/60 transition-colors hover:border-gold hover:text-gold">
                  <Icon d={icons.download} className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => onExcluir(doc)} aria-label="Excluir" className="grid h-9 w-9 place-items-center rounded-md border border-mist text-graphite/60 transition-colors hover:border-[#E0A18C] hover:text-[#C96A52]">
                  <Icon d={icons.trash} className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.section>
  );
}
