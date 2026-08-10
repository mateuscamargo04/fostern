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
    const isRecorrente = plano.periodo === "mensal";
    const session = await getStripe().checkout.sessions.create({
      mode: isRecorrente ? "subscription" : "payment",
      customer_email: user.email ?? undefined,
      metadata,
      line_items: [
        {
          quantity: 1,
          price_data: isRecorrente
            ? {
                currency: "brl",
                unit_amount: plano.preco_centavos,
                recurring: { interval: "month" },
                product_data: { name: `Fostern · ${plano.nome}` },
              }
            : {
                currency: "brl",
                unit_amount: plano.preco_centavos,
                product_data: { name: `Fostern · ${plano.nome}` },
              },
        },
      ],
      subscription_data: isRecorrente ? { metadata } : undefined,
      payment_intent_data: isRecorrente ? undefined : { metadata },
      success_url: `${origin}/dashboard/aprender?pago=1`,
      cancel_url: `${origin}/planos`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao criar o checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
