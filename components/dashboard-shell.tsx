"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser, type UsuarioLogado } from "@/lib/use-user";
import { isMentorEmail } from "@/lib/mentor";
import { NotificationBell } from "@/components/notification-bell";
import { MODULES } from "@/lib/learning";

type NavItem = { href: string; label: string; d: string };

const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Visão geral", d: "M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" },
  { href: "/dashboard/aprender", label: "Minha jornada", d: "M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6.6 5.5 5.5 0 0 1 21.5 12C19 16.5 12 21 12 21z" },
  { href: "/dashboard/metas", label: "Metas & universidades", d: "M12 2.5 3 6.5v5c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10v-5l-9-4zM8.5 12l2.5 2.5 4.5-5" },
  { href: "/dashboard/aplicacao", label: "Aplicação", d: "M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 8h6M9 12h6M9 16h4" },
  { href: "/dashboard/documentos", label: "Documentos", d: "M14 2.5H7a1.5 1.5 0 0 0-1.5 1.5v16A1.5 1.5 0 0 0 7 21.5h10a1.5 1.5 0 0 0 1.5-1.5V8zM14 2.5V8h5.5M9 13h6M9 17h6" },
  { href: "/dashboard/mentoria", label: "Mentoria", d: "M2.5 20.5c.8-3 3-4.5 5-4.5s4.2 1.5 5 4.5M7.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM16 6.5a3.5 3.5 0 1 0-1.2 2.7M14.5 16.6c1.8-.4 3.8 0 5 1.9M19 4.5l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z" },
  { href: "/dashboard/financas", label: "Finanças", d: "M3.5 7.5A1.5 1.5 0 0 1 5 6h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 18H5a1.5 1.5 0 0 1-1.5-1.5zM3.5 10h17M16.5 14.5h2" },
  { href: "/dashboard/comunidade", label: "Comunidade", d: "M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" },
  { href: "/dashboard/tutora", label: "Tutora IA", d: "M4 4h13a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9l-4.5 4.5V8a4 4 0 0 1 4-4H4zM8.5 9h7M8.5 13h4" },
];

const mentorNav: NavItem[] = [
  { href: "/dashboard/mentor", label: "Painel do mentor", d: "M5 6h14v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1M9 12l2 2 4-4" },
];

