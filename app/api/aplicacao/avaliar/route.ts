import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 90;

const MAX_DOCS = 6;
const MAX_DOC_CHARS = 12000;
const MAX_CONTEXTO = 70000;

function carregarPrompt(): string {
  try {
    return readFileSync(process.cwd() + "/prompts/avaliador-aplicacao.md", "utf8");
  } catch {
    return "Você é um avaliador de admissões de universidades dos EUA, Canadá e Reino Unido. Avalie a aplicação de forma realista, honesta e construtiva, em português brasileiro, e responda apenas com JSON válido com nota_geral (0-100), secoes (com nota e comentario), pontos_fortes, pontos_fracos, sugestoes e veredito.";
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

type DocRow = { id: string; nome: string; tipo: string | null; storage_path: string | null; tamanho_bytes: number | null; criado_em: string };

async function extrairTextoDoc(admin: ReturnType<typeof createAdminClient>, doc: DocRow): Promise<{ texto: string; aviso?: string }> {
  if (!doc.storage_path) return { texto: "", aviso: `"${doc.nome}" está sem arquivo no storage.` };
  const { data, error } = await admin.storage.from("documentos").download(doc.storage_path);
  if (error || !data) return { texto: "", aviso: `Não foi possível baixar "${doc.nome}".` };

  const nome = doc.nome.toLowerCase();
  const buf = Buffer.from(await data.arrayBuffer());

  if (nome.endsWith(".pdf")) {
    try {
      const parser = new PDFParse({ data: buf });
      const resultado = await parser.getText();
      await parser.destroy();
      return { texto: (resultado.text ?? "").trim().slice(0, MAX_DOC_CHARS) };
    } catch {
      return { texto: "", aviso: `"${doc.nome}" é um PDF sem texto extraível (digitalizado?).` };
    }
  }

  if (nome.endsWith(".docx")) {
    try {
      const { value } = await mammoth.extractRawText({ buffer: buf });
      return { texto: value.trim().slice(0, MAX_DOC_CHARS) };
    } catch {
      return { texto: "", aviso: `Não foi possível ler "${doc.nome}".` };
    }
  }

  if (nome.endsWith(".txt")) {
    return { texto: buf.toString("utf8").trim().slice(0, MAX_DOC_CHARS) };
  }

  return { texto: "", aviso: `"${doc.nome}" (${doc.tipo ?? "arquivo"}) não é lido automaticamente — citado como evidência enviada.` };
}

function clampNota(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function strings(valor: unknown, max = 5): string[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter((i): i is string => typeof i === "string" && i.trim().length > 0)
    .slice(0, max)
    .map((i) => i.trim());
}

function extrairJson(texto: string): Record<string, unknown> | null {
  try {
    const direto = JSON.parse(texto);
    if (direto && typeof direto === "object") return direto;
  } catch {
    // tenta extrair do bloco ```json ... ```
  }
  const bloco = texto.match(/```(?:json)?\s*([\s\S]*?)```/);
  const alvo = bloco?.[1] ?? texto;
  const inicio = alvo.indexOf("{");
  const fim = alvo.lastIndexOf("}");
  if (inicio === -1 || fim <= inicio) return null;
  try {
    return JSON.parse(alvo.slice(inicio, fim + 1));
  } catch {
    return null;
  }
}

function normalizar(resultado: Record<string, unknown>) {
  const chaves = ["academico", "testes", "extracurriculares", "idiomas", "voluntariado", "financas", "ensaios", "preferencias"] as const;
  const secoes: Record<string, { nota: number; comentario: string }> = {};
  const cru = (resultado.secoes ?? {}) as Record<string, { nota?: unknown; comentario?: unknown }>;
  for (const chave of chaves) {
    const secao = cru[chave];
    if (secao && typeof secao === "object") {
      secoes[chave] = {
        nota: clampNota(secao.nota),
        comentario: typeof secao.comentario === "string" ? secao.comentario.trim() : "",
      };
    }
  }

  const notas = [clampNota(resultado.nota_geral), ...Object.values(secoes).map((s) => s.nota)].filter((n) => n > 0);
  const notaGeral = clampNota(resultado.nota_geral) || (notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : 0);

  return {
    nota_geral: notaGeral,
    secoes,
    pontos_fortes: strings(resultado.pontos_fortes),
    pontos_fracos: strings(resultado.pontos_fracos),
    sugestoes: strings(resultado.sugestoes),
    veredito: typeof resultado.veredito === "string" ? resultado.veredito.trim() : "",
  };
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  if (!(await planoAtivo(user.id))) {
    return NextResponse.json({ error: "A avaliação por IA faz parte dos planos pagos." }, { status: 403 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "A avaliação por IA ainda não foi configurada no servidor. Adicione a chave OPENAI_API_KEY." },
      { status: 503 },
    );
  }

  const { data: app } = await supabase.from("aplicacoes").select("*").eq("usuario_id", user.id).maybeSingle();
  if (!app) {
    return NextResponse.json({ error: "Complete o dossiê e salve antes de avaliar." }, { status: 400 });
  }

  const { data: docs } = await supabase
    .from("documentos")
    .select("*")
    .eq("usuario_id", user.id)
    .order("criado_em", { ascending: false })
    .limit(MAX_DOCS);

  const admin = createAdminClient();
  const conteudos: { texto: string; aviso?: string }[] = [];
  if (docs) {
    for (const doc of docs as DocRow[]) {
      conteudos.push(await extrairTextoDoc(admin, doc));
    }
  }

  const perfil = {
    serie: app.serie ?? null,
    escola: app.escola ?? null,
    media_escolar: app.media_escolar != null ? `${app.media_escolar} (escala: ${app.escala_media})` : null,
    posicao_turma: app.posicao_turma ?? null,
    carga_horaria_semanal: app.carga_horaria_semanal ?? null,
    testes: {
      sat: app.sat ?? null,
      act: app.act ?? null,
      toefl: app.toefl ?? null,
      ielts: app.ielts ?? null,
      outros: app.outros_testes ?? null,
    },
    extracurriculares: app.extracurriculares ?? [],
    idiomas: app.idiomas ?? [],
    voluntariado: app.voluntariado ?? [],
    financas: {
      orcamento_anual_usd: app.orcamento_anual_usd ?? null,
      precisa_bolsa: app.precisa_bolsa ?? false,
      observacao: app.financa_observacao ?? null,
    },
    ensaios: {
      tema: app.ensaio_tema ?? null,
      versao: app.ensaio_versao ?? null,
    },
    preferencias: {
      paises: app.paises ?? [],
      cursos: app.cursos ?? [],
      observacao: app.preferencia_obs ?? null,
    },
  };

  const documentosParaIa = conteudos.map((c, i) => {
    const doc = (docs as DocRow[])[i];
    const texto = c.texto.slice(0, MAX_DOC_CHARS);
    const nome = doc?.nome ?? "documento";
    const resumo = texto.length > 0 ? texto : "(sem texto extraído)";
    return `### ${nome}\n${c.aviso ?? ""}\n${resumo}`;
  });

  const promptUsuario = JSON.stringify({ dossie: perfil, documentos: documentosParaIa });

  const base = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const chamar = async (comFormatoJson: boolean) => {
    const body: Record<string, unknown> = {
      model,
      temperature: 0.2,
      max_tokens: 1800,
      messages: [
        { role: "system", content: carregarPrompt() },
        { role: "user", content: promptUsuario.slice(0, MAX_CONTEXTO) },
      ],
    };
    if (comFormatoJson) body.response_format = { type: "json_object" };
    const resposta = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!resposta.ok) {
      const texto = await resposta.text();
      throw new Error(`A IA retornou um erro (${resposta.status}). Tente novamente. ${texto.slice(0, 200)}`);
    }
    const dados = await resposta.json();
    const texto = dados?.choices?.[0]?.message?.content;
    if (!texto) throw new Error("A IA não retornou resposta.");
    return texto;
  };

  try {
    let textoResposta: string;
    try {
      textoResposta = await chamar(true);
    } catch (erroComJson) {
      if (erroComJson instanceof Error && erroComJson.message.includes("(400)")) {
        textoResposta = await chamar(false);
      } else {
        throw erroComJson;
      }
    }

    const cru = extrairJson(textoResposta);
    if (!cru) {
      return NextResponse.json({ error: "A IA não devolveu um resultado válido. Tente novamente." }, { status: 502 });
    }
    const avaliacao = normalizar(cru);

    const agora = new Date().toISOString();
    const { error } = await admin
      .from("aplicacoes")
      .upsert({ usuario_id: user.id, avaliacao_ia: avaliacao, avaliada_ia_em: agora }, { onConflict: "usuario_id" });
    if (error) {
      return NextResponse.json({ error: `Não foi possível salvar a avaliação: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ avaliacao, avaliada_ia_em: agora });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao avaliar a aplicação.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
