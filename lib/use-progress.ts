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
      if (data) {
        const remote = Object.fromEntries(data.map((row) => [row.aula_id, true]));
        const merged = { ...loadProgress(), ...remote };
        setProgress(merged);
        saveProgress(merged);
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
