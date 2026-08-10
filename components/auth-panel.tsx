"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const campusImages = [
  "/images/campuses/oxford.jpg",
  "/images/campuses/mit-dome-dusk.jpg",
  "/images/campuses/harvard.jpg",
  "/images/campuses/stanford.jpg",
  "/images/campuses/cambridge.jpg",
  "/images/campuses/caltech.jpg",
  "/images/campuses/princeton.jpg",
  "/images/campuses/eth.jpg",
];

function Arrow() {
  return <span aria-hidden="true" className="text-base leading-none transition-transform duration-300 group-hover:translate-x-1">→</span>;
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-4 w-4">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {visible && <path d="M4 4l16 16" />}
    </svg>
  );
}

export function AuthPanel({ initialMode = "login" }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setSlide((s) => (s + 1) % campusImages.length), 5000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    const render = () => {
      if (captchaRef.current && window.turnstile) {
        window.turnstile.render(captchaRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "dark",
          size: "flexible",
          callback: (token) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(null),
          "error-callback": () => setCaptchaToken(null),
        });
      }
    };
    if (window.turnstile) {
      render();
    } else {
      window.onloadTurnstileCallback = render;
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    return () => {
      if (captchaRef.current && window.turnstile) window.turnstile.remove(captchaRef.current);
    };
  }, []);

  const resetCaptcha = () => {
    if (captchaRef.current && window.turnstile) window.turnstile.reset(captchaRef.current);
    setCaptchaToken(null);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setDone(null);
  };

  const finish = (message: string) => {
    setSubmitting(false);
    setDone(message);
  };

  const translateError = (raw: string) => {
    const map: [RegExp, string][] = [
      [/Invalid login credentials/i, "E-mail ou senha incorretos."],
      [/User already registered/i, "Este e-mail já está cadastrado. Faça login."],
      [/Email not confirmed/i, "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada (e o spam)."],
      [/Password should be at least/i, "A senha precisa ter pelo menos 8 caracteres."],
      [/Unable to validate email/i, "E-mail inválido. Confira o formato."],
      [/rate limit/i, "Muitas tentativas. Aguarde um minuto e tente de novo."],
      [/provider is not enabled/i, "Login com Google ainda não foi configurado. Use e-mail e senha por enquanto."],
    ];
    for (const [pattern, replacement] of map) {
      if (pattern.test(raw)) return replacement;
    }
    return raw;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setDone(null);
    if (!email.includes("@") || !email.includes(".")) return setError("Informe um e-mail válido.");
    if (password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    if (mode === "register") {
      if (name.trim().length < 2) return setError("Informe seu nome completo.");
      if (password !== confirm) return setError("As senhas não conferem.");
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) return setError("Complete a verificação de segurança.");
    setSubmitting(true);
    const supabase = createClient();
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken: captchaToken ?? undefined } });
        if (error) throw error;
        window.location.href = "/dashboard";
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome: name }, captchaToken: captchaToken ?? undefined },
      });
      if (error) throw error;
      if (data.session) {
        window.location.href = "/dashboard";
        return;
      }
      finish("Conta criada! Enviamos um link de confirmação para o seu e-mail.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Algo deu errado. Tente novamente.";
      setError(translateError(message));
      setSubmitting(false);
      resetCaptcha();
    }
  };

  const google = async () => {
    setError(null);
    setDone(null);
    setSubmitting(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível entrar com o Google.";
      setError(translateError(message));
      setSubmitting(false);
    }
  };

  const resetPassword = async () => {
    setError(null);
    setDone(null);
    if (!email.includes("@") || !email.includes(".")) return setError("Informe seu e-mail para enviarmos o link.");
    setSubmitting(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=login`,
        captchaToken: captchaToken ?? undefined,
      });
      if (error) throw error;
      finish("Enviamos um link de recuperação para o seu e-mail.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível enviar o link.";
      setError(translateError(message));
      setSubmitting(false);
      resetCaptcha();
    }
  };

  const isRegister = mode === "register";

  return (
    <main className="grain relative min-h-[100svh] bg-navy text-ivory lg:h-[100svh] lg:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 md:px-12 lg:px-14 lg:overflow-y-auto lg:py-5">
        <Link href="/" aria-label="Fostern, início">
          <img src="/images/fostern-logo.png" alt="Fostern" className="h-auto w-44 md:w-48" />
        </Link>

        <div className="flex flex-1 flex-col justify-center py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[.16em] text-gold">Preparação internacional</p>
              <h1 className="max-w-[400px] font-serif text-[clamp(2rem,3.8vw,2.9rem)] leading-[.98] tracking-[-.04em]">
                {isRegister ? "Comece sua jornada." : "Bem-vindo de volta."}
              </h1>
              <p className="mt-2 max-w-[380px] text-[13px] leading-6 text-ivory/70">
                {isRegister
                  ? "Crie sua conta para acompanhar seu plano, sua mentoria e o seu Caderno Fostern."
                  : "Entre para continuar sua preparação de onde parou."}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex gap-12 border-b border-white/15">
            {(["login", "register"] as Mode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => switchMode(item)}
                className={`-mb-px border-b-2 pb-2.5 text-[11px] font-bold uppercase tracking-[.14em] transition-colors ${
                  mode === item ? "border-gold text-ivory" : "border-transparent text-ivory/45 hover:text-ivory/75"
                }`}
              >
                {item === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {isRegister && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <label htmlFor="auth-name" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-ivory/60">
                    Nome completo
                  </label>
                  <input
                    id="auth-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    placeholder="Como você se chama?"
                    className="w-full border-b border-white/20 bg-transparent pb-3 pt-1 text-[15px] text-ivory placeholder:text-ivory/35 focus:border-gold focus:outline-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label htmlFor="auth-email" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-ivory/60">
                E-mail
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="voce@exemplo.com"
                className="w-full border-b border-white/20 bg-transparent pb-3 pt-1 text-[15px] text-ivory placeholder:text-ivory/35 focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-ivory/60">
                Senha
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  placeholder="Pelo menos 8 caracteres"
                  className="w-full border-b border-white/20 bg-transparent pb-3 pr-10 pt-1 text-[15px] text-ivory placeholder:text-ivory/35 focus:border-gold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-0 top-1 grid h-8 w-8 place-items-center text-ivory/45 transition-colors hover:text-gold"
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label htmlFor="auth-confirm" className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-ivory/60">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    id="auth-confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                    className="w-full border-b border-white/20 bg-transparent pb-3 pr-10 pt-1 text-[15px] text-ivory placeholder:text-ivory/35 focus:border-gold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-0 top-1 grid h-8 w-8 place-items-center text-ivory/45 transition-colors hover:text-gold"
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>
            )}

            {!isRegister && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={resetPassword}
                  disabled={submitting}
                  className="text-[10px] font-bold uppercase tracking-[.14em] text-ivory/50 transition-colors hover:text-gold"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {(error || done) && (
              <p className={`text-[12px] leading-5 ${error ? "text-[#F2B8A8]" : "text-gold"}`}>{error ?? done}</p>
            )}

            {TURNSTILE_SITE_KEY && (
              <div className="flex w-full justify-center">
                <div ref={captchaRef} className="w-full max-w-[300px]" />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="group inline-flex min-h-12 w-full items-center justify-center gap-6 border border-gold bg-gold px-5 text-[11px] font-bold tracking-[.01em] text-navy transition-[padding,transform,background-color] duration-500 ease-out hover:-translate-y-0.5 hover:px-7 hover:bg-gold/90 disabled:cursor-wait disabled:opacity-70"
            >
              <span>{submitting ? "Aguarde..." : isRegister ? "Criar conta" : "Entrar"}</span>
              <Arrow />
            </button>
          </form>

          <div className="my-4 flex items-center gap-4">
            <span className="h-px flex-1 bg-white/15" />
            <span className="text-[9px] font-bold uppercase tracking-[.18em] text-ivory/40">ou</span>
            <span className="h-px flex-1 bg-white/15" />
          </div>

          <button
            type="button"
            onClick={google}
            disabled={submitting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-3 border border-white/25 px-5 text-[11px] font-bold text-ivory transition-colors duration-300 hover:border-white/50 hover:bg-white/5 disabled:cursor-wait disabled:opacity-70"
          >
            <GoogleIcon />
            Continuar com Google
          </button>

          <p className="mt-4 max-w-[400px] text-[10px] leading-5 text-ivory/40">
            Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade da Fostern.
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0">
          <AnimatePresence mode="sync">
            <motion.div
              key={campusImages[slide]}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image src={campusImages[slide]} alt="" fill priority sizes="50vw" className="object-cover object-[50%_40%] brightness-[1.05] contrast-[1.3] saturate-[1.6] hue-rotate-[-6deg]" />
            </motion.div>
          </AnimatePresence>
        </div>
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(4,16,30,0.55)_0%,rgba(3,12,24,0.28)_45%,rgba(1,6,14,0.82)_100%)]" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_right,rgba(8,29,54,0.55)_0%,transparent_45%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex justify-end">
            <div className="flex gap-2">
              {campusImages.map((img, index) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setSlide(index)}
                  aria-label={`Imagem ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-500 ${index === slide ? "w-6 bg-gold" : "w-1.5 bg-ivory/30 hover:bg-ivory/60"}`}
                />
              ))}
            </div>
          </div>
          <div className="max-w-[420px]">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[.16em] text-gold">Fostern · preparação internacional</p>
            <h2 className="font-serif text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[.96] tracking-[-.045em]">
              Ambição merece um plano <em className="not-italic text-gold">à altura.</em>
            </h2>
          </div>
        </div>
      </div>
    </main>
  );
}
