"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Erro no painel:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60svh] items-center justify-center">
      <div className="w-full max-w-[420px] text-center">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Fostern</p>
        <h1 className="mt-3 font-serif text-[clamp(1.7rem,3vw,2.2rem)] leading-tight tracking-[-.03em] text-navy">
          Esta parte do painel não carregou.
        </h1>
        <p className="mt-2 text-[12px] leading-5 text-graphite/60">
          Ocorreu um erro inesperado. Tente novamente — se o problema continuar, recarregue a página.
        </p>
        {error?.message && error.message !== "Application error: a client-side exception has occurred (see the browser console for more information)." && (
          <p className="mt-2 break-all text-[10px] text-graphite/40">{error.message}</p>
        )}
        {error?.digest && (
          <p className="mt-2 break-all text-[10px] text-graphite/40">Código: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={retry}
          className="mt-6 inline-flex min-h-11 items-center justify-center border border-gold bg-gold px-6 text-[11px] font-bold uppercase tracking-[.12em] text-navy transition-colors hover:bg-gold/90"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
