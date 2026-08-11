import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

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
