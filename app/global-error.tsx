"use client";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#F6F2EA", color: "#1C1C1C", fontFamily: "Manrope, Arial, sans-serif" }}>
        <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: "0 24px", boxSizing: "border-box" }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#D4AF37" }}>
              Fostern
            </p>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.8rem,3vw,2.4rem)", lineHeight: 1.1, letterSpacing: "-.03em", color: "#081D36", margin: "12px 0 8px" }}>
              Algo deu errado.
            </h1>
            <p style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(28,28,28,.6)", margin: 0 }}>
              Ocorreu um erro inesperado ao carregar esta página. Tente novamente — se o problema continuar, recarregue a página.
            </p>
            {error?.digest && (
              <p style={{ fontSize: 10, color: "rgba(28,28,28,.4)", margin: "8px 0 0", wordBreak: "break-all" }}>
                Código: {error.digest}
              </p>
            )}
            <button
              type="button"
              onClick={retry}
              style={{
                marginTop: 24,
                minHeight: 44,
                padding: "0 24px",
                border: "1px solid #D4AF37",
                background: "#D4AF37",
                color: "#081D36",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
