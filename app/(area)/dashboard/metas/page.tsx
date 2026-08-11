"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

const vazio: Omit<Universidade, "id"> = {
  nome: "",
  pais: "",
  curso: "",
  prazo_candidatura: "",
  taxa_candidatura: "",
  status: "planejada",
  nota: 3,
};

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const icons = {
  uni: "M12 2.5 3 6.5v5c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10v-5l-9-4zM8.5 12l2.5 2.5 4.5-5",
  trash: "M4 7h16M9 7V4h6v3M6.5 7l1 14h9l1-14M10 11v6M14 11v6",
  edit: "M4 20h4l10-10-4-4L4 16zM13.5 6.5l4 4",
  plus: "M12 5v14M5 12h14",
  pin: "M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6.6 5.5 5.5 0 0 1 21.5 12C19 16.5 12 21 12 21zM12 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
} as const;

const inputClass =
  "w-full border-b border-mist bg-transparent pb-3 pt-1 text-[15px] text-navy placeholder:text-graphite/35 focus:border-gold focus:outline-none";

const statusColors: Record<string, string> = {
  planejada: "border-mist bg-ivory text-graphite/60",
  em_progresso: "border-gold/50 bg-gold/[.08] text-navy",
  enviada: "border-navy bg-navy text-ivory",
  aceita: "border-gold bg-gold text-navy",
  recusada: "border-[#E0A18C]/60 bg-[#FBF1EC] text-[#C96A52]",
};

