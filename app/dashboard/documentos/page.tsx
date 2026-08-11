"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

type Documento = {
  id: string;
  nome: string;
  tipo: string | null;
  storage_path: string | null;
  tamanho_bytes: number | null;
  criado_em: string;
};

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const icons = {
  file: "M14 2.5H7a1.5 1.5 0 0 0-1.5 1.5v16A1.5 1.5 0 0 0 7 21.5h10a1.5 1.5 0 0 0 1.5-1.5V8zM14 2.5V8h5.5",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
  download: "M12 4v12M7 11l5 5 5-5M4 20h16",
  trash: "M4 7h16M9 7V4h6v3M6.5 7l1 14h9l1-14M10 11v6M14 11v6",
  back: "M15 6l-6 6 6 6",
} as const;

function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentosPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [baixando, setBaixando] = useState<string | null>(null);

  const carregar = async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from("documentos").select("*").order("criado_em", { ascending: false });
    if (data) setDocumentos(data as Documento[]);
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const enviar = async (file: File) => {
    setErro(null);
    setOk(null);
    if (file.size > 20 * 1024 * 1024) return setErro("O arquivo deve ter até 20 MB.");
    setEnviando(true);
    const supabase = createClient();
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
        tipo: "outro",
        storage_path: path,
        tamanho_bytes: file.size,
      });
      if (dbErr) throw dbErr;
      setOk("Documento enviado.");
      await carregar();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível enviar.";
      setErro(message);
    } finally {
      setEnviando(false);
    }
  };

  const baixar = async (doc: Documento) => {
    if (!doc.storage_path) return;
    setErro(null);
    setBaixando(doc.id);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage.from("documentos").createSignedUrl(doc.storage_path, 3600);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível baixar.";
      setErro(message);
    } finally {
      setBaixando(null);
    }
  };

  const excluir = async (doc: Documento) => {
    if (!window.confirm(`Excluir "${doc.nome}"?`)) return;
    setErro(null);
    const supabase = createClient();
    try {
      if (doc.storage_path) {
        const { error: stErr } = await supabase.storage.from("documentos").remove([doc.storage_path]);
        if (stErr) throw stErr;
      }
      const { error: dbErr } = await supabase.from("documentos").delete().eq("id", doc.id);
      if (dbErr) throw dbErr;
      setDocumentos((prev) => prev.filter((item) => item.id !== doc.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível excluir.";
      setErro(message);
    }
  };

  return (
    <div>
      <motion.div {...fade}>
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Seus arquivos</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-serif text-[clamp(1.9rem,3vw,2.6rem)] leading-[1] tracking-[-.03em] text-navy">
            Documentos<span className="text-gold">.</span>
          </h1>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={enviando}
            className="inline-flex min-h-11 items-center justify-center gap-3 border border-gold bg-gold px-5 text-[11px] font-bold text-navy transition-colors hover:bg-gold/90 disabled:cursor-wait disabled:opacity-60"
          >
            <Icon d={icons.upload} className="h-4 w-4" />
            {enviando ? "Enviando…" : "Enviar documento"}
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,image/png,image/jpeg"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) enviar(file);
              event.target.value = "";
            }}
          />
        </div>
        <p className="mt-2 max-w-[520px] text-[12px] leading-5 text-graphite/55">
          Ensaio, currículo, histórico ou qualquer outro arquivo da sua preparação. PDF, DOC/DOCX, TXT, PNG e JPG · até 20 MB.
        </p>
      </motion.div>

      {(erro || ok) && (
        <motion.p {...fade} transition={{ duration: 0.4 }} className={`mt-5 text-[12px] leading-5 ${erro ? "text-[#C96A52]" : "text-gold"}`}>
          {erro ?? ok}
        </motion.p>
      )}

      <motion.section {...fade} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="mt-8 rounded-lg border border-mist bg-white">
        {carregando ? (
          <p className="p-6 text-[12px] text-graphite/55">Carregando…</p>
        ) : documentos.length === 0 ? (
          <div className="p-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-navy text-gold">
              <Icon d={icons.file} className="h-5 w-5" />
            </span>
            <p className="mt-4 text-[13px] font-semibold text-navy">Nenhum documento ainda.</p>
            <p className="mt-1 text-[12px] leading-5 text-graphite/55">Envie seu primeiro arquivo para começar.</p>
          </div>
        ) : (
          <ul className="divide-y divide-mist/80">
            <AnimatePresence initial={false}>
              {documentos.map((doc) => (
                <motion.li
                  key={doc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-4 px-5 py-4 md:px-7"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-mist bg-ivory text-graphite/50">
                    <Icon d={icons.file} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-navy">{doc.nome}</p>
                    <p className="mt-0.5 text-[10px] text-graphite/50">
                      {new Date(doc.criado_em).toLocaleDateString("pt-BR")}
                      {doc.tamanho_bytes ? ` · ${fmtBytes(doc.tamanho_bytes)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => baixar(doc)}
                      disabled={baixando === doc.id}
                      aria-label="Baixar"
                      className="grid h-9 w-9 place-items-center rounded-md border border-mist text-graphite/60 transition-colors hover:border-gold hover:text-gold disabled:cursor-wait disabled:opacity-50"
                    >
                      <Icon d={icons.download} className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => excluir(doc)}
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
  );
}
