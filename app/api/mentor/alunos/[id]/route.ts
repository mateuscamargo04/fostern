import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMentor } from "../../_guard";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const mentor = await requireMentor();
  if (!mentor) {
    return NextResponse.json({ error: "Acesso restrito ao mentor." }, { status: 403 });
  }
  const { id } = await params;

  const admin = createAdminClient();

  try {
    const { data: perfil } = await admin.from("perfis").select("*").eq("id", id).maybeSingle();
    if (!perfil) return NextResponse.json({ error: "Estudante não encontrado." }, { status: 404 });

    const [{ data: app }, { data: unis }, { data: docs }, { data: ments }, { data: progresso }] = await Promise.all([
      admin.from("aplicacoes").select("*").eq("usuario_id", id).maybeSingle(),
      admin.from("universidades").select("*").order("nota", { ascending: false }).order("nome"),
      admin.from("documentos").select("*").order("criado_em", { ascending: false }),
      admin.from("mentorias").select("*").order("agendada_para", { ascending: false }),
      admin.from("progresso_aulas").select("concluida").eq("usuario_id", id),
    ]);

    type Doc = NonNullable<typeof docs>[number] & { url?: string | null };
    const documentosComUrl: Doc[] = [];
    if (docs) {
      for (const doc of docs as NonNullable<typeof docs>) {
        const item = doc as Doc;
        if (doc.storage_path) {
          const { data: signed } = await admin.storage.from("documentos").createSignedUrl(doc.storage_path, 3600);
          item.url = signed?.signedUrl ?? null;
        }
        documentosComUrl.push(item);
      }
    }

    const aulasConcluidas = (progresso ?? []).filter((p) => p.concluida).length;

    return NextResponse.json({
      aluno: {
        perfil,
        aplicacao: app ?? null,
        universidades: unis ?? [],
        documentos: documentosComUrl,
        mentorias: ments ?? [],
        aulas_concluidas: aulasConcluidas,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro inesperado." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const mentor = await requireMentor();
  if (!mentor) {
    return NextResponse.json({ error: "Acesso restrito ao mentor." }, { status: 403 });
  }
  const { id } = await params;
  let body: { status?: string; revisao_mentor?: string; pronta?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const status = body.status ?? "revisada";
  const update: Record<string, string | boolean | null> = {
    status,
    revisao_mentor: body.revisao_mentor ?? null,
    revisada_em: new Date().toISOString(),
  };
  if (typeof body.pronta === "boolean") update.pronta = body.pronta;

  const admin = createAdminClient();
  const { error } = await admin.from("aplicacoes").update(update).eq("usuario_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: app } = await admin.from("aplicacoes").select("*").eq("usuario_id", id).maybeSingle();
  return NextResponse.json({ aplicacao: app });
}
