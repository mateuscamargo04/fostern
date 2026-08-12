import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isMentorEmail } from "@/lib/mentor";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isLearn = request.nextUrl.pathname.startsWith("/dashboard/aprender");
  const isConta = request.nextUrl.pathname.startsWith("/dashboard/perfil") || request.nextUrl.pathname.startsWith("/dashboard/configuracoes");
  const isPlanos = request.nextUrl.pathname.startsWith("/planos");
  const isRoot = request.nextUrl.pathname === "/";

  const redirect = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
    return NextResponse.redirect(url);
  };

  if (!user && (isDashboard || isPlanos)) {
    return redirect("/auth", { mode: "login" });
  }

  if (user && isAuthPage) {
    return redirect("/dashboard");
  }

  if (user && isRoot) {
    return redirect("/dashboard");
  }

  // A área do estudante só é liberada para quem tem plano ativo.
  // Aulas de amostra (/dashboard/aprender) ficam abertas para o plano gratuito,
  // assim como a gestão da conta (perfil e configurações) e o painel do mentor.
  const isMentorPanel = request.nextUrl.pathname.startsWith("/dashboard/mentor");
  if (user && isDashboard && !isLearn && !isConta && !(isMentorPanel && isMentorEmail(user.email))) {
    const agora = new Date().toISOString();
    const { data } = await supabase
      .from("assinaturas")
      .select("id")
      .eq("usuario_id", user.id)
      .eq("status", "ativa")
      .gt("termino_em", agora)
      .limit(1);
    if (!data || data.length === 0) {
      return redirect("/planos");
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/", "/auth/:path*", "/dashboard/:path*", "/planos"],
};