const accountNav: NavItem[] = [
  { href: "/dashboard/perfil", label: "Perfil", d: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM3.5 20.5c1-4 4.5-5.5 8.5-5.5s7.5 1.5 8.5 5.5" },
  { href: "/dashboard/configuracoes", label: "Configurações", d: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM19.4 13.5l1.6 1.2-1.9 3.3-1.9-.8a8.6 8.6 0 0 1-1.7 1l-.3 2H9.8l-.3-2a8.6 8.6 0 0 1-1.7-1l-1.9.8L4 14.7l1.6-1.2a7.9 7.9 0 0 1 0-2L4 10.3 5.9 7l1.9.8a8.6 8.6 0 0 1 1.7-1l.3-2h5.4l.3 2a8.6 8.6 0 0 1 1.7 1l1.9-.8L20 10.3l-1.6 1.2a7.9 7.9 0 0 1 0 2z" },
];

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Avatar({ user, size = "h-9 w-9 text-[11px]" }: { user: UsuarioLogado | null; size?: string }) {
  const [erro, setErro] = useState(false);
  if (!user?.avatarUrl || erro) {
    return (
      <span className={`grid shrink-0 select-none place-items-center rounded-full bg-gold font-bold text-navy ${size}`}>
        {user?.initials || "F"}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={user.avatarUrl}
      alt={user.name || "Foto de perfil"}
      className={`shrink-0 rounded-full object-cover ${size}`}
      onError={() => setErro(true)}
    />
  );
}

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-md px-3.5 py-2.5 text-[12px] font-semibold transition-colors duration-200 ${
        active ? "bg-white/[.07] text-gold" : "text-ivory/60 hover:bg-white/[.04] hover:text-ivory"
      }`}
    >
      <Icon d={item.d} className="h-[17px] w-[17px]" />
      {item.label}
    </Link>
  );
}

function SidebarNav({ pathname, onNavigate, mentor }: { pathname: string; onNavigate?: () => void; mentor?: boolean }) {
  const isActive = (item: NavItem) =>
    item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
  return (
    <div className="sidebar-scroll flex flex-1 flex-col gap-6 overflow-y-auto px-4">
      <nav className="space-y-1">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item)} onNavigate={onNavigate} />
        ))}
      </nav>
      {mentor && (
        <nav>
          <p className="px-3.5 pb-2 text-[9px] font-bold uppercase tracking-[.16em] text-ivory/40">Mentor</p>
          <div className="space-y-1">
            {mentorNav.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item)} onNavigate={onNavigate} />
            ))}
          </div>
        </nav>
      )}
      <nav className="border-t border-white/10 pt-6">
        <p className="px-3.5 pb-2 text-[9px] font-bold uppercase tracking-[.16em] text-ivory/40">Conta</p>
        <div className="space-y-1">
          {accountNav.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item)} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function MentorCard() {
  return (
    <div className="m-4 rounded-lg border border-white/10 bg-white/[.04] p-4">
      <p className="text-[9px] font-bold uppercase tracking-[.14em] text-gold">Próxima mentoria</p>
      <p className="mt-2 text-[12px] font-semibold text-ivory/80">Nenhuma agendada</p>
      <p className="mt-0.5 text-[10px] leading-4 text-ivory/45">As sessões aparecem aqui quando forem marcadas.</p>
      <Link
        href="/dashboard/mentoria"
        className="mt-3 inline-flex w-full items-center justify-center border border-white/15 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-gold transition-colors hover:border-gold"
      >
        Agendar mentoria
      </Link>
    </div>
  );
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const tipoLabel: Record<string, string> = {
  ensaio: "Ensaio",
  curriculo: "Currículo",
  historico: "Histórico",
  outro: "Documento",
};

type ResultadoBusca = {
  id: string;
  titulo: string;
  meta: string;
  href: string;
  grupo: string;
  d: string;
};

const iconsBusca = {
  aula: "M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6.6 5.5 5.5 0 0 1 21.5 12C19 16.5 12 21 12 21z",
  uni: "M12 2.5 3 6.5v5c0 5 3.8 8.7 9 10 5.2-1.3 9-5 9-10v-5l-9-4zM8.5 12l2.5 2.5 4.5-5",
  doc: "M14 2.5H7a1.5 1.5 0 0 0-1.5 1.5v16A1.5 1.5 0 0 0 7 21.5h10a1.5 1.5 0 0 0 1.5-1.5V8zM14 2.5V8h5.5M9 13h6M9 17h6",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3",
} as const;

function BuscaModal({ aberto, onClose }: { aberto: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [universidades, setUniversidades] = useState<{ id: string; nome: string; curso: string | null; pais: string | null }[]>([]);
  const [documentos, setDocumentos] = useState<{ id: string; nome: string; tipo: string | null }[]>([]);

  useEffect(() => {
    if (!aberto) return;
    setQuery("");
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const [unisRes, docsRes] = await Promise.all([
        supabase.from("universidades").select("id, nome, curso, pais"),
        supabase.from("documentos").select("id, nome, tipo"),
      ]);
      if (!active) return;
      if (unisRes.data) setUniversidades(unisRes.data as { id: string; nome: string; curso: string | null; pais: string | null }[]);
      if (docsRes.data) setDocumentos(docsRes.data as { id: string; nome: string; tipo: string | null }[]);
    })();
    return () => {
      active = false;
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(timer);
  }, [aberto]);

  const q = normalize(query);

  const aulas: ResultadoBusca[] = q
    ? MODULES.flatMap((m) =>
        m.lessons
          .filter((l) => normalize(`${l.title} ${l.tagline}`).includes(q))
          .map((l) => ({
            id: l.id,
            titulo: l.title,
            meta: `Módulo ${m.number} · Aula ${l.number} · ${l.duration}`,
            href: `/dashboard/aprender?modulo=${m.slug}&aula=${l.id}`,
            grupo: "Aulas",
            d: iconsBusca.aula,
          }))
      ).slice(0, 6)
    : [];

  const unis: ResultadoBusca[] = q
    ? universidades
        .filter((u) => normalize(`${u.nome} ${u.curso ?? ""} ${u.pais ?? ""}`).includes(q))
        .map((u) => ({
          id: u.id,
          titulo: u.nome,
          meta: [u.curso, u.pais].filter(Boolean).join(" · ") || "Universidade-alvo",
          href: "/dashboard/metas",
          grupo: "Universidades",
          d: iconsBusca.uni,
        }))
        .slice(0, 4)
    : [];

  const docs: ResultadoBusca[] = q
    ? documentos
        .filter((d) => normalize(`${d.nome} ${d.tipo ?? ""}`).includes(q))
        .map((d) => ({
          id: d.id,
          titulo: d.nome,
          meta: tipoLabel[d.tipo ?? ""] ?? "Documento",
          href: "/dashboard/documentos",
          grupo: "Documentos",
          d: iconsBusca.doc,
        }))
        .slice(0, 4)
    : [];

  const total = aulas.length + unis.length + docs.length;

  return (
    <AnimatePresence>
      {aberto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-navy/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-4 top-16 z-[70] mx-auto max-w-[560px] overflow-hidden rounded-lg border border-white/15 bg-navy text-ivory shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <Icon d={iconsBusca.search} className="h-4 w-4 shrink-0 text-gold" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") onClose();
                  if (e.key === "Enter" && total > 0) {
                    const primeira = aulas[0] ?? unis[0] ?? docs[0];
                    router.push(primeira.href);
                    onClose();
                  }
                }}
                placeholder="Buscar material, tarefa…"
                className="w-full bg-transparent text-[14px] text-ivory placeholder:text-ivory/40 focus:outline-none"
              />
              <span className="hidden shrink-0 rounded border border-white/20 px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-ivory/50 sm:block">Esc</span>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {!q ? (
                <div className="grid gap-1 p-4">
                  <p className="px-3 pb-2 pt-1 text-[9px] font-bold uppercase tracking-[.16em] text-ivory/40">Sugestões</p>
                  {[
                    { label: "Ver todos os módulos", href: "/dashboard/aprender", d: iconsBusca.aula },
                    { label: "Metas & universidades", href: "/dashboard/metas", d: iconsBusca.uni },
                    { label: "Documentos", href: "/dashboard/documentos", d: iconsBusca.doc },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-semibold text-ivory/75 transition-colors hover:bg-white/[.06] hover:text-gold"
                    >
                      <Icon d={item.d} className="h-4 w-4 text-gold" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : total === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-[13px] font-semibold text-ivory/80">Nenhum resultado para “{query}”.</p>
                  <p className="mt-1 text-[11px] text-ivory/45">Tente buscar por uma aula, universidade ou documento.</p>
                </div>
              ) : (
                <div className="p-2">
                  {[
                    { grupo: "Aulas", itens: aulas },
                    { grupo: "Universidades", itens: unis },
                    { grupo: "Documentos", itens: docs },
                  ].map(
                    (secao) =>
                      secao.itens.length > 0 && (
                        <div key={secao.grupo} className="mb-1">
                          <p className="px-3 pb-1.5 pt-2 text-[9px] font-bold uppercase tracking-[.16em] text-ivory/40">{secao.grupo}</p>
                          {secao.itens.map((item) => (
                            <Link
                              key={`${secao.grupo}-${item.id}`}
                              href={item.href}
                              onClick={onClose}
                              className="flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-white/[.06]"
                            >
                              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 text-gold">
                                <Icon d={item.d} className="h-4 w-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-[13px] font-semibold text-ivory">{item.titulo}</span>
                                <span className="block truncate text-[11px] text-ivory/45">{item.meta}</span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      )
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ProfileBlock({ user, onSignOut }: { user: UsuarioLogado | null; onSignOut: () => void }) {
  return (
    <div className="safe-bottom border-t border-white/10 px-4 py-5">
      <Link href="/dashboard/perfil" className="flex items-center gap-3 rounded-md px-3 py-1.5 transition-colors hover:bg-white/[.04]">
        <Avatar user={user} />
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-ivory">{user?.name ?? "Estudante"}</p>
          <p className="truncate text-[10px] text-ivory/45">{user?.email ?? "Área do estudante"}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onSignOut}
        className="mt-3 w-full rounded-md border border-white/15 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-ivory/60 transition-colors hover:border-gold hover:text-gold"
      >
        Sair
      </button>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);

  const signOut = async () => {
    await createClient().auth.signOut();
    window.location.href = "/";
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const alvo = event.target as HTMLElement | null;
      const digitando = !!alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable);
      if (buscaAberta && event.key === "Escape") {
        setBuscaAberta(false);
        return;
      }
      if (digitando) return;
      if (event.key === "/" || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        setBuscaAberta(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [buscaAberta]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const mentor = isMentorEmail(user?.email);
  const section = [...mainNav, ...(mentor ? mentorNav : []), ...accountNav].find(
    (item) => item.href === pathname || (item.href !== "/dashboard" && pathname.startsWith(item.href))
  );

  return (
    <div className="flex min-h-[100svh] overflow-x-clip bg-mist/40 text-graphite">
      <aside className="sticky top-0 hidden h-[100svh] w-[248px] shrink-0 flex-col bg-navy text-ivory lg:flex">
        <div className="px-7 pb-6 pt-7">
          <img src="/images/fostern-logo.png" alt="Fostern" className="h-auto w-36" />
          <p className="mt-5 text-[9px] font-bold uppercase tracking-[.16em] text-ivory/40">Área do estudante</p>
        </div>
        <SidebarNav pathname={pathname} mentor={mentor} />
        <MentorCard />
        <ProfileBlock user={user} onSignOut={signOut} />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-navy/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="safe-top fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-navy text-ivory shadow-2xl lg:hidden"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="absolute right-3 top-[calc(env(safe-area-inset-top)+20px)] grid h-10 w-10 place-items-center border border-white/20 text-ivory transition-colors hover:border-gold hover:text-gold"
              >
                <span className="text-lg leading-none">✕</span>
              </button>
              <div className="px-7 pb-6 pt-7">
                <img src="/images/fostern-logo.png" alt="Fostern" className="h-auto w-36" />
                <p className="mt-5 text-[9px] font-bold uppercase tracking-[.16em] text-ivory/40">Área do estudante</p>
              </div>
              <SidebarNav pathname={pathname} onNavigate={() => setMobileOpen(false)} mentor={mentor} />
              <ProfileBlock user={user} onSignOut={signOut} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="safe-top sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-navy px-4 py-3.5 text-ivory md:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
            className="grid h-11 w-11 shrink-0 place-items-center border border-white/25 transition-colors hover:border-gold hover:text-gold lg:hidden"
          >
            <span className="grid gap-1.5">
              <span className="h-px w-5 bg-current" />
              <span className="h-px w-5 bg-current" />
              <span className="h-px w-5 bg-current" />
            </span>
          </button>
          <div className="lg:hidden">
            <img src="/images/fostern-logo.png" alt="Fostern" className="h-auto w-28" />
          </div>
          <div className="hidden items-center gap-2 text-[12px] text-ivory/50 lg:flex">
            <span className="font-semibold text-gold">{section?.label ?? "Dashboard"}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setBuscaAberta(true)}
              className="hidden items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[12px] text-ivory/60 transition-colors hover:border-gold hover:text-gold md:flex"
            >
              <Icon d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3" className="h-3.5 w-3.5" />
              Buscar material, tarefa…
              <span className="rounded border border-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[.1em] text-ivory/45">/</span>
            </button>
            <button
              type="button"
              onClick={() => setBuscaAberta(true)}
              aria-label="Buscar"
              className="grid h-10 w-10 place-items-center border border-white/20 text-ivory/60 transition-colors hover:border-gold hover:text-gold md:hidden"
            >
              <Icon d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3" className="h-4 w-4" />
            </button>
            <NotificationBell />
            <Link href="/dashboard/perfil" aria-label="Perfil">
              <Avatar user={user} size="h-10 w-10 text-[12px]" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-8 md:px-10 md:py-10">{children}</main>
      </div>

      <BuscaModal aberto={buscaAberta} onClose={() => setBuscaAberta(false)} />
    </div>
  );
}
