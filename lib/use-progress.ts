"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadProgress, saveProgress } from "@/lib/learning";
import type { ProgressMap } from "@/lib/learning";

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const sync = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (active) setReady(true);
        return;
      }
      const { data } = await supabase
        .from("progresso_aulas")
        .select("aula_id")
        .eq("concluida", true);
      if (!active) return;
      const remote = Object.fromEntries((data ?? []).map((row) => [row.aula_id, true]));
      const local = loadProgress();
      const merged = { ...local, ...remote };
      setProgress(merged);
      saveProgress(merged);

      // Backfill: aulas concluídas só no localStorage (antes de logar ou em
      // outro dispositivo) são persistidas no banco agora que há sessão.
      const faltantes = Object.keys(merged).filter((aulaId) => merged[aulaId] && !remote[aulaId]);
      if (faltantes.length > 0) {
        const linhas = faltantes.map((aulaId) => ({
          usuario_id: session.user.id,
          aula_id: aulaId,
          concluida: true,
          concluida_em: new Date().toISOString(),
        }));
        const { error } = await supabase
          .from("progresso_aulas")
          .upsert(linhas, { onConflict: "usuario_id,aula_id" });
        if (error) console.warn("backfill progresso falhou:", error.message);
      }
      setReady(true);
    };
    sync();
    return () => {
      active = false;
    };
  }, []);

  const complete = useCallback((lessonId: string) => {
    setProgress((prev) => {
      const next = { ...prev, [lessonId]: true };
      saveProgress(next);
      createClient()
        .auth.getSession()
        .then(({ data: { session } }) => {
          if (!session) return;
          createClient()
            .from("progresso_aulas")
            .upsert(
              {
                usuario_id: session.user.id,
                aula_id: lessonId,
                concluida: true,
                concluida_em: new Date().toISOString(),
              },
              { onConflict: "usuario_id,aula_id" }
            );
        });
      return next;
    });
  }, []);

  return { progress, complete, ready };
}
