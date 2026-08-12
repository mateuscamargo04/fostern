"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

type Campus = {
  name: string;
  place: string;
  image: string;
  position: string;
  source: string;
};

const campusImages = {
  mit: "/images/campuses/mit-sunset.jpg",
  stanford: "https://commons.wikimedia.org/wiki/Special:FilePath/Stanford_Memorial_Church_in_2016.jpg?width=2400",
  harvard: "https://commons.wikimedia.org/wiki/Special:FilePath/Widener_Library.jpg?width=2400",
  oxford: "https://commons.wikimedia.org/wiki/Special:FilePath/The_Radcliffe_Camera%2C_Oxford.jpg?width=2400",
  cambridge: "https://commons.wikimedia.org/wiki/Special:FilePath/Kings_College%2C_Cambridge%2C_Chapel%20%28front%29.jpg?width=2400",
  eth: "https://commons.wikimedia.org/wiki/Special:FilePath/Hauptgeb%C3%A4ude_der_ETH_Z%C3%BCrich_2022-09-24_02.jpg?width=2400",
  caltech: "https://commons.wikimedia.org/wiki/Special:FilePath/Building_at_Caltech_2.jpg?width=2400",
  princeton: "https://commons.wikimedia.org/wiki/Special:FilePath/Nassau_Hall%2C_Princeton_University%2C_Princeton_NJ.jpg?width=2400"
};

const campuses: Campus[] = [
  { name: "MIT", place: "Cambridge, Massachusetts", image: campusImages.mit, position: "center top", source: "Great Dome, MIT" },
  { name: "Stanford", place: "Palo Alto, Califórnia", image: campusImages.stanford, position: "center", source: "Memorial Church, Stanford" },
  { name: "Harvard", place: "Cambridge, Massachusetts", image: campusImages.harvard, position: "center", source: "Widener Library, Harvard" },
  { name: "Oxford", place: "Oxford, Inglaterra", image: campusImages.oxford, position: "center", source: "Radcliffe Camera, Oxford" },
  { name: "Cambridge", place: "Cambridge, Inglaterra", image: campusImages.cambridge, position: "center", source: "King's College Chapel" },
  { name: "Caltech", place: "Pasadena, Califórnia", image: campusImages.caltech, position: "center", source: "Caltech campus" },
  { name: "Princeton", place: "Princeton, New Jersey", image: campusImages.princeton, position: "center", source: "Nassau Hall, Princeton" }
];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0 }
};

function Monogram() {
  return (
    <svg aria-hidden="true" viewBox="0 0 31 35" className="h-8 w-7 fill-none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 3.5V30.5M5 4.5H27M5 16.5H20" stroke="#D4AF37" strokeWidth="3.35" strokeLinecap="square" />
    </svg>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="#inicio" aria-label="Fostern, início" className="flex items-center gap-2.5">
      <img src="/images/fostern-logo.png" alt="Fostern" className="w-44 h-auto md:w-60" />
    </Link>
  );
}

const plans = [
  {
    name: "Gratuito",
    price: "R$0",
    period: "",
    description: "Pra começar: as primeiras aulas do módulo 1.",
    features: ["Aulas 1 e 2 do módulo 1", "Exercícios com correção", "Entenda o que as admissões procuram"],
    cta: "Começar grátis",
    ctaHref: "/auth?mode=register",
    highlight: false
  },
  {
    name: "Mensal",
    price: "R$29,90",
    period: "/mês",
    description: "Acesso completo, mês a mês.",
    features: ["Acesso a todos os módulos", "Tutor de IA", "Acesso à comunidade", "Estratégia para SAT e TOEFL", "Mentoria individual"],
    cta: "Assinar mensal",
    ctaHref: "/planos",
    highlight: true
  },
  {
    name: "Anual",
    price: "R$199,90",
    period: "/ano",
    description: "O mesmo acesso completo, com renovação automática.",
    features: ["Tudo do plano Mensal", "Economia frente ao valor mensal", "Prioridade na mentoria", "Revisão de redações e projetos"],
    cta: "Assinar anual",
    ctaHref: "/planos",
    highlight: false
  }
];

