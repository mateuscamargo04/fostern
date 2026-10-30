import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPanel } from "@/components/auth-panel";

export const metadata: Metadata = {
  title: "Entrar | Fostern",
  description: "Acesse sua conta Fostern ou crie uma para começar sua preparação internacional."
};

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ mode?: string; plan?: string; next?: string }> }) {
  const { mode } = await searchParams;
  return (
    <Suspense fallback={null}>
      <AuthPanel initialMode={mode === "register" ? "register" : "login"} />
    </Suspense>
  );
}
