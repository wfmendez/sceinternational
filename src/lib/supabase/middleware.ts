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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/pdf/demo") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/manifest");

  // Sin sesión → redirigir a /login (excepto rutas públicas)
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Con sesión → redirigir desde /login al panel
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/panel/presupuestos";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