function PillarIcon({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="#D4AF37" strokeWidth="1.4" strokeLinecap="square" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const pillars = [
  { term: "Profundidade acadêmica", icon: <PillarIcon><path d="M12 6.2c-1.7-1.1-4-1.6-6.4-1.6v13.2c2.4 0 4.7.5 6.4 1.6M12 6.2c1.7-1.1 4-1.6 6.4-1.6v13.2c-2.4 0-4.7.5-6.4 1.6M12 6.2v13.2" /></PillarIcon> },
  { term: "Trabalho autoral", icon: <PillarIcon><path d="M5 19.2 6 15l9.6-9.6a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L9 18l-4.2 1.2Z" /></PillarIcon> },
  { term: "Escolhas coerentes", icon: <PillarIcon><circle cx="12" cy="12" r="7.2" /><circle cx="12" cy="12" r="1.4" fill="#D4AF37" stroke="none" /></PillarIcon> },
  { term: "Escrita com verdade", icon: <PillarIcon><path d="M5 12.5 9.5 17 19 6.2" /></PillarIcon> }
];

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.16 });
  const reduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduced ? false : "hidden"}
      animate={isInView ? "visible" : "hidden"}
      variants={fadeUp}
      transition={{ duration: reduced ? 0 : 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Arrow() {
  return <span aria-hidden="true" className="text-base leading-none transition-transform duration-300 group-hover:translate-x-1">→</span>;
}

function PrimaryLink({ href, children, light = false }: { href: string; children: ReactNode; light?: boolean }) {
  return (
    <Link href={href} className={`group inline-flex min-h-12 items-center justify-center gap-6 border px-5 text-[11px] font-bold tracking-[.01em] transition-[padding,transform,background-color] duration-500 ease-out hover:-translate-y-0.5 hover:px-7 ${light ? "border-ivory bg-ivory text-navy hover:bg-ivory/90" : "border-gold bg-gold text-navy hover:border-gold hover:bg-gold/90"}`}>
      <span>{children}</span><Arrow />
    </Link>
  );
}

function TextLink({ href, children, light = false }: { href: string; children: ReactNode; light?: boolean }) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-3 border-b pb-1 text-[11px] font-bold transition-opacity hover:opacity-60 ${light ? "border-ivory text-ivory" : "border-navy text-navy"}`}>
      {children}<Arrow />
    </Link>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 34);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return (
    <header className={`safe-top fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${scrolled ? "border-b border-white/10 bg-navy/95" : "bg-transparent"}`}>
      <div className="mx-auto flex h-[82px] w-[min(100%-40px,1280px)] items-center justify-between text-ivory md:h-[92px] md:w-[min(100%-80px,1320px)]">
        <Brand />
        <nav aria-label="Navegação principal" className="hidden items-center gap-8 lg:flex">
          <Link className="nav-link text-[10px] font-semibold" href="#metodo">Método</Link>
          <Link className="nav-link text-[10px] font-semibold" href="#mentoria">Mentoria</Link>
          <Link className="nav-link text-[10px] font-semibold" href="#universidades">Universidades</Link>
          <Link className="nav-link text-[10px] font-semibold" href="#familias">Para famílias</Link>
          <Link className="nav-link text-[10px] font-semibold" href="#planos">Planos</Link>
          <Link className="nav-link text-[10px] font-semibold" href="/auth">Entrar</Link>
          <PrimaryLink href="/auth?mode=register">Criar conta</PrimaryLink>
        </nav>
        <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} className="grid h-11 w-11 place-items-center border border-white/25 lg:hidden">
          <span className="grid gap-1.5">
            <span className={`h-px w-5 bg-ivory transition-transform duration-300 ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`h-px w-5 bg-ivory transition-transform duration-300 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </span>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.24 }} aria-label="Navegação móvel" className="border-t border-white/10 bg-navy px-5 pb-8 pt-3 text-ivory lg:hidden">
            <div className="mx-auto flex max-w-md flex-col">
              {[['Método', '#metodo'], ['Mentoria', '#mentoria'], ['Universidades', '#universidades'], ['Para famílias', '#familias'], ['Planos', '#planos']].map(([label, href]) => <Link key={href} onClick={close} href={href} className="border-b border-white/10 py-4 text-sm font-medium">{label}</Link>)}
              <Link onClick={close} href="/auth" className="mt-6 border border-white/25 px-5 py-4 text-center text-xs font-bold text-ivory">Entrar</Link>
              <Link onClick={close} href="/auth?mode=register" className="mt-3 bg-gold px-5 py-4 text-center text-xs font-bold text-navy">Criar conta</Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function Hero() {
  return (
    <section id="inicio" className="grain relative h-[100svh] min-h-[600px] overflow-hidden bg-navy text-ivory">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.3, ease: [0.22, 1, .36, 1] }} className="absolute -inset-x-[100%] -inset-y-[150%] scale-[.333]">
        <Image src="/images/campuses/mit-dome-2u.jpg" alt="Great Dome do MIT visto pelo Killian Court, ao entardecer" fill priority sizes="100vw" className="object-cover object-[92%_50%] brightness-[1.15] contrast-[1.4] saturate-[1.7] hue-rotate-[-6deg]" />
      </motion.div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(1,7,16,0.96)_0%,rgba(3,17,36,0.9)_28%,rgba(6,26,50,0.6)_52%,rgba(9,34,64,0.26)_72%,rgba(9,34,64,0)_92%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(3,10,20,0.85)_0%,rgba(3,12,24,0.45)_28%,rgba(3,12,24,0.12)_50%,rgba(3,12,24,0.2)_68%,rgba(1,6,14,0.75)_100%)]" />
      <div className="relative z-10 mx-auto flex h-full w-[min(100%-40px,1280px)] flex-col justify-center md:w-[min(100%-80px,1320px)]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9, delay: .25, ease: [0.22, 1, .36, 1] }}>
          <p className="mb-6 text-[10px] font-bold uppercase tracking-[.16em] text-gold">Preparação internacional, feita com profundidade.</p>
          <h1 className="max-w-[560px] font-serif text-[clamp(2.6rem,5.4vw,5.4rem)] leading-[.93] tracking-[-.05em]">Ambição merece<br />um plano <em className="not-italic text-gold">à altura.</em></h1>
          <p className="mt-6 max-w-[380px] text-[13px] leading-6 text-ivory/80">Para estudantes brasileiros prontos para construir uma trajetória internacional com profundidade.</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-5">
            <PrimaryLink href="#conversa">Conheça a Fostern</PrimaryLink>
            <TextLink href="#metodo" light>Entenda o método</TextLink>
          </div>
        </motion.div>
        <p className="absolute bottom-8 text-[9px] font-bold uppercase tracking-[.13em] text-ivory/60 md:bottom-11">Brasil · pensamento com alcance global</p>
      </div>
    </section>
  );
}

function Method() {
  const steps = [
    ["01", "Entender", "O ponto de partida", "Um retrato honesto de quem você é hoje: sua trajetória, seus interesses, seus hábitos e o que pode se tornar trabalho de verdade."],
    ["02", "Desenvolver", "O trabalho ganha profundidade", "Direção acadêmica, projetos, escrita, estratégia de testes e escolhas extracurriculares construídas com consistência."],
    ["03", "Articular", "A candidatura revela coerência", "Universidades, ensaios, recomendações e portfólio organizados como um retrato verdadeiro do que você construiu."]
  ];
  return (
    <section id="metodo" className="bg-ivory py-24 md:py-36">
      <div className="mx-auto w-[min(100%-40px,1280px)] md:w-[min(100%-80px,1320px)]">
        <Reveal className="grid gap-6 md:grid-cols-[25%_1fr] md:pb-16"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-deep-navy">O método Fostern</p><h2 className="max-w-3xl font-serif text-[clamp(2.75rem,5vw,5rem)] leading-[.94] tracking-[-.045em] text-navy">O futuro não se improvisa.<br /><em className="not-italic text-deep-navy">Ele se constrói.</em></h2></Reveal>
        <div className="border-t border-graphite/20">
          {steps.map(([number, title, subhead, body], index) => (
            <Reveal key={title} delay={index * .08} className="grid min-h-[175px] gap-y-5 border-b border-graphite/20 py-8 md:grid-cols-[10%_34%_1fr] md:items-center md:py-6">
              <span className="text-[11px] font-bold text-gold">{number}</span>
              <div><h3 className="font-serif text-[34px] leading-none tracking-[-.035em] text-navy">{title}</h3><p className="mt-2 text-[9px] font-bold uppercase tracking-[.12em] text-graphite/65">{subhead}</p></div>
              <p className="max-w-[510px] text-[13px] leading-6 text-graphite/80">{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  return (
    <section className="overflow-hidden bg-mist py-24 md:py-36">
      <div className="mx-auto grid w-[min(100%-40px,1280px)] items-center gap-14 md:w-[min(100%-80px,1320px)] md:grid-cols-[.75fr_1.25fr] md:gap-[clamp(55px,9vw,155px)]">
        <Reveal>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-deep-navy">A estrutura do trabalho</p>
          <h2 className="mt-3 font-serif text-[clamp(2.8rem,4.6vw,4.8rem)] leading-[.93] tracking-[-.045em] text-navy">Uma mesa clara<br />para o que <em className="not-italic text-deep-navy">importa.</em></h2>
          <p className="mt-7 max-w-[360px] text-[13px] leading-6 text-graphite/80">Fostern transforma uma ambição distante em um conjunto de decisões que você consegue enxergar, discutir e executar.</p>
          <ul className="mt-8 border-t border-graphite/20"><li className="border-b border-graphite/20 py-4 text-[12px] font-semibold text-navy">Uma prioridade clara para cada semana</li><li className="border-b border-graphite/20 py-4 text-[12px] font-semibold text-navy">Feedback no contexto do trabalho</li><li className="border-b border-graphite/20 py-4 text-[12px] font-semibold text-navy">Marcos que tornam o longo prazo visível</li></ul>
        </Reveal>
        <Reveal delay={.1} className="overflow-hidden border border-navy/10 bg-ivory shadow-[0_24px_55px_rgba(8,29,54,.12)]">
          <div className="grid min-h-[460px] grid-cols-[54px_1fr] md:min-h-[500px]">
            <div className="flex flex-col items-center gap-6 bg-navy pt-6"><span className="font-serif text-2xl text-gold"><img src="/images/f-logo.png" alt="" /></span><span className="h-2 w-2 rounded-full bg-gold" /><span className="h-2 w-2 rounded-full border border-ivory/40" /><span className="h-2 w-2 rounded-full border border-ivory/40" /><span className="h-2 w-2 rounded-full border border-ivory/40" /></div>
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between"><div><p className="text-[8px] font-bold tracking-[.14em] text-graphite/55">SEU ROADMAP</p><h3 className="mt-1.5 text-sm font-bold tracking-[-.03em] text-navy">Trabalho em construção.</h3></div><span className="grid h-8 w-8 place-items-center rounded-full bg-deep-navy text-[9px] font-bold text-ivory">MR</span></div>
              <div className="relative mt-7 border-l-[3px] border-gold bg-mist px-4 py-3"><p className="text-[8px] font-bold tracking-[.13em] text-graphite/60">FOCO DA SEMANA</p><strong className="mt-1 block text-[11px] leading-4 text-navy">Concluir a primeira versão do ensaio de pesquisa.</strong><span className="absolute right-4 top-1/2 -translate-y-1/2 text-gold">→</span></div>
              <div className="mt-8"><div className="flex justify-between text-[9px] font-bold text-graphite/60"><span>Trajetória</span><span>2025 — 2027</span></div><div className="relative mt-7 grid grid-cols-4"><div className="absolute left-[5%] right-[5%] top-[5px] h-px bg-graphite/20" />{['Fundamentos', 'Desenvolvimento', 'Destaque', 'Aplicação'].map((item, index) => <div key={item} className="relative z-10"><span className={`mb-3 block h-[11px] w-[11px] rounded-full border-2 border-ivory ${index === 0 ? 'bg-deep-navy outline outline-1 outline-deep-navy' : index === 1 ? 'bg-gold outline outline-1 outline-gold' : 'bg-ivory outline outline-1 outline-graphite/20'}`} /><p className="text-[8px] font-bold leading-3 text-navy">{item}</p><small className={`mt-1 block text-[7px] ${index === 1 ? 'text-gold' : 'text-graphite/55'}`}>{index === 0 ? 'Concluído' : index === 1 ? 'Em curso' : index === 2 ? 'Próximo' : '2027'}</small></div>)}</div></div>
              <div className="mt-8 flex items-center gap-3 border-t border-graphite/15 pt-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-deep-navy text-[9px] font-bold text-ivory">A</span><p className="flex-1 text-[9px] leading-[1.45] text-graphite/70"><b className="text-navy">Ana, sua mentora</b><br />“A pergunta central está forte. Agora, vamos deixá-la mais precisa.”</p><span className="text-gold">↗</span></div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function UniversityWordmarks() {
  const marks = [
    { name: "MIT", src: "https://commons.wikimedia.org/wiki/Special:FilePath/MIT_logo_2003-2023.svg?width=300" },
    { name: "Stanford", src: "https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_Leland_Stanford_Junior_University.svg?width=200" },
    { name: "Harvard", src: "https://commons.wikimedia.org/wiki/Special:FilePath/Harvard_University_coat_of_arms.svg?width=200" },
    { name: "Oxford", src: "https://commons.wikimedia.org/wiki/Special:FilePath/Coat_of_arms_of_the_University_of_Oxford.svg?width=200" },
    { name: "Cambridge", src: "https://commons.wikimedia.org/wiki/Special:FilePath/Coat_of_Arms_of_the_University_of_Cambridge.svg?width=200" },
    { name: "ETH Zürich", src: "https://commons.wikimedia.org/wiki/Special:FilePath/ETH_Z%C3%BCrich_Logo_black.svg?width=300" },
    { name: "Princeton", src: "https://commons.wikimedia.org/wiki/Special:FilePath/Princeton_University_Shield.svg?width=200" },
    { name: "Caltech", src: "https://commons.wikimedia.org/wiki/Special:FilePath/Caltech_Logo.svg?width=300" }
  ];

  return (
    <section aria-label="Universidades de referência" className="border-b border-graphite/15 bg-ivory">
      <div className="mx-auto flex min-h-[148px] w-[min(100%-40px,1280px)] flex-col justify-center py-8 md:w-[min(100%-80px,1320px)] md:py-0">
        <p className="mb-6 text-[9px] font-bold uppercase tracking-[.14em] text-graphite/55 md:mb-7">Universidades de referência</p>
        <div className="flex flex-wrap items-center justify-between gap-x-9 gap-y-6">
          {marks.map(({ name, src }) => (
            <div key={name} className="flex flex-col items-center gap-2.5">
              <img
                src={src}
                alt={name}
                className="h-7 w-auto object-contain opacity-70 grayscale transition duration-500 hover:opacity-100 hover:grayscale-0 md:h-8"
              />
              <span className="text-[8px] font-bold uppercase tracking-[.12em] text-graphite/55">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UniversityAtlas() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCampus = campuses[activeIndex];

  return (
    <section id="universidades" className="bg-mist py-24 md:py-36">
      <div className="mx-auto w-[min(100%-40px,1280px)] md:w-[min(100%-80px,1320px)]">
        <Reveal className="grid gap-6 pb-14 md:grid-cols-[25%_1fr]"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-deep-navy">Horizontes</p><h2 className="max-w-3xl font-serif text-[clamp(2.8rem,5vw,5rem)] leading-[.94] tracking-[-.045em] text-navy">O mundo é vasto.<br /><em className="not-italic text-deep-navy">Seu percurso também pode ser.</em></h2></Reveal>
        <Reveal delay={.08} className="grid border-t border-navy/20 pt-7 lg:grid-cols-[.77fr_1.23fr] lg:gap-16 lg:pt-10">
          <div className="order-2 mt-9 lg:order-1 lg:mt-0">
            <p className="mb-5 text-[9px] font-bold uppercase tracking-[.13em] text-graphite/55">Explore por instituição</p>
            <div aria-label="Universidades de referência" className="border-y border-navy/15">
              {campuses.map((campus, index) => <button key={campus.name} type="button" aria-pressed={activeIndex === index} onClick={() => setActiveIndex(index)} onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} className={`group flex w-full items-center justify-between border-b border-navy/15 py-3.5 text-left transition last:border-0 ${activeIndex === index ? 'text-navy' : 'text-graphite/55 hover:text-navy'}`}><span className="flex items-center gap-4"><span className="w-5 text-[9px] font-bold text-gold">{String(index + 1).padStart(2, '0')}</span><span className="font-serif text-[24px] leading-none tracking-[-.03em]">{campus.name}</span></span><span className={`h-px transition-all duration-500 ${activeIndex === index ? 'w-10 bg-gold' : 'w-4 bg-graphite/30 group-hover:w-7'}`} /></button>)}
            </div>
          </div>
          <div aria-live="polite" aria-label={`${activeCampus.name}, ${activeCampus.place}`} className="order-1 lg:order-2">
            <div className="relative aspect-[1.13] overflow-hidden bg-navy sm:aspect-[1.38]">
              <AnimatePresence mode="wait">
                <motion.div key={activeCampus.name} initial={{ opacity: 0, scale: 1.045 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: .7, ease: [0.22, 1, .36, 1] }} className="absolute inset-0">
                  <Image src={activeCampus.image} alt={`${activeCampus.source}, ${activeCampus.place}`} fill sizes="(min-width: 1024px) 56vw, 100vw" className="object-cover saturate-[.72] brightness-[.84]" style={{ objectPosition: activeCampus.position }} />
                  <div className="absolute inset-0 bg-navy/32" />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-ivory sm:p-8"><div><p className="mb-3 h-px w-10 bg-gold" /><h3 className="font-serif text-[42px] leading-none tracking-[-.045em] sm:text-[54px]">{activeCampus.name}</h3><p className="mt-2 text-[9px] font-bold uppercase tracking-[.11em] text-ivory/72">{activeCampus.place}</p></div><span className="hidden text-[10px] font-bold text-ivory/75 sm:block">{String(activeIndex + 1).padStart(2, '0')} / 08</span></div>
            </div>
          </div>
        </Reveal>
        <p className="mt-5 max-w-lg text-[10px] leading-5 text-graphite/60">Fostern não é afiliada às universidades apresentadas. Imagens de campus utilizadas para contexto editorial.</p>
      </div>
    </section>
  );
}

const WHATSAPP_NUMERO = "55169993099045";

function ConversationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const dados = new FormData(form);
    const nome = String(dados.get("name") ?? "").trim();
    const email = String(dados.get("email") ?? "").trim();
    const stage = String(dados.get("stage") ?? "").trim();
    const mensagem = [
      "Olá! Vim pelo site da Fostern e quero começar uma conversa.",
      "",
      `Nome: ${nome}`,
      `E-mail: ${email}`,
      `Momento: ${stage}`,
    ].join("\n");
    setEnviando(true);
    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`, "_blank");
    setSubmitted(true);
    setEnviando(false);
    form.reset();
  };
  return (
    <form onSubmit={onSubmit} className="mt-12 grid gap-4 text-left sm:grid-cols-2">
      <label className="block"><span className="mb-2 block text-[9px] font-bold tracking-[.12em] text-ivory/70">SEU NOME</span><input required name="name" autoComplete="name" className="h-12 w-full border border-ivory/25 bg-transparent px-4 text-sm text-ivory outline-none transition focus:border-gold" /></label>
      <label className="block"><span className="mb-2 block text-[9px] font-bold tracking-[.12em] text-ivory/70">E-MAIL</span><input required name="email" type="email" autoComplete="email" className="h-12 w-full border border-ivory/25 bg-transparent px-4 text-sm text-ivory outline-none transition focus:border-gold" /></label>
      <label className="block sm:col-span-2"><span className="mb-2 block text-[9px] font-bold tracking-[.12em] text-ivory/70">EM QUE MOMENTO VOCÊ ESTÁ?</span><select required name="stage" defaultValue="" className="field-select h-12 w-full border border-ivory/25 bg-transparent px-4 text-sm text-ivory outline-none transition focus:border-gold"><option value="" disabled className="text-graphite">Selecione uma opção</option><option className="text-graphite">Ensino Fundamental II</option><option className="text-graphite">Ensino Médio</option><option className="text-graphite">Em processo de aplicação</option><option className="text-graphite">Sou mãe, pai ou responsável</option></select></label>
      <div className="sm:col-span-2"><button type="submit" disabled={enviando} className="group inline-flex min-h-12 items-center gap-7 border border-gold bg-gold px-5 text-[11px] font-bold text-navy transition hover:-translate-y-0.5 hover:bg-gold/90 disabled:cursor-wait disabled:opacity-60">Iniciar uma conversa <Arrow /></button>{submitted && <p role="status" className="mt-4 text-xs text-ivory/80">Abrimos seu WhatsApp com a mensagem pronta — é só enviar. Ou escreva direto para <a href="mailto:mateusdevlp@gmail.com" className="font-semibold text-gold underline decoration-gold/40 underline-offset-2">mateusdevlp@gmail.com</a>.</p>}<p className="mt-3 text-[10px] leading-5 text-ivory/55">Resposta direta pelo WhatsApp <span className="text-ivory/80">+55 16 99309-9045</span>.</p></div>
    </form>
  );
}

