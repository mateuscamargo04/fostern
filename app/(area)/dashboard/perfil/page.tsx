"use client";

import { FormEvent, useRef, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useUser, USER_UPDATED_EVENT } from "@/lib/use-user";

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const inputClass =
  "w-full border-b border-mist bg-transparent pb-3 pt-1 text-[15px] text-navy placeholder:text-graphite/35 focus:border-gold focus:outline-none";

export default function PerfilPage() {
  const { user } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState(user?.name ?? "");
  const [editandoEmail, setEditandoEmail] = useState(false);
  const [novoEmail, setNovoEmail] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const notificar = (msg: string | null, tipo: "erro" | "ok") => {
    setErro(tipo === "erro" ? msg : null);
    setOk(tipo === "ok" ? msg : null);
  };

  const salvarNome = async (event: FormEvent) => {
    event.preventDefault();
    setErro(null);
    setOk(null);
    if (nome.trim().length < 2) return notificar("Informe seu nome completo.", "erro");
    setSalvando(true);
    const supabase = createClient();
    try {
      const { error: authErr } = await supabase.auth.updateUser({ data: { nome: nome.trim() } });
      if (authErr) throw authErr;
      const { error: dbErr } = await supabase.from("perfis").update({ nome: nome.trim() }).eq("id", user!.id);
      if (dbErr) throw dbErr;
      window.dispatchEvent(new Event(USER_UPDATED_EVENT));
      notificar("Nome atualizado.", "ok");
    } catch (err) {
      notificar(err instanceof Error ? err.message : "Algo deu errado. Tente novamente.", "erro");
    } finally {
      setSalvando(false);
    }
  };

  const salvarEmail = async (event: FormEvent) => {
    event.preventDefault();
    setErro(null);
    setOk(null);
    const email = novoEmail.trim();
    if (!email.includes("@") || !email.includes(".")) return notificar("Informe um e-mail válido.", "erro");
    if (email === user?.email) return notificar("Este já é o seu e-mail atual.", "erro");
    setSalvando(true);
    const supabase = createClient();
    try {
      const { error: authErr } = await supabase.auth.updateUser({ email });
      if (authErr) throw authErr;
      const { error: dbErr } = await supabase.from("perfis").update({ email }).eq("id", user!.id);
      if (dbErr) throw dbErr;
      window.dispatchEvent(new Event(USER_UPDATED_EVENT));
      setEditandoEmail(false);
      setNovoEmail("");
      notificar("Enviamos uma confirmação para o novo e-mail. Valide para concluir.", "ok");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Algo deu errado. Tente novamente.";
      if (/already/i.test(message)) {
        notificar("Este e-mail já está em uso por outra conta.", "erro");
      } else {
        notificar(message, "erro");
      }
    } finally {
      setSalvando(false);
    }
  };

  const trocarAvatar = async (file: File) => {
    setErro(null);
    setOk(null);
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return notificar("Use PNG, JPG, WEBP ou GIF.", "erro");
    if (file.size > 2 * 1024 * 1024) return notificar("A imagem deve ter até 2 MB.", "erro");
    setSalvando(true);
    const supabase = createClient();
    try {
      const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
      const path = `${user!.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("perfis").update({ avatar_url: data.publicUrl }).eq("id", user!.id);
      if (dbErr) throw dbErr;
      window.dispatchEvent(new Event(USER_UPDATED_EVENT));
      notificar("Foto de perfil atualizada.", "ok");
    } catch (err) {
      notificar(err instanceof Error ? err.message : "Não foi possível enviar a foto.", "erro");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div>
      <motion.div {...fade}>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Sua conta</p>
        <h1 className="mt-2 font-serif text-[clamp(1.9rem,3vw,2.6rem)] leading-[1] tracking-[-.03em] text-navy">
          Perfil<span className="text-gold">.</span>
        </h1>
        <p className="mt-2 max-w-[520px] text-[12px] leading-5 text-graphite/55">
          Seus dados aparecem na sua área do estudante e nas mentorias.
        </p>
      </motion.div>

      {(erro || ok) && (
        <p className={`mt-5 text-[12px] leading-5 ${erro ? "text-[#C96A52]" : "text-gold"}`}>{erro ?? ok}</p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <motion.section {...fade} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="rounded-lg border border-mist bg-white p-5 md:p-6">
          <h2 className="font-serif text-[1.3rem] tracking-[-.02em] text-navy">Foto de perfil</h2>
          <p className="mt-1.5 text-[12px] leading-5 text-graphite/55">PNG, JPG, WEBP ou GIF · até 2 MB.</p>

          <div className="mt-6 flex items-center gap-5">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.name} className="h-20 w-20 shrink-0 rounded-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/images/avatar-default.svg" alt="Foto de perfil padrão" className="h-20 w-20 shrink-0 rounded-full object-cover" />
            )}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={salvando}
                className="inline-flex min-h-10 items-center justify-center border border-navy bg-navy px-4 text-[10px] font-bold uppercase tracking-[.12em] text-ivory transition-colors hover:bg-deep-navy disabled:cursor-wait disabled:opacity-60"
              >
                {salvando ? "Enviando…" : "Enviar foto"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) trocarAvatar(file);
                  event.target.value = "";
                }}
              />
            </div>
          </div>
        </motion.section>

        <div className="space-y-6 lg:col-span-2">
          <motion.form
            onSubmit={salvarNome}
            {...fade}
            transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-lg border border-mist bg-white p-5 md:p-6"
          >
            <h2 className="font-serif text-[1.3rem] tracking-[-.02em] text-navy">Dados pessoais</h2>
            <p className="mt-1.5 text-[12px] leading-5 text-graphite/55">
              O nome é usado na saudação e na assinatura das suas mentorias.
            </p>

            <div className="mt-6">
              <label htmlFor="perfil-nome" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
                Nome completo
              </label>
              <input id="perfil-nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" className={inputClass} />
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 border border-gold bg-gold px-6 text-[11px] font-bold text-navy transition-colors duration-300 hover:bg-gold/90 disabled:cursor-wait disabled:opacity-60"
            >
              {salvando ? "Salvando…" : "Salvar alterações"}
            </button>
          </motion.form>

          <motion.section
            {...fade}
            transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-lg border border-mist bg-white p-5 md:p-6"
          >
            <h2 className="font-serif text-[1.3rem] tracking-[-.02em] text-navy">E-mail de acesso</h2>
            <p className="mt-1.5 text-[12px] leading-5 text-graphite/55">
              Usado para login e para receber avisos de prazos e mentorias.
            </p>

            {!editandoEmail ? (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] text-navy">{user?.email}</p>
                  <p className="mt-1 text-[10px] leading-4 text-graphite/45">
                    Trocar o e-mail envia uma confirmação para o novo endereço.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditandoEmail(true)}
                  className="inline-flex min-h-10 items-center justify-center border border-navy bg-navy px-4 text-[10px] font-bold uppercase tracking-[.12em] text-ivory transition-colors hover:bg-deep-navy"
                >
                  Alterar e-mail
                </button>
              </div>
            ) : (
              <form onSubmit={salvarEmail} className="mt-6">
                <label htmlFor="perfil-email" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-graphite/50">
                  Novo e-mail
                </label>
                <input
                  id="perfil-email"
                  type="email"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  autoComplete="email"
                  placeholder={user?.email}
                  className={inputClass}
                />
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={salvando}
                    className="inline-flex min-h-11 items-center justify-center border border-gold bg-gold px-5 text-[11px] font-bold text-navy transition-colors hover:bg-gold/90 disabled:cursor-wait disabled:opacity-60"
                  >
                    {salvando ? "Enviando…" : "Confirmar novo e-mail"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditandoEmail(false);
                      setNovoEmail("");
                      setErro(null);
                      setOk(null);
                    }}
                    className="inline-flex min-h-11 items-center justify-center border border-mist px-5 text-[11px] font-bold text-graphite/60 transition-colors hover:border-gold hover:text-gold"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}
