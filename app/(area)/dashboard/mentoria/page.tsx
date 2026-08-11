"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

type Mentoria = {
  id: string;
  mentor_nome: string | null;
  agendada_para: string | null;
  duracao_min: number;
  status: string;
  link: string | null;
  notas: string | null;
};

const icons = {
  mentor: "M2.5 20.5c.8-3 3-4.5 5-4.5s4.2 1.5 5 4.5M7.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM16 6.5a3.5 3.5 0 1 0-1.2 2.7M14.5 16.6c1.8-.4 3.8 0 5 1.9M19 4.5l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3",
  plus: "M12 5v14M5 12h14",
  video: "M4 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM14 10l5-2v8l-5-2",
  cancel: "M6 6l12 12M18 6L6 18",
} as const;

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const inputClass =
  "w-full border-b border-mist bg-transparent pb-3 pt-1 text-[15px] text-navy placeholder:text-graphite/35 focus:border-gold focus:outline-none";

const nowLocal = () => {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function MentoriaPage() {
  const [mentorias, setMentorias] = useState<Mentoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [agendadaPara, setAgendadaPara] = useState(nowLocal());
  const [duracao, setDuracao] = useState(30);
  const [tema, setTema] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const carregar = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from("mentorias")
      .select("*")
      .order("agendada_para", { ascending: false });
    if (data) setMentorias(data as Mentoria[]);
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const agendar = async (event: FormEvent) => {
    event.preventDefault();
    setErro(null);
    setOk(null);
    if (!agendadaPara) return setErro("Escolha a data e o horário.");
    setSalvando(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setSalvando(false);
      return setErro("Não autenticado.");
    }
    const { error } = await supabase.from("mentorias").insert({
      usuario_id: session.user.id,
      mentor_nome: "Mentor Fostern",
      agendada_para: new Date(agendadaPara).toISOString(),
      duracao_min: duracao,
      status: "agendada",
      notas: tema.trim() || null,
    });
    setSalvando(false);
    if (error) return setErro(error.message);

    const { data: pref } = await supabase
      .from("preferencias")
      .select("email_mentoria")
      .eq("usuario_id", session.user.id)
      .maybeSingle();
    if (pref?.email_mentoria !== false) {
      const quando = new Date(agendadaPara).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      await supabase.from("notificacoes").insert({
        usuario_id: session.user.id,
        tipo: "mentoria",
        titulo: "Mentoria agendada",
        corpo: `${quando} · ${duracao} min de sessão`,
        link: "/dashboard/mentoria",
      });
    }

    setTema("");
    setAgendadaPara(nowLocal());
    setOk("Mentoria agendada. Você receberá o link da chamada por e-mail.");
    await carregar();
  };

  const cancelar = async (m: Mentoria) => {
    if (!window.confirm(`Cancelar a mentoria de ${m.agendada_para ? new Date(m.agendada_para).toLocaleString("pt-BR") : "sua sessão"}?`)) return;
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.from("mentorias").update({ status: "cancelada" }).eq("id", m.id);
    if (error) return setErro(error.message);
    setMentorias((prev) => prev.map((item) => (item.id === m.id ? { ...item, status: "cancelada" } : item)));
  };

  const proximas = mentorias.filter((m) => m.status === "agendada");
  const historico = mentorias.filter((m) => m.status !== "agendada");

  return (
    <div>
      <motion.div {...fade}>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Acompanhamento</p>
        <h1 className="mt-2 font-serif text-[clamp(1.9rem,3vw,2.6rem)] leading-[1] tracking-[-.03em] text-navy">
          Mentoria<span className="text-gold">.</span>
        </h1>
        <p className="mt-2 max-w-[520px] text-[12px] leading-5 text-graphite/55">
          Agende suas sessões de acompanhamento e mantenha a pauta dos encontros aqui.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <motion.form
          onSubmit={agendar}
          {...fade}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="h-fit rounded-lg border border-mist bg-white p-5 md:p-6 lg:sticky lg:top-24"
        >
          <h2 className="font-serif text-[1.3rem] tracking-[-.02em] text-navy">Agendar sessão</h2>
          <div className="mt-5 space-y-5">
            <div>
              <label htmlFor="men-data" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
                Data e horário
              </label>
              <input id="men-data" type="datetime-local" value={agendadaPara} onChange={(e) => setAgendadaPara(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="men-duracao" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
                Duração
              </label>
              <select id="men-duracao" value={duracao} onChange={(e) => setDuracao(Number(e.target.value))} className="w-full border-b border-mist bg-ivory pb-3 pt-1 text-[14px] text-navy focus:border-gold focus:outline-none">
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </div>
            <div>
              <label htmlFor="men-tema" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
                Tema da pauta
              </label>
              <input id="men-tema" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex.: revisar meu ensaio" className={inputClass} />
            </div>
          </div>

          {(erro || ok) && (
            <p className={`mt-4 text-[12px] leading-5 ${erro ? "text-[#C96A52]" : "text-gold"}`}>{erro ?? ok}</p>
          )}

          <button
            type="submit"
            disabled={salvando}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-3 border border-gold bg-gold px-5 text-[11px] font-bold text-navy transition-colors hover:bg-gold/90 disabled:cursor-wait disabled:opacity-60"
          >
            <Icon d={icons.plus} className="h-4 w-4" />
            {salvando ? "Agendando…" : "Agendar mentoria"}
          </button>
        </motion.form>

        <motion.section {...fade} transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-mist bg-white lg:col-span-2">
          <div className="border-b border-mist px-5 py-4 md:px-7">
            <h2 className="font-serif text-[1.3rem] tracking-[-.02em] text-navy">Próximas sessões</h2>
          </div>
          {carregando ? (
            <p className="p-6 text-[12px] text-graphite/55">Carregando…</p>
          ) : proximas.length === 0 ? (
            <div className="p-10 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-navy text-gold">
                <Icon d={icons.mentor} className="h-5 w-5" />
              </span>
              <p className="mt-4 text-[13px] font-semibold text-navy">Nenhuma sessão agendada.</p>
              <p className="mt-1 text-[12px] leading-5 text-graphite/55">Agende sua primeira mentoria no formulário ao lado.</p>
            </div>
          ) : (
            <ul className="divide-y divide-mist/80">
              <AnimatePresence initial={false}>
                {proximas.map((m) => (
                  <motion.li key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-4 px-5 py-4 md:px-7">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-mist bg-ivory text-gold">
                      <Icon d={icons.clock} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-navy">{m.mentor_nome ?? "Mentor Fostern"}</p>
                      <p className="mt-0.5 text-[11px] text-graphite/55">
                        {m.agendada_para ? new Date(m.agendada_para).toLocaleString("pt-BR") : "A confirmar"} · {m.duracao_min} min
                      </p>
                      {m.notas && <p className="mt-1 truncate text-[11px] text-graphite/45">Pauta: {m.notas}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => cancelar(m)}
                      className="inline-flex min-h-9 shrink-0 items-center gap-2 border border-mist px-3 text-[10px] font-bold text-graphite/60 transition-colors hover:border-[#E0A18C] hover:text-[#C96A52]"
                    >
                      <Icon d={icons.cancel} className="h-3.5 w-3.5" /> Cancelar
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}

          {historico.length > 0 && (
            <>
              <div className="border-b border-mist px-5 py-4 md:px-7">
                <h2 className="font-serif text-[1.15rem] tracking-[-.02em] text-graphite/70">Histórico</h2>
              </div>
              <ul className="divide-y divide-mist/80">
                {historico.map((m) => (
                  <li key={m.id} className="flex items-center gap-4 px-5 py-4 opacity-70 md:px-7">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-mist bg-ivory text-graphite/50">
                      <Icon d={icons.video} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-graphite/80">{m.mentor_nome ?? "Mentor Fostern"}</p>
                      <p className="mt-0.5 text-[11px] text-graphite/50">
                        {m.agendada_para ? new Date(m.agendada_para).toLocaleString("pt-BR") : "—"} · {m.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </motion.section>
      </div>
    </div>
  );
}
