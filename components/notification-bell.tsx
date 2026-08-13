"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";

type Notificacao = {
  id: string;
  tipo: string;
  titulo: string;
  corpo: string | null;
  link: string | null;
  lida: boolean;
  criada_em: string;
};

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const SINO = "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0";

function tempoRelativo(iso: string): string {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `há ${dias} d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function NotificationBell() {
  const { user } = useUser();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const naoLidas = itens.filter((n) => !n.lida).length;

  const carregar = async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setCarregando(false);
        return;
      }
      const { data } = await supabase
        .from("notificacoes")
        .select("id, tipo, titulo, corpo, link, lida, criada_em")
        .order("criada_em", { ascending: false })
        .limit(10);
      if (data) setItens(data as Notificacao[]);
    } catch {
      // Rede indisponível ou sessão expirada: mantém o que já existe.
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    carregar();
    const supabase = createClient();
    const contextoSeguro = typeof window === "undefined" || window.isSecureContext;
    let canal: ReturnType<typeof supabase.channel> | null = null;
    if (contextoSeguro) {
      try {
        canal = supabase
          .channel("fostern:notificacoes")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "notificacoes", filter: `usuario_id=eq.${user.id}` },
            (payload) => {
              const nova = payload.new as Notificacao;
              if (nova?.id) setItens((prev) => [nova, ...prev].slice(0, 10));
            }
          )
          .subscribe();
      } catch {
        canal = null;
      }
    }
    const intervalo = window.setInterval(carregar, 120000);
    return () => {
      if (canal) {
        try {
          supabase.removeChannel(canal);
        } catch {
          // Sem WebSocket disponível: nada a remover.
        }
      }
      window.clearInterval(intervalo);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!aberto) return;
    const aoClicar = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setAberto(false);
    };
    const aoTeclar = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const abrir = (n: Notificacao) => {
    setAberto(false);
    if (!n.lida) {
      setItens((prev) => prev.map((i) => (i.id === n.id ? { ...i, lida: true } : i)));
      createClient().from("notificacoes").update({ lida: true }).eq("id", n.id).then();
    }
    if (n.link) router.push(n.link);
  };

  const marcarTodas = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    setItens((prev) => prev.map((i) => ({ ...i, lida: true })));
    await supabase.from("notificacoes").update({ lida: true }).eq("usuario_id", session.user.id).is("lida", false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label={naoLidas > 0 ? `Notificações, ${naoLidas} não lidas` : "Notificações"}
        aria-expanded={aberto}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-ivory/80 transition-colors hover:border-gold hover:text-gold"
      >
        <Icon d={SINO} className="h-5 w-5" />
        {naoLidas > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[9px] font-bold text-navy">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-[340px] max-w-[calc(100vw-32px)] overflow-hidden rounded-lg border border-mist bg-white shadow-[0_24px_60px_rgba(8,29,54,.18)]"
          >
            <div className="flex items-center justify-between border-b border-mist px-4 py-3">
              <p className="text-[12px] font-bold text-navy">Notificações</p>
              {naoLidas > 0 && (
                <button type="button" onClick={marcarTodas} className="text-[10px] font-bold text-gold transition-opacity hover:opacity-70">
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <ul className="no-scrollbar max-h-[380px] overflow-y-auto">
              {carregando && itens.length === 0 ? (
                <li className="px-4 py-8 text-center text-[11px] text-graphite/50">Carregando…</li>
              ) : itens.length === 0 ? (
                <li className="px-4 py-8 text-center">
                  <p className="text-[12px] font-semibold text-navy">Nada por aqui.</p>
                  <p className="mt-1 text-[11px] leading-5 text-graphite/55">Avisos importantes aparecem neste sino.</p>
                </li>
              ) : (
                itens.map((n) => (
                  <li key={n.id} className="border-b border-mist/70 last:border-0">
                    <button type="button" onClick={() => abrir(n)} className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-ivory/70">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.lida ? "bg-transparent" : "bg-gold"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className={`truncate text-[12px] font-semibold ${n.lida ? "text-graphite/70" : "text-navy"}`}>{n.titulo}</span>
                          <span className="shrink-0 text-[9px] text-graphite/45">{tempoRelativo(n.criada_em)}</span>
                        </span>
                        {n.corpo && <span className="mt-0.5 block text-[11px] leading-4 text-graphite/55">{n.corpo}</span>}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
