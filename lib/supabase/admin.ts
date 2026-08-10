import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente com a service_role key — só para rotas de servidor
// (checkout, webhook, backup). Nunca usar em componentes client.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
