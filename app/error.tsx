"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Erro na aplicação:", error);
  }, [error]);

  return (
    <div className="grid min-h-[100svh] place-items-center bg-ivory px-6 text-graphite">
      <div className="w-full max-w-[420px] text-center">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold">Fostern</p>
        <h1 className="mt-3 font-serif text-[clamp(1.8rem,3vw,2.4rem)] leading-tight tracking-[-.03em] text-navy">
          Algo deu errado.
        </h1>
        <p className="mt-2 text-[12px] leading-5 text-graphite/60">
          Ocorreu um erro inesperado ao carregar esta página. Tente novamente — se o problema continuar, recarregue a página.
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
