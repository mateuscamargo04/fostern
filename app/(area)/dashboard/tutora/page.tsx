"use client";

import { FormEvent, Fragment, ReactNode, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/use-user";

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const sugestoes = [
  "Como funciona a candidatura pelo Common App?",
  "Revise meu ensaio pessoal",
  "Qual a diferença entre SAT e ACT?",
  "Como consigo bolsa em universidades dos EUA?",
];

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const icons = {
  send: "M4 11.5 20 4l-4.5 16-4-6.5zM4 11.5h8",
  spark: "M12 3v5M12 16v5M3 12h5M16 12h5M5.6 5.6l3.5 3.5M14.9 14.9l3.5 3.5M18.4 5.6l-3.5 3.5M9.1 14.9l-3.5 3.5",
};

function negrito(texto: string): ReactNode {
  const partes = texto.split(/\*\*(.+?)\*\*/g);
  return partes.map((parte, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-navy">
        {parte}
      </strong>
    ) : (
      <Fragment key={index}>{parte}</Fragment>
    ),
  );
}

function LinhaMarkdown({ linha }: { linha: string }) {
  if (linha.startsWith("### ")) {
    return <p className="mt-3 font-serif text-[15px] font-semibold text-navy">{negrito(linha.slice(4))}</p>;
  }
  if (linha.startsWith("## ")) {
    return <p className="mt-3 font-serif text-[16px] font-semibold text-navy">{negrito(linha.slice(3))}</p>;
  }
  if (linha.startsWith("- ") || linha.startsWith("* ")) {
    return (
      <p className="flex gap-2">
        <span className="text-gold">•</span>
        <span>{negrito(linha.slice(2))}</span>
      </p>
    );
  }
  if (linha.trim() === "") return <p className="h-2" />;
  return <p>{negrito(linha)}</p>;
}

type Mensagem = { papel: "usuario" | "ia"; texto: string };

export default function TutoraPage() {
  const { user } = useUser();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [esperando, setEsperando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [limite, setLimite] = useState<{ limite: number; restante: number } | null>(null);

  useEffect(() => {
    fetch("/api/tutora")
      .then((resposta) => resposta.json().catch(() => null))
      .then((dados) => {
        if (dados?.limite !== undefined) setLimite(dados);
      })
      .catch(() => {});
  }, []);

  const enviar = async (perguntaRaw?: string) => {
    const pergunta = (perguntaRaw ?? texto).trim();
    if (!pergunta || esperando) return;
    setErro(null);
    const novas: Mensagem[] = [...mensagens, { papel: "usuario", texto: pergunta }];
    setMensagens(novas);
    setTexto("");
    setEsperando(true);
    try {
      const resposta = await fetch("/api/tutora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        throw new Error(dados?.error ?? "Não foi possível responder.");
      }
      setMensagens([...novas, { papel: "ia", texto: dados.resposta }]);
      setLimite((atual) => (atual ? { ...atual, restante: Math.max(0, atual.restante - 1) } : atual));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível responder.");
    } finally {
      setEsperando(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex h-[calc(100svh-136px)] min-h-[520px] flex-col md:h-[calc(100svh-152px)]">
      <motion.div {...fade}>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Estudo com IA</p>
        <h1 className="mt-2 font-serif text-[clamp(1.9rem,3vw,2.6rem)] leading-[1] tracking-[-.03em] text-navy">
          Tutora IA<span className="text-gold">.</span>
        </h1>
        <p className="mt-2 max-w-[520px] text-[12px] leading-5 text-graphite/55">
          Tire dúvidas sobre universidades, ensaios, prazos e testes de proficiência com a sua mentora pessoal.
        </p>
        {limite && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-mist bg-white px-3 py-1.5 text-[11px] font-medium text-graphite/60">
            <span className={`h-1.5 w-1.5 rounded-full ${limite.restante === 0 ? "bg-[#C96A52]" : "bg-gold"}`} />
            {limite.restante} de {limite.limite} mensagens restantes hoje
          </p>
        )}
      </motion.div>

      {erro && (
        <motion.div {...fade} transition={{ duration: 0.4 }} className="mt-5 flex items-start justify-between gap-4 rounded-lg border border-[#E0A18C]/60 bg-[#FBF1EC] px-4 py-3">
          <p className="text-[12px] leading-5 text-[#C96A52]">{erro}</p>
          <button type="button" onClick={() => setErro(null)} className="text-[#C96A52] hover:opacity-70" aria-label="Fechar">
            ✕
          </button>
        </motion.div>
      )}

      <div className="mt-6 flex min-h-0 flex-1 flex-col rounded-lg border border-mist bg-white">
        {mensagens.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-navy text-gold">
              <Icon d={icons.spark} className="h-6 w-6" />
            </span>
            <p className="mt-5 max-w-[420px] text-[14px] leading-6 text-graphite/70">
              Olá{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! O que você quer descobrir hoje sobre sua preparação?
            </p>
            <div className="mt-6 flex max-w-[520px] flex-wrap justify-center gap-2">
              {sugestoes.map((sugestao) => (
                <button
                  key={sugestao}
                  type="button"
                  onClick={() => enviar(sugestao)}
                  disabled={esperando}
                  className="rounded-full border border-mist bg-ivory px-4 py-2 text-[11px] text-navy transition-colors hover:border-gold hover:text-gold disabled:cursor-wait disabled:opacity-50"
                >
                  {sugestao}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 md:px-8">
            {mensagens.map((mensagem, index) =>
              mensagem.papel === "usuario" ? (
                <div key={index} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-navy px-4 py-3 text-[13px] leading-6 text-ivory">
                    {mensagem.texto}
                  </div>
                </div>
              ) : (
                <div key={index} className="flex justify-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-navy">
                    <Icon d={icons.spark} className="h-4 w-4" />
                  </span>
                  <div className="max-w-[85%] space-y-1 text-[13px] leading-6 text-graphite/80">
                    {mensagem.texto.split("\n").map((linha, i) => (
                      <LinhaMarkdown key={i} linha={linha} />
                    ))}
                  </div>
                </div>
              ),
            )}
            {esperando && (
              <div className="flex justify-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-navy">
                  <Icon d={icons.spark} className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-ivory px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-graphite/40 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-graphite/40 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-graphite/40 [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            enviar();
          }}
          className="border-t border-mist p-4 md:px-6"
        >
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  enviar();
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="Escreva sua dúvida…"
              className="max-h-32 min-h-[46px] flex-1 resize-none border border-mist bg-ivory px-4 py-3 text-[13px] text-navy placeholder:text-graphite/35 focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              disabled={esperando || texto.trim().length < 2}
              aria-label="Enviar"
              className="grid h-[46px] w-[46px] shrink-0 place-items-center border border-gold bg-gold text-navy transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon d={icons.send} className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-[10px] text-graphite/40">Dica: aperte Enter para enviar e Shift+Enter para pular linha.</p>
        </form>
      </div>
    </div>
  );
}