export default function MetasPage() {
  const [universidades, setUniversidades] = useState<Universidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState<Omit<Universidade, "id">>(vazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroCarregar, setErroCarregar] = useState<string | null>(null);

  const carregar = async () => {
    setErroCarregar(null);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const { data, error } = await supabase.from("universidades").select("*").order("nota", { ascending: false }).order("nome");
    if (error) setErroCarregar(error.message);
    if (data) setUniversidades(data as Universidade[]);
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const iniciarEdicao = (uni: Universidade) => {
    setEditandoId(uni.id);
    setForm({
      nome: uni.nome,
      pais: uni.pais ?? "",
      curso: uni.curso ?? "",
      prazo_candidatura: uni.prazo_candidatura ?? "",
      taxa_candidatura: uni.taxa_candidatura ?? "",
      status: uni.status,
      nota: uni.nota ?? 3,
    });
    setErro(null);
  };

  const salvar = async (event: FormEvent) => {
    event.preventDefault();
    setErro(null);
    if (form.nome.trim().length < 2) return setErro("Informe o nome da universidade.");
    setSalvando(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setSalvando(false);
      return setErro("Não autenticado.");
    }
    const payload = {
      nome: form.nome.trim(),
      pais: form.pais?.trim() || null,
      curso: form.curso?.trim() || null,
      prazo_candidatura: form.prazo_candidatura || null,
      taxa_candidatura: form.taxa_candidatura?.trim() || null,
      status: form.status,
      nota: form.nota ?? null,
    };
    try {
      if (editandoId) {
        const { error } = await supabase.from("universidades").update(payload).eq("id", editandoId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("universidades").insert({ ...payload, usuario_id: session.user.id });
        if (error) throw error;
      }
      setForm(vazio);
      setEditandoId(null);
      await carregar();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível salvar.";
      setErro(message);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id: string, nome: string) => {
    if (!window.confirm(`Remover "${nome}" da sua lista?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("universidades").delete().eq("id", id);
    if (error) return setErro(error.message);
    setUniversidades((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div>
      <motion.div {...fade}>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Estratégia</p>
        <h1 className="mt-2 font-serif text-[clamp(1.9rem,3vw,2.6rem)] leading-[1] tracking-[-.03em] text-navy">
          Metas & universidades<span className="text-gold">.</span>
        </h1>
        <p className="mt-2 max-w-[520px] text-[12px] leading-5 text-graphite/55">
          Monitore as universidades-alvo, prazos e o andamento de cada candidatura.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <motion.form
          onSubmit={salvar}
          {...fade}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="h-fit rounded-lg border border-mist bg-white p-5 md:p-6 lg:sticky lg:top-24"
        >
          <h2 className="font-serif text-[1.3rem] tracking-[-.02em] text-navy">
            {editandoId ? "Editar universidade" : "Adicionar universidade"}
          </h2>

          {erro && <p className="mt-3 text-[12px] leading-5 text-[#C96A52]">{erro}</p>}

          <div className="mt-5 space-y-5">
            <div>
              <label htmlFor="uni-nome" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
                Universidade *
              </label>
              <input id="uni-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: University of Toronto" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="uni-pais" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
                  País
                </label>
                <input id="uni-pais" value={form.pais ?? ""} onChange={(e) => setForm({ ...form, pais: e.target.value })} placeholder="Canadá" className={inputClass} />
              </div>
              <div>
                <label htmlFor="uni-curso" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
                  Curso
                </label>
                <input id="uni-curso" value={form.curso ?? ""} onChange={(e) => setForm({ ...form, curso: e.target.value })} placeholder="Computer Science" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="uni-prazo" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
                  Prazo da candidatura
                </label>
                <input id="uni-prazo" type="date" value={form.prazo_candidatura ?? ""} onChange={(e) => setForm({ ...form, prazo_candidatura: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label htmlFor="uni-taxa" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
                  Taxa de inscrição
                </label>
                <input id="uni-taxa" value={form.taxa_candidatura ?? ""} onChange={(e) => setForm({ ...form, taxa_candidatura: e.target.value })} placeholder="US$ 90" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 items-end gap-4">
              <div>
                <label htmlFor="uni-status" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
                  Status
                </label>
                <select id="uni-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border-b border-mist bg-ivory pb-3 pt-1 text-[14px] text-navy focus:border-gold focus:outline-none">
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="uni-nota" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
                  Prioridade (1–5)
                </label>
                <input id="uni-nota" type="number" min={1} max={5} value={form.nota ?? 3} onChange={(e) => setForm({ ...form, nota: Math.max(1, Math.min(5, Number(e.target.value) || 3)) })} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-3 border border-gold bg-gold px-5 text-[11px] font-bold text-navy transition-colors hover:bg-gold/90 disabled:cursor-wait disabled:opacity-60"
            >
              <Icon d={editandoId ? icons.edit : icons.plus} className="h-4 w-4" />
              {salvando ? "Salvando…" : editandoId ? "Salvar alterações" : "Adicionar"}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={() => {
                  setEditandoId(null);
                  setForm(vazio);
                  setErro(null);
                }}
                className="inline-flex min-h-11 items-center justify-center border border-mist px-5 text-[11px] font-bold text-graphite/60 transition-colors hover:border-gold hover:text-gold"
              >
                Cancelar
              </button>
            )}
          </div>
        </motion.form>

        <motion.section {...fade} transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-mist bg-white lg:col-span-2">
          {carregando ? (
            <p className="p-6 text-[12px] text-graphite/55">Carregando…</p>
          ) : erroCarregar ? (
            <div className="p-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#FBF1EC] text-[#C96A52]">
                <Icon d={icons.pin} className="h-5 w-5" />
              </span>
              <p className="mt-4 text-[13px] font-semibold text-navy">Não foi possível carregar.</p>
              <p className="mt-1 text-[12px] leading-5 text-graphite/55">{erroCarregar}</p>
              <button type="button" onClick={carregar} className="mt-4 border border-gold bg-gold px-4 py-2 text-[11px] font-bold text-navy hover:bg-gold/90">
                Tentar novamente
              </button>
            </div>
          ) : universidades.length === 0 ? (
            <div className="p-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-navy text-gold">
                <Icon d={icons.uni} className="h-5 w-5" />
              </span>
              <p className="mt-4 text-[13px] font-semibold text-navy">Sua lista está vazia.</p>
              <p className="mt-1 text-[12px] leading-5 text-graphite/55">Adicione a primeira universidade-alvo no formulário ao lado.</p>
            </div>
          ) : (
            <ul className="divide-y divide-mist/80">
              <AnimatePresence initial={false}>
                {universidades.map((uni) => (
                  <motion.li
                    key={uni.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-4 px-5 py-4 md:px-7"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-mist bg-ivory text-gold">
                      <Icon d={icons.uni} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="truncate text-[14px] font-semibold text-navy">{uni.nome}</p>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] ${statusColors[uni.status] ?? statusColors.planejada}`}>
                          {STATUS_LABEL[uni.status] ?? uni.status}
                        </span>
                        {uni.nota ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-gold">
                            <Icon d={icons.pin} className="h-3 w-3" /> {uni.nota}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-[11px] text-graphite/55">
                        {[uni.pais, uni.curso].filter(Boolean).join(" · ") || "Sem detalhes"}
                        {uni.prazo_candidatura ? ` · Prazo: ${new Date(uni.prazo_candidatura).toLocaleDateString("pt-BR")}` : ""}
                        {uni.taxa_candidatura ? ` · Taxa: ${uni.taxa_candidatura}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => iniciarEdicao(uni)}
                        aria-label="Editar"
                        className="grid h-9 w-9 place-items-center rounded-md border border-mist text-graphite/60 transition-colors hover:border-gold hover:text-gold"
                      >
                        <Icon d={icons.edit} className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => excluir(uni.id, uni.nome)}
                        aria-label="Excluir"
                        className="grid h-9 w-9 place-items-center rounded-md border border-mist text-graphite/60 transition-colors hover:border-[#E0A18C] hover:text-[#C96A52]"
                      >
                        <Icon d={icons.trash} className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </motion.section>
      </div>
    </div>
  );
}
