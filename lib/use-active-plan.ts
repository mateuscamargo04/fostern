"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type EstadoPlano = {
  loading: boolean;
  ativo: boolean;
};

// Retorna se o usuário logado tem uma assinatura ativa (status = 'ativa'
// e termino_em no futuro). Sem assinatura = plano gratuito (implícito).
export function useActivePlan(): EstadoPlano {
  const [estado, setEstado] = useState<EstadoPlano>({ loading: true, ativo: false });

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        if (active) setEstado({ loading: false, ativo: false });
        return;
      }
      const agora = new Date().toISOString();
      const { data } = await supabase
        .from("assinaturas")
        .select("id")
        .eq("usuario_id", session.user.id)
        .eq("status", "ativa")
        .gt("termino_em", agora)
        .limit(1);
      if (active) setEstado({ loading: false, ativo: !!data && data.length > 0 });
    })();
    return () => {
      active = false;
    };
  }, []);

  return estado;
}
