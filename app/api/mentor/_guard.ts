import { createClient } from "@/lib/supabase/server";
import { isMentorEmail } from "@/lib/mentor";

export async function requireMentor(): Promise<{ mentorId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isMentorEmail(user.email)) return null;
  return { mentorId: user.id };
}
