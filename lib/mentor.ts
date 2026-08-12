const DEFAULT_MENTOR_EMAILS = ["mateusdevlp@gmail.com"];

/**
 * Identifica a conta que atua como mentor/administrador da Fostern.
 * Usada no shell (nav do painel do mentor) e nas rotas de API do mentor.
 */
export function isMentorEmail(email?: string | null): boolean {
  if (!email) return false;
  const configured = process.env.NEXT_PUBLIC_FOSTERN_MENTOR_EMAILS ?? "";
  const list = configured
    ? configured.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_MENTOR_EMAILS;
  return list.includes(email.trim().toLowerCase());
}
