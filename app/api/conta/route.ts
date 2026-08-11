import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const admin = createAdminClient();

  try {
    const { data: objetos } = await admin.storage.from("avatars").list(user.id);
    if (objetos && objetos.length > 0) {
      await admin.storage
        .from("avatars")
        .remove(objetos.map((objeto) => `${user.id}/${objeto.name}`));
    }
  } catch {
    // Se a pasta de avatar não existir, seguimos.
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
