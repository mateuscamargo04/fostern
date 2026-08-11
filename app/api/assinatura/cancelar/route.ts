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

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: assinatura } = await admin
    .from("assinaturas")
    .select("id, stripe_subscription_id")
    .eq("usuario_id", user.id)
    .eq("status", "ativa")
    .not("stripe_subscription_id", "is", null)
    .order("inicio_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!assinatura?.stripe_subscription_id) {
    return NextResponse.json({ error: "Nenhuma assinatura ativa para cancelar." }, { status: 400 });
  }

  try {
    await getStripe().subscriptions.cancel(assinatura.stripe_subscription_id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Não foi possível cancelar no Stripe.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error } = await admin
    .from("assinaturas")
    .update({ status: "cancelada", termino_em: new Date().toISOString() })
    .eq("id", assinatura.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
