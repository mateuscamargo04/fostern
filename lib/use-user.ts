"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type UsuarioLogado = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  initials: string;
  avatarUrl: string | null;
};

export const USER_UPDATED_EVENT = "fostern:user-updated";

export function useUser() {
  const [user, setUser] = useState<UsuarioLogado | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setUser(null);
      setLoading(false);
      return;
    }
    let nome = session.user.user_metadata?.nome as string | undefined;
    let avatarUrl = session.user.user_metadata?.avatar_url as string | undefined;
    const { data } = await supabase
      .from("perfis")
      .select("nome, avatar_url")
      .eq("id", session.user.id)
      .maybeSingle();
    if (data) {
      nome = nome ?? data.nome ?? undefined;
      avatarUrl = data.avatar_url ?? avatarUrl;
    }
    const full = nome ?? session.user.email?.split("@")[0] ?? "Estudante";
    const firstName = full.split(" ")[0];
    const initials = full
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    setUser({
      id: session.user.id,
      email: session.user.email ?? "",
      name: full,
      firstName,
      initials,
      avatarUrl: avatarUrl ?? null,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
    window.addEventListener(USER_UPDATED_EVENT, carregar);
    return () => window.removeEventListener(USER_UPDATED_EVENT, carregar);
  }, [carregar]);

  return { user, loading };
}
