import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

// Convención de Next.js 16 (sustituye a `middleware.ts`). Refresca la sesión de
// Supabase en cada petición antes de renderizar las rutas.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todas las rutas excepto:
     * - _next/static, _next/image (assets de Next)
     * - favicon, manifest e imágenes estáticas
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
