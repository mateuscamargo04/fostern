import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMentor } from "../_guard";

export async function GET() {
  const mentor = await requireMentor();
  if (!mentor) {
    return NextResponse.json({ error: "Acesso restrito ao mentor." }, { status: 403 });
  }

  const admin = createAdminClient();
  const agora = new Date().toISOString();

  try {
    const [{ data: perfis, error: pErr }, { data: apps, error: aErr }, { data: unis, error: uErr }, { data: docs, error: dErr }, { data: ments, error: mErr }] = await Promise.all([
      admin.from("perfis").select("id, nome, email, avatar_url, criado_em"),
      admin.from("aplicacoes").select("usuario_id, status, pronta, media_escolar, escala_media, sat, toefl, ielts, precisa_bolsa, atualizado_em, revisada_em"),
      admin.from("universidades").select("usuario_id"),
      admin.from("documentos").select("usuario_id"),
      admin
        .from("mentorias")
        .select("usuario_id, agendada_para, status")
        .eq("status", "agendada")
        .gt("agendada_para", agora),
    ]);
    if (pErr || aErr || uErr || dErr || mErr) {
      return NextResponse.json({ error: "Não foi possível carregar os estudantes." }, { status: 500 });
    }

    const appsPorUsuario = new Map<string, (typeof apps)[number]>();
    for (const app of apps ?? []) appsPorUsuario.set(app.usuario_id, app);
    const unisCount = new Map<string, number>();
    for (const u of unis ?? []) unisCount.set(u.usuario_id, (unisCount.get(u.usuario_id) ?? 0) + 1);
    const docsCount = new Map<string, number>();
    for (const d of docs ?? []) docsCount.set(d.usuario_id, (docsCount.get(d.usuario_id) ?? 0) + 1);
    const mentoriasPorUsuario = new Map<string, typeof ments[number][]>();
    for (const m of ments ?? []) {
      const lista = mentoriasPorUsuario.get(m.usuario_id) ?? [];
      lista.push(m);
      mentoriasPorUsuario.set(m.usuario_id, lista);
    }

    const alunos = (perfis ?? []).map((perfil) => {
      const app = appsPorUsuario.get(perfil.id);
      const proximas = (mentoriasPorUsuario.get(perfil.id) ?? []).sort((a, b) =>
        (a.agendada_para ?? "").localeCompare(b.agendada_para ?? "")
      );
      return {
        id: perfil.id,
        nome: perfil.nome,
        email: perfil.email,
        avatar_url: perfil.avatar_url,
        criado_em: perfil.criado_em,
        aplicacao: app
          ? {
              status: app.status,
              pronta: app.pronta,
              media_escolar: app.media_escolar,
              escala_media: app.escala_media,
              sat: app.sat,
              toefl: app.toefl,
              ielts: app.ielts,
              precisa_bolsa: app.precisa_bolsa,
              atualizado_em: app.atualizado_em,
              revisada_em: app.revisada_em,
            }
          : null,
        universidades: unisCount.get(perfil.id) ?? 0,
        documentos: docsCount.get(perfil.id) ?? 0,
        proxima_mentoria: proximas[0]?.agendada_para ?? null,
        mentorias_pendentes: proximas.length,
      };
    });

    return NextResponse.json({ alunos });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro inesperado." }, { status: 500 });
  }
}
