import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

export const LIMITE_DIARIO = 20;

function carregarPrompt(): string {
  try {
    return readFileSync(process.cwd() + "/prompts/tutora-ia.md", "utf8");
  } catch {
    return `Você é a Tutora IA da Fostern, assistente de estudo das universidades americanas, canadenses e britânicas.
Responda em português brasileiro, de forma calorosa e objetiva. Nunca invente dados — use "Confirme com a universidade" quando não tiver certeza. Respeite o limite de 350 palavras.`;
  }
}

async function planoAtivo(usuarioId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("assinaturas")
    .select("status")
    .eq("usuario_id", usuarioId)
    .order("inicio_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.status === "ativa";
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

async function usarHoje(supabase: SupabaseClient, usuarioId: string) {
  const dia = hoje();
  const { data: uso } = await supabase
    .from("tutora_uso")
    .select("contagem")
    .eq("usuario_id", usuarioId)
    .eq("dia", dia)
    .maybeSingle();
  const contagem = uso?.contagem ?? 0;
  if (contagem >= LIMITE_DIARIO) return { ok: false as const, contagem };
  const { error } = await supabase
    .from("tutora_uso")
    .upsert({ usuario_id: usuarioId, dia, contagem: contagem + 1, atualizado_em: new Date().toISOString() }, { onConflict: "usuario_id,dia" });
  if (error) {
    return { ok: false as const, contagem };
  }
  return { ok: true as const, contagem: contagem + 1 };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!(await planoAtivo(user.id))) {
    return NextResponse.json({ error: "A Tutora IA faz parte dos planos pagos." }, { status: 403 });
  }
  const dia = hoje();
  const { data: uso } = await supabase
    .from("tutora_uso")
    .select("contagem")
    .eq("usuario_id", user.id)
    .eq("dia", dia)
    .maybeSingle();
  return NextResponse.json({ limite: LIMITE_DIARIO, restante: Math.max(0, LIMITE_DIARIO - (uso?.contagem ?? 0)) });
}

export async function POST(request: Request) {
  const { pergunta } = (await request.json().catch(() => ({}))) as { pergunta?: string };

  if (!pergunta || pergunta.trim().length < 2) {
    return NextResponse.json({ error: "Escreva sua pergunta." }, { status: 400 });
  }
  if (pergunta.length > 2000) {
    return NextResponse.json({ error: "Pergunta muito longa (máx. 2000 caracteres)." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const ativo = await planoAtivo(user.id);
  if (!ativo) {
    return NextResponse.json({ error: "A Tutora IA faz parte dos planos pagos." }, { status: 403 });
  }

  const uso = await usarHoje(supabase, user.id);
  if (!uso.ok) {
    return NextResponse.json(
      { error: `Você atingiu o limite diário de ${LIMITE_DIARIO} mensagens. Volte amanhã para continuar.` },
      { status: 429 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "A Tutora IA ainda não foi configurada no servidor. Adicione a chave OPENAI_API_KEY." },
      { status: 503 },
    );
  }

  const base = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  try {
    const resposta = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 700,
        messages: [
          { role: "system", content: carregarPrompt() },
          { role: "user", content: pergunta.trim() },
        ],
      }),
    });

    if (!resposta.ok) {
      const texto = await resposta.text();
      return NextResponse.json(
        { error: `A IA retornou um erro (${resposta.status}). Tente novamente.` },
        { status: 502 },
      );
    }

    const dados = await resposta.json();
    const texto = dados?.choices?.[0]?.message?.content;
    if (!texto) {
      return NextResponse.json({ error: "A IA não retornou resposta." }, { status: 502 });
    }

    return NextResponse.json({ resposta: texto });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao consultar a IA.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
