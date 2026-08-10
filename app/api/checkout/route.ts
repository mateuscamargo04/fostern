import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY não configurada.");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(request: Request) {
  const { planSlug } = (await request.json().catch(() => ({}))) as { planSlug?: string };
  if (!planSlug) {
    return NextResponse.json({ error: "Plano não informado." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: plano, error } = await admin
    .from("planos")
    .select("*")
    .eq("slug", planSlug)
    .eq("ativo", true)
    .maybeSingle();

  if (error || !plano) {
    return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const metadata = { usuario_id: user.id, plano_slug: plano.slug };

  try {
    const recorrente = plano.periodo !== "avulso";
    const intervalo = plano.periodo === "anual" ? "year" : "month";
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email ?? undefined,
      metadata,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: plano.preco_centavos,
            recurring: { interval: intervalo },
            product_data: { name: `Fostern · ${plano.nome}` },
          },
        },
      ],
      subscription_data: recorrente ? { metadata } : undefined,
      success_url: `${origin}/dashboard`,
      cancel_url: `${origin}/planos`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar o checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
