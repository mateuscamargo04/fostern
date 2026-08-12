"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

type Postagem = {
  id: string;
  usuario_id: string;
  texto: string;
  criado_em: string;
};

function fmtQuando(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const icons = {
  trash: "M4 7h16M9 7V4h6v3M6.5 7l1 14h9l1-14M10 11v6M14 11v6",
  send: "M3 11l18-8-8 18-2.5-7.5zM3 11l7.5 2.5",
} as const;

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy font-serif text-[13px] font-semibold text-gold">{initials}</span>;
}

export default function ComunidadePage() {
  const { user } = useUser();
  const [postagens, setPostagens] = useState<Postagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("postagens")
      .select("id, usuario_id, texto, criado_em")
      .order("criado_em", { ascending: false })
      .limit(50);
    if (data) setPostagens(data as Postagem[]);
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const publicar = async (event: FormEvent) => {
    event.preventDefault();
    setErro(null);
    const limpo = texto.trim();
    if (limpo.length < 1) return setErro("Escreva algo para publicar.");
    setEnviando(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setEnviando(false);
      return setErro("Não autenticado.");
    }
    const { error } = await supabase.from("postagens").insert({ usuario_id: session.user.id, texto: limpo });
    setEnviando(false);
    if (error) return setErro(error.message);
    setTexto("");
    await carregar();
  };

  const excluir = async (post: Postagem) => {
    if (!user || post.usuario_id !== user.id) return;
    if (!window.confirm("Excluir esta publicação?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("postagens").delete().eq("id", post.id);
    if (error) return setErro(error.message);
    setPostagens((prev) => prev.filter((item) => item.id !== post.id));
  };

  return (
    <div>
      <motion.div {...fade}>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Estudantes Fostern</p>
        <h1 className="mt-2 font-serif text-[clamp(1.9rem,3vw,2.6rem)] leading-[1] tracking-[-.03em] text-navy">
          Comunidade<span className="text-gold">.</span>
        </h1>
        <p className="mt-2 max-w-[520px] text-[12px] leading-5 text-graphite/55">
          Compartilhe conquistas, dúvidas e dicas com outros estudantes.
        </p>
      </motion.div>

      {erro && <p className="mt-5 text-[12px] leading-5 text-[#C96A52]">{erro}</p>}

      <motion.form
        onSubmit={publicar}
        {...fade}
        transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 flex items-start gap-4 rounded-lg border border-mist bg-white p-5 md:p-6"
      >
        <Avatar name={user?.name ?? "ES"} />
        <div className="flex-1">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="O que você quer compartilhar com a comunidade?"
            rows={2}
            maxLength={1000}
            className="w-full resize-none bg-transparent text-[14px] leading-6 text-navy placeholder:text-graphite/40 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-graphite/40">{texto.length}/1000</span>
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-gold bg-gold px-4 text-[10px] font-bold uppercase tracking-[.12em] text-navy transition-colors hover:bg-gold/90 disabled:cursor-wait disabled:opacity-60"
            >
              <Icon d={icons.send} className="h-3.5 w-3.5" />
              {enviando ? "Publicando…" : "Publicar"}
            </button>
          </div>
        </div>
      </motion.form>

      <motion.section {...fade} transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 1, 0.36, 1] }} className="mt-6">
        {carregando ? (
          <p className="rounded-lg border border-mist bg-white p-6 text-[12px] text-graphite/55">Carregando…</p>
        ) : postagens.length === 0 ? (
          <div className="rounded-lg border border-mist bg-white p-10 text-center">
            <p className="text-[13px] font-semibold text-navy">Nenhuma publicação ainda.</p>
            <p className="mt-1 text-[12px] leading-5 text-graphite/55">Seja a primeira pessoa a compartilhar algo com a turma.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {postagens.map((post) => (
                <motion.li
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg border border-mist bg-white p-5 md:p-6"
                >
                  <div className="flex items-start gap-4">
                    <Avatar name={post.usuario_id === user?.id ? (user?.name ?? "Você") : "ES"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-semibold text-navy">
                          {post.usuario_id === user?.id ? (user?.name ?? "Você") : "Estudante Fostern"}
                        </p>
                        {fmtQuando(post.criado_em) && (
                          <span className="text-[10px] text-graphite/40">· {fmtQuando(post.criado_em)}</span>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-graphite/80">{post.texto}</p>
                      {post.usuario_id === user?.id && (
                        <button
                          type="button"
                          onClick={() => excluir(post)}
                          className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold text-graphite/45 transition-colors hover:text-[#C96A52]"
                        >
                          <Icon d={icons.trash} className="h-3.5 w-3.5" /> Excluir
                        </button>
                      )}
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </motion.section>
    </div>
  );
}
