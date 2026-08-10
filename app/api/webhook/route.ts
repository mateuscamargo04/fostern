import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { periodoMeses } from "@/lib/plans";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY não configurada.");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function addMeses(date: Date, meses: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + meses);
  return d.toISOString();
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assinatura inválida.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const usuarioId = session.metadata?.usuario_id;
      const planSlug = session.metadata?.plano_slug;
      if (!usuarioId || !planSlug) break;

      const { data: plano } = await admin.from("planos").select("*").eq("slug", planSlug).single();
      if (!plano) break;

      const agora = new Date();
      const termino = addMeses(agora, periodoMeses(plano.periodo));
      const assinaturaId = crypto.randomUUID();

      const { error: assinaturaError } = await admin.from("assinaturas").insert({
        id: assinaturaId,
        usuario_id: usuarioId,
        plano_id: plano.id,
        status: "ativa",
        inicio_em: agora.toISOString(),
        termino_em: termino,
        stripe_customer_id: String(session.customer ?? ""),
        stripe_subscription_id: String(session.subscription ?? ""),
      });
      if (assinaturaError) {
        return NextResponse.json({ error: assinaturaError.message }, { status: 500 });
      }

      await admin.from("pagamentos").insert({
        usuario_id: usuarioId,
        assinatura_id: assinaturaId,
        valor_centavos: plano.preco_centavos,
        status: "pago",
        metodo: "cartao",
        gateway: "stripe",
        gateway_id: String(session.id),
        pago_em: agora.toISOString(),
      });

      // Envia e-mail de boas-vindas/confirmação (opcional — pode ligar o Resend aqui).
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionRef = invoice.parent?.subscription_details?.subscription;
      const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
      if (!subscriptionId) break;

      const sub = await getStripe().subscriptions.retrieve(subscriptionId);
      const planSlug = sub.metadata?.plano_slug;
      if (!planSlug) break;

      const { data: plano } = await admin.from("planos").select("*").eq("slug", planSlug).single();
      if (!plano) break;

      await admin
        .from("assinaturas")
        .update({
          status: "ativa",
          termino_em: addMeses(new Date(), periodoMeses(plano.periodo)),
          stripe_subscription_id: subscriptionId,
        })
        .eq("stripe_subscription_id", subscriptionId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await admin
        .from("assinaturas")
        .update({ status: "cancelada" })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
