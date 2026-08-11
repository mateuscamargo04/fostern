"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const inputClass =
  "w-full border-b border-mist bg-transparent pb-3 pt-1 text-[15px] text-navy placeholder:text-graphite/35 focus:border-gold focus:outline-none";

type AssinaturaInfo = {
  id: string;
  inicio_em: string;
  termino_em: string;
  status: string;
  plano_nome: string;
};

type Preferencias = {
  email_mentoria: boolean;
  email_prazos: boolean;
  email_promocoes: boolean;
};

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-mist/80 py-4 last:border-0">
      <div>
        <p className="text-[13px] font-semibold text-navy">{label}</p>
        <p className="mt-0.5 text-[11px] leading-5 text-graphite/55">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-gold" : "bg-mist"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const { user } = useUser();

  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const [assinatura, setAssinatura] = useState<AssinaturaInfo | null>(null);
  const [carregandoPlano, setCarregandoPlano] = useState(true);
  const [cancelando, setCancelando] = useState(false);

  const [prefs, setPrefs] = useState<Preferencias>({ email_mentoria: true, email_prazos: true, email_promocoes: false });

  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (active) setCarregandoPlano(false);
        return;
      }

      const [{ data: sub }, { data: pref }] = await Promise.all([
        supabase
          .from("assinaturas")
          .select("id, inicio_em, termino_em, status, planos(nome)")
          .eq("usuario_id", session.user.id)
          .order("inicio_em", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("preferencias").select("*").eq("usuario_id", session.user.id).maybeSingle(),
      ]);

      if (!active) return;
      if (sub?.status === "ativa") {
        const plano = Array.isArray(sub.planos) ? sub.planos[0] : sub.planos;
        setAssinatura({
          id: sub.id,
          inicio_em: sub.inicio_em ?? "",
          termino_em: sub.termino_em ?? "",
          status: sub.status,
          plano_nome: (plano as { nome?: string } | null)?.nome ?? "Plano pago",
        });
      } else {
        setAssinatura(null);
      }
      if (pref) {
        setPrefs({
          email_mentoria: pref.email_mentoria ?? true,
          email_prazos: pref.email_prazos ?? true,
          email_promocoes: pref.email_promocoes ?? false,
        });
      }
      setCarregandoPlano(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const alterarSenha = async (event: FormEvent) => {
    event.preventDefault();
    setErro(null);
    setOk(null);
    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    if (senha !== confirmar) return setErro("As senhas não conferem.");
    setSalvandoSenha(true);
    const { error } = await createClient().auth.updateUser({ password: senha });
    setSalvandoSenha(false);
    if (error) return setErro(error.message);
    setSenha("");
    setConfirmar("");
    setOk("Senha alterada.");
  };

  const salvarPref = async (next: Preferencias) => {
    setPrefs(next);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("preferencias").upsert(
      { usuario_id: session.user.id, ...next, atualizado_em: new Date().toISOString() },
      { onConflict: "usuario_id" }
    );
  };

  const cancelarPlano = async () => {
    if (!window.confirm("Cancelar sua assinatura? Você perde o acesso ao painel no fim do ciclo.")) return;
    setErro(null);
    setOk(null);
    setCancelando(true);
    try {
      const res = await fetch("/api/assinatura/cancelar", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível cancelar.");
      setAssinatura(null);
      setOk("Assinatura cancelada. O acesso continua até o fim do ciclo atual.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível cancelar.";
      setErro(message);
    } finally {
      setCancelando(false);
    }
  };

  const apagarConta = async () => {
    if (!window.confirm("Tem certeza? Todos os seus dados (perfil, progresso, documentos e assinatura) serão apagados permanentemente. Essa ação não pode ser desfeita.")) return;
    setErro(null);
    setOk(null);
    try {
      const res = await fetch("/api/conta", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível apagar a conta.");
      await createClient().auth.signOut();
      window.location.href = "/";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível apagar a conta.";
      setErro(message);
    }
  };

  return (
    <div>
      <motion.div {...fade}>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Sua conta</p>
        <h1 className="mt-2 font-serif text-[clamp(1.9rem,3vw,2.6rem)] leading-[1] tracking-[-.03em] text-navy">
          Configurações<span className="text-gold">.</span>
        </h1>
        <p className="mt-2 max-w-[520px] text-[12px] leading-5 text-graphite/55">
          Senha, plano, notificações e exclusão da conta.
        </p>
      </motion.div>

      {(erro || ok) && (
        <motion.p {...fade} transition={{ duration: 0.4 }} className={`mt-5 text-[12px] leading-5 ${erro ? "text-[#C96A52]" : "text-gold"}`}>
          {erro ?? ok}
        </motion.p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <motion.section {...fade} transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-mist bg-white p-5 md:p-6">
          <h2 className="font-serif text-[1.3rem] tracking-[-.02em] text-navy">Senha</h2>
          <p className="mt-1.5 text-[12px] leading-5 text-graphite/55">Use pelo menos 8 caracteres.</p>
          <form onSubmit={alterarSenha} className="mt-5 space-y-5">
            <div>
              <label htmlFor="cfg-nova-senha" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
                Nova senha
              </label>
              <input id="cfg-nova-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" className={inputClass} />
            </div>
            <div>
              <label htmlFor="cfg-confirmar-senha" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
                Confirmar nova senha
              </label>
              <input id="cfg-confirmar-senha" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} autoComplete="new-password" className={inputClass} />
            </div>
            <button
              type="submit"
              disabled={salvandoSenha}
              className="inline-flex min-h-11 items-center justify-center gap-3 border border-gold bg-gold px-5 text-[11px] font-bold text-navy transition-colors duration-300 hover:bg-gold/90 disabled:cursor-wait disabled:opacity-60"
            >
              {salvandoSenha ? "Alterando…" : "Alterar senha"}
            </button>
          </form>
        </motion.section>

        <motion.section {...fade} transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-mist bg-white p-5 md:p-6">
          <h2 className="font-serif text-[1.3rem] tracking-[-.02em] text-navy">Plano</h2>
          {carregandoPlano ? (
            <p className="mt-4 text-[12px] text-graphite/55">Carregando…</p>
          ) : assinatura ? (
            <div className="mt-4">
              <div className="rounded-md border border-gold/50 bg-gold/[.05] p-5">
                <p className="text-[9px] font-bold uppercase tracking-[.16em] text-gold">Plano ativo</p>
                <p className="mt-1.5 font-serif text-[22px] leading-tight text-navy">{assinatura.plano_nome}</p>
                <p className="mt-2 text-[12px] leading-5 text-graphite/60">
                  Renova em {assinatura.termino_em ? fmtData(assinatura.termino_em) : "breve"}.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelarPlano}
                disabled={cancelando}
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-3 border border-[#E0A18C] px-5 text-[11px] font-bold text-[#C96A52] transition-colors hover:bg-[#FBF1EC] disabled:cursor-wait disabled:opacity-60"
              >
                {cancelando ? "Cancelando…" : "Cancelar assinatura"}
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-[12px] leading-5 text-graphite/55">Você está no plano gratuito.</p>
              <Link href="/planos" className="mt-4 inline-flex min-h-11 items-center justify-center gap-3 border border-gold bg-gold px-5 text-[11px] font-bold text-navy transition-colors hover:bg-gold/90">
                Ver planos
              </Link>
            </div>
          )}
        </motion.section>

        <motion.section {...fade} transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-mist bg-white p-5 md:p-6 lg:col-span-2">
          <h2 className="font-serif text-[1.3rem] tracking-[-.02em] text-navy">Notificações</h2>
          <p className="mt-1.5 text-[12px] leading-5 text-graphite/55">Escolha o que você quer receber aqui no app e, quando disponível, no e-mail ({user?.email ?? "seu e-mail"}).</p>
          <div className="mt-5 divide-y divide-transparent">
            <Toggle
              checked={prefs.email_mentoria}
              onChange={(v) => salvarPref({ ...prefs, email_mentoria: v })}
              label="Lembretes de mentoria"
              desc="Avisos antes de cada sessão e quando uma nova janela abrir."
            />
            <Toggle
              checked={prefs.email_prazos}
              onChange={(v) => salvarPref({ ...prefs, email_prazos: v })}
              label="Prazos de candidatura"
              desc="Alertas de datas-limite das universidades na sua lista."
            />
            <Toggle
              checked={prefs.email_promocoes}
              onChange={(v) => salvarPref({ ...prefs, email_promocoes: v })}
              label="Novidades e ofertas"
              desc="Lançamentos de módulos, cursos e promoções da Fostern."
            />
          </div>
        </motion.section>

        <motion.section {...fade} transition={{ duration: 0.7, delay: 0.26, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-[#E0A18C]/50 bg-[#FBF1EC] p-5 md:p-6 lg:col-span-2">
          <h2 className="font-serif text-[1.3rem] tracking-[-.02em] text-[#C96A52]">Zona de perigo</h2>
          <p className="mt-1.5 text-[12px] leading-5 text-graphite/60">
            Excluir sua conta apaga permanentemente seu perfil, progresso, documentos e assinatura.
          </p>
          <button
            type="button"
            onClick={apagarConta}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-3 border border-[#C96A52] bg-[#C96A52] px-5 text-[11px] font-bold text-white transition-colors hover:bg-[#B0543F]"
          >
            Excluir minha conta
          </button>
        </motion.section>
      </div>
    </div>
  );
}