export function FosternLanding() {
  return (
    <div className="overflow-x-hidden bg-ivory">
      <a href="#conteudo" className="fixed left-4 top-[-80px] z-[100] bg-gold px-4 py-2 text-xs font-bold text-navy focus:top-4">Pular para o conteúdo</a>
      <Header />
      <main id="conteudo">
        <Hero />
        <UniversityWordmarks />

        <section className="bg-ivory py-24 md:py-28"><Reveal className="mx-auto grid w-[min(100%-40px,1040px)] gap-7 md:w-[min(100%-80px,1040px)] md:grid-cols-[14%_1fr] md:gap-14"><p className="font-serif text-xl text-gold">01</p><div><p className="max-w-[820px] font-serif text-[clamp(2.3rem,4vw,4rem)] leading-[1.08] tracking-[-.04em] text-navy">Entrar em uma universidade excepcional não começa com uma aplicação excepcional. <em className="not-italic text-deep-navy">Começa com anos de trabalho que passam a fazer sentido juntos.</em></p><p className="mt-8 max-w-md text-[13px] leading-6 text-graphite/75">Fostern organiza esse trabalho sem reduzir o estudante a uma lista de tarefas.</p></div></Reveal></section>

        <Method />
        <Roadmap />

        <section className="bg-navy py-28 text-ivory md:py-36"><Reveal className="mx-auto w-[min(100%-40px,1280px)] md:w-[min(100%-80px,1320px)]"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold">O que importa</p><h2 className="mt-5 max-w-5xl font-serif text-[clamp(3rem,5.3vw,5.7rem)] leading-[.91] tracking-[-.05em]">Universidades seletivas procuram <em className="not-italic text-gold">evidência,</em> não aparência.</h2><div className="ml-auto mt-12 grid max-w-[780px] gap-7 md:grid-cols-2 md:gap-16"><p className="text-[13px] leading-7 text-ivory/80">Uma candidatura forte não é construída com atividades aleatórias, certificados acumulados ou uma narrativa inventada no último ano.</p><p className="text-[13px] leading-7 text-ivory/80">Ela revela curiosidade, consistência, iniciativa e capacidade de contribuir.</p></div><div className="mt-20 grid border-y border-ivory/20 sm:grid-cols-2 md:grid-cols-4">{pillars.map(({ term, icon }, index) => <div key={term} className={`flex items-center gap-3 py-5 ${index > 0 ? 'sm:border-l sm:border-ivory/20 sm:pl-5' : ''}`}>{icon}<p className="font-serif text-[20px] text-ivory/85">{term}</p></div>)}</div></Reveal></section>

        <section id="mentoria" className="bg-ivory py-24 md:py-36"><div className="mx-auto grid w-[min(100%-40px,1280px)] items-center gap-14 md:w-[min(100%-80px,1320px)] md:grid-cols-[1.1fr_.9fr] md:gap-[clamp(60px,10vw,170px)]"><Reveal className="relative aspect-[.9] overflow-hidden bg-navy md:aspect-[.98]"><Image src={campusImages.oxford} alt="Radcliffe Camera, Oxford" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover saturate-[.64] brightness-[.79]" /><div className="absolute inset-0 bg-navy/26" /><p className="absolute bottom-6 right-6 max-w-[160px] text-right text-[10px] leading-4 text-ivory">Boa orientação deixa rastros no trabalho.</p></Reveal><Reveal delay={.12}><p className="text-[10px] font-bold uppercase tracking-[.14em] text-deep-navy">Mentoria</p><h2 className="mt-3 font-serif text-[clamp(2.8rem,4.6vw,4.8rem)] leading-[.93] tracking-[-.045em] text-navy">Orientação que respeita a inteligência do <em className="not-italic text-deep-navy">estudante.</em></h2><p className="mt-7 text-[13px] leading-7 text-graphite/80">Estratégia é importante. Mas o que muda a qualidade de um trabalho são boas perguntas, critérios altos, retorno direto e continuidade.</p><p className="mt-4 text-[13px] leading-7 text-graphite/80">Cada conversa deixa algo concreto: uma decisão mais clara, uma hipótese melhor, um plano revisado ou uma pergunta que vale perseguir.</p><div className="mt-8"><TextLink href="#conversa">Como funciona a mentoria</TextLink></div></Reveal></div></section>

        <UniversityAtlas />

        <section className="bg-ivory py-24 md:py-36"><div className="mx-auto grid w-[min(100%-40px,1280px)] gap-14 md:w-[min(100%-80px,1320px)] md:grid-cols-[.8fr_1.2fr] md:items-end"><Reveal><p className="text-[10px] font-bold uppercase tracking-[.14em] text-deep-navy">Do potencial à evidência</p><h2 className="mt-3 font-serif text-[clamp(2.8rem,4.7vw,4.8rem)] leading-[.93] tracking-[-.045em] text-navy">O objetivo não é parecer pronto.<br /><em className="not-italic text-deep-navy">É se tornar mais preparado.</em></h2></Reveal><Reveal delay={.1} className="border-t border-graphite/20"><div className="grid gap-7 border-b border-graphite/20 py-7 sm:grid-cols-[150px_1fr]"><p className="text-[10px] font-bold uppercase tracking-[.11em] text-gold">Antes</p><p className="font-serif text-[25px] leading-tight tracking-[-.025em] text-graphite/75">Intenção sem uma forma clara de virar trabalho.</p></div><div className="grid gap-7 border-b border-graphite/20 py-7 sm:grid-cols-[150px_1fr]"><p className="text-[10px] font-bold uppercase tracking-[.11em] text-gold">Durante</p><p className="font-serif text-[25px] leading-tight tracking-[-.025em] text-graphite/75">Escolhas cuidadosas, desenvolvimento e revisão.</p></div><div className="grid gap-7 border-b border-graphite/20 py-7 sm:grid-cols-[150px_1fr]"><p className="text-[10px] font-bold uppercase tracking-[.11em] text-gold">Depois</p><p className="font-serif text-[25px] leading-tight tracking-[-.025em] text-navy">Uma candidatura que deixa ver o estudante por inteiro.</p></div></Reveal></div></section>

        <section className="bg-deep-navy py-24 text-ivory md:py-36"><div className="mx-auto grid w-[min(100%-40px,1280px)] gap-12 md:w-[min(100%-80px,1320px)] md:grid-cols-[.86fr_1.14fr] md:items-center"><Reveal><p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold">Tecnologia com critério</p><h2 className="mt-3 font-serif text-[clamp(2.8rem,4.7vw,4.8rem)] leading-[.93] tracking-[-.045em]">Inteligência que organiza. <em className="not-italic text-gold">A autoria continua sendo sua.</em></h2><p className="mt-7 max-w-[430px] text-[13px] leading-7 text-ivory/78">A tecnologia da Fostern identifica lacunas, consolida contexto e preserva continuidade entre conversas e decisões. Ela não escreve o estudante. Ela cria condições para que ele pense melhor.</p><p className="mt-4 max-w-[430px] text-[13px] leading-7 text-ivory/78">Uma rotina fixa parte do princípio de que todo dia é igual — seu aprendizado não é. Um imprevisto, uma prova mais difícil, um dia de cansaço: qualquer desvio quebra o plano inteiro, porque rotinas lineares dependem de tudo acontecer exatamente como previsto.</p><p className="mt-4 max-w-[430px] text-[13px] leading-7 text-ivory/78">Por isso a Fostern substitui o cronograma engessado por um <strong className="font-semibold text-ivory">ciclo de estudos</strong>: ele revisita cada matéria em intervalos, se recalcula sozinho quando você erra ou acerta mais do que o esperado, e continua funcionando mesmo quando um dia é perdido — sem culpa, sem recomeçar do zero. É a mesma lógica da prática espaçada e intercalada, aplicada à preparação para o SAT, o TOEFL e o restante da candidatura.</p></Reveal><Reveal delay={.12} className="border border-ivory/20 bg-navy p-6 sm:p-9"><div className="flex items-center justify-between border-b border-ivory/15 pb-5"><p className="text-[9px] font-bold tracking-[.14em] text-ivory/65">LEITURA DE CONTEXTO</p><span className="text-gold">●</span></div><div className="py-7"><p className="text-[9px] font-bold tracking-[.13em] text-gold">PERGUNTA EM ABERTO</p><p className="mt-3 max-w-md font-serif text-[28px] leading-tight tracking-[-.03em]">O que conecta sua curiosidade por cidades às pesquisas que você vem realizando?</p></div><div className="grid gap-px bg-ivory/15 sm:grid-cols-3"><div className="bg-deep-navy p-4"><p className="text-[8px] font-bold tracking-[.12em] text-ivory/50">CONTEXTO</p><p className="mt-2 text-[11px] text-ivory/85">Urbanismo e matemática</p></div><div className="bg-deep-navy p-4"><p className="text-[8px] font-bold tracking-[.12em] text-ivory/50">PRÓXIMO PASSO</p><p className="mt-2 text-[11px] text-ivory/85">Mapear referências</p></div><div className="bg-deep-navy p-4"><p className="text-[8px] font-bold tracking-[.12em] text-ivory/50">ACOMPANHAMENTO</p><p className="mt-2 text-[11px] text-ivory/85">Mentoria de sexta</p></div></div></Reveal></div><Reveal delay={.18} className="mx-auto mt-16 grid w-[min(100%-40px,1280px)] gap-px bg-ivory/15 sm:grid-cols-2 md:w-[min(100%-80px,1320px)] md:grid-cols-4">{[["Otimização em Matemática (SAT)", "Prática direcionada que identifica e elimina pontos fracos específicos para o exame."], ["Prontidão para o TOEFL", "Pontuação de prontidão por seção, com recomendações claras de melhoria."], ["Analytics de desempenho", "Leitura profunda de padrões de estudo, evolução de notas e eficiência."], ["Ciclo de estudo dinâmico", "Cronograma que se recalcula sozinho, adaptando-se ao seu ritmo — sem rotina fixa."]].map(([title, body]) => <div key={title} className="bg-deep-navy p-6"><p className="font-serif text-[17px] leading-tight text-ivory">{title}</p><p className="mt-2 text-[11px] leading-5 text-ivory/65">{body}</p></div>)}</Reveal></section>

        <section id="familias" className="bg-mist py-24 md:py-32"><Reveal className="mx-auto grid w-[min(100%-40px,1100px)] gap-7 md:w-[min(100%-80px,1100px)] md:grid-cols-[25%_1fr]"><div><p className="font-serif text-xl text-gold">02</p><p className="mt-2 text-[10px] font-bold uppercase tracking-[.14em] text-deep-navy">Para famílias</p></div><div><h2 className="font-serif text-[clamp(2.7rem,4.4vw,4.5rem)] leading-[.95] tracking-[-.045em] text-navy">Apoiar sem assumir<br />o lugar do <em className="not-italic text-deep-navy">estudante.</em></h2><p className="mt-7 max-w-[610px] text-[13px] leading-7 text-graphite/80">Aplicar para universidades internacionais envolve escolhas importantes, prazos, expectativas e investimento emocional. A Fostern dá visibilidade ao processo e orientação para que a família apoie com clareza—preservando a autonomia de quem está construindo o próprio futuro.</p><div className="mt-7"><TextLink href="#conversa">Entenda o papel da família</TextLink></div></div></Reveal></section>

        <section className="bg-ivory py-24 md:py-36"><div className="mx-auto grid w-[min(100%-40px,1280px)] gap-12 md:w-[min(100%-80px,1320px)] md:grid-cols-[.86fr_1.14fr] md:items-center"><Reveal><p className="text-[10px] font-bold uppercase tracking-[.14em] text-deep-navy">Nossa visão</p><h2 className="mt-3 font-serif text-[clamp(2.8rem,4.7vw,4.8rem)] leading-[.93] tracking-[-.045em] text-navy">Ampliar o acesso à <em className="not-italic text-deep-navy">educação de elite.</em></h2><p className="mt-7 max-w-[430px] text-[13px] leading-7 text-graphite/80">A Fostern existe para democratizar a mobilidade acadêmica estratégica. Geografia, recursos e assimetria de informação não deveriam decidir quem tem acesso às melhores universidades do mundo.</p><p className="mt-4 max-w-[430px] text-[13px] leading-7 text-graphite/80">Estamos construindo a estrutura para a próxima geração de estudantes brasileiros com alcance global.</p></Reveal><Reveal delay={.12} className="border border-graphite/15 bg-navy p-6 text-ivory sm:p-9"><p className="text-[9px] font-bold tracking-[.14em] text-gold">ALCANCE</p><p className="mt-3 max-w-sm font-serif text-[24px] leading-tight tracking-[-.03em]">Pensado para crescer junto com nossos estudantes.</p><svg viewBox="0 0 400 130" className="mt-8 h-auto w-full" fill="none" aria-hidden="true"><path d="M20 100 Q90 40 160 90 T300 70 T380 110" stroke="#D4AF37" strokeOpacity=".55" strokeWidth="1.2" /><circle cx="20" cy="100" r="3" fill="#D4AF37" /><circle cx="160" cy="90" r="3" fill="#D4AF37" /><circle cx="300" cy="70" r="3" fill="#D4AF37" /><circle cx="380" cy="110" r="3" fill="#D4AF37" /></svg></Reveal></div></section>

        <section id="planos" className="bg-mist py-24 md:py-36">
          <div className="mx-auto w-[min(100%-40px,1280px)] md:w-[min(100%-80px,1320px)]">
            <Reveal className="grid gap-6 pb-14 md:grid-cols-[25%_1fr]">
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-deep-navy">Planos</p>
              <div>
                <h2 className="max-w-3xl font-serif text-[clamp(2.8rem,5vw,5rem)] leading-[.94] tracking-[-.045em] text-navy">Escolha o ritmo <em className="not-italic text-deep-navy">certo pra você.</em></h2>
              </div>
            </Reveal>
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan, index) => (
                <Reveal key={plan.name} delay={index * .08} className={`flex flex-col border p-8 ${plan.highlight ? "border-navy bg-navy text-ivory" : "border-graphite/20 bg-ivory text-navy"}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-[.14em] ${plan.highlight ? "text-gold" : "text-deep-navy"}`}>{plan.name}</p>
                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-serif text-[40px] leading-none tracking-[-.03em]">{plan.price}</span>
                    {plan.period && <span className={`text-[12px] ${plan.highlight ? "text-ivory/70" : "text-graphite/60"}`}>{plan.period}</span>}
                  </div>
                  <p className={`mt-3 text-[12px] leading-5 ${plan.highlight ? "text-ivory/75" : "text-graphite/70"}`}>{plan.description}</p>
                  <ul className="mt-7 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className={`flex items-start gap-2.5 text-[12px] leading-5 ${plan.highlight ? "text-ivory/85" : "text-graphite/80"}`}>
                        <span className="mt-[3px] text-gold">＋</span>{feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <PrimaryLink href={plan.ctaHref} light={plan.highlight}>{plan.cta}</PrimaryLink>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="conversa" className="grain relative overflow-hidden bg-deep-navy py-28 text-ivory md:py-36"><div className="pointer-events-none absolute right-[8%] top-0 h-[380px] w-[380px] rounded-full border border-ivory/20" /><div className="pointer-events-none absolute right-[13%] top-[44px] h-[290px] w-[290px] rounded-full border border-ivory/15" /><Reveal className="relative mx-auto max-w-[770px] px-5 text-center md:px-0"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-gold">O próximo passo</p><h2 className="mt-5 font-serif text-[clamp(3rem,5.4vw,5.5rem)] leading-[.92] tracking-[-.05em]">Comece com uma conversa honesta sobre o que é possível <em className="not-italic text-gold">construir.</em></h2><p className="mx-auto mt-6 max-w-lg text-[13px] leading-7 text-ivory/80">Não é preciso ter tudo resolvido para começar. É preciso estar disposto a olhar com seriedade para o próximo passo.</p><ConversationForm /><p className="mx-auto mt-6 max-w-md text-[9px] leading-5 text-ivory/60">Para estudantes e famílias em busca de orientação internacional com profundidade.</p></Reveal></section>
      </main>
      <footer className="safe-bottom bg-navy text-ivory"><div className="mx-auto grid min-h-[170px] w-[min(100%-40px,1280px)] items-center gap-7 border-b border-ivory/15 py-9 md:w-[min(100%-80px,1320px)] md:grid-cols-3 md:py-0"><Brand compact /><p className="text-[11px] text-ivory/70">Preparação internacional com profundidade.</p><div className="flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-semibold text-ivory/75 md:justify-end"><Link href="#metodo">Método</Link><Link href="#mentoria">Mentoria</Link><Link href="#familias">Para famílias</Link><Link href="#conversa">Contato</Link><a href={`https://wa.me/${WHATSAPP_NUMERO}`} target="_blank" rel="noopener noreferrer" className="text-gold transition-opacity hover:opacity-70">WhatsApp</a></div></div><div className="mx-auto flex min-h-[64px] w-[min(100%-40px,1280px)] flex-wrap items-center gap-5 text-[9px] text-ivory/50 md:w-[min(100%-80px,1320px)]"><span>© 2026 Fostern</span><span className="ml-auto">Brasil · Mundo</span><Link href="#inicio">Privacidade</Link></div></footer>
    </div>
  );
}
