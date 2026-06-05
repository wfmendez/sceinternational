import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./database.types";

/**
 * Refresca la sesión de Supabase en cada petición (necesario para que los
 * Server Components vean un usuario autenticado).
 *
 * Si aún no hay variables de entorno de Supabase configuradas (p. ej. en un
 * primer despliegue antes de provisionar la infraestructura), no hace nada:
 * la app sigue sirviendo páginas públicas sin romperse.
 */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // No insertar lógica entre createServerClient y getUser(): evita cierres de
  // sesión difíciles de depurar.
  await supabase.auth.getUser();

  // La protección de rutas (redirigir a /login a los no autenticados) se
  // añadirá en la Fase 1, cuando existan las páginas de autenticación.

  return supabaseResponse;
}
