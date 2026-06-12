import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Cliente con service_role. Solo usar en server actions/route handlers.
 * Nunca exponer al navegador. Requiere SUPABASE_SERVICE_ROLE_KEY en el entorno.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY no configurada. Agrégala en .env.local y en Vercel.",
    );
  }

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
