<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SCE International — Panel de Presupuestos

PWA interna para gestionar el ciclo de vida de presupuestos (creación →
aprobación → ejecución/gastos) de una empresa, con notificaciones y descarga de
documentos.

## Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript** · alias `@/* → src/*`
- **Tailwind v4** (CSS-first, sin `tailwind.config`) · UI estilo shadcn (`cn` en `src/lib/utils.ts`)
- **Supabase** (Postgres + Auth + Realtime + Storage + RLS) — backend
- **Resend** — correos transaccionales
- **Vercel** — hosting · **GitHub Actions** — CI

## Mapa del repo
- `src/lib/domain/` — **fuente de verdad** del dominio: roles y máquina de
  estados del pipeline (`budget-status.ts`). La UI y las server actions deben
  validar contra `BUDGET_TRANSITIONS`.
- `src/lib/supabase/` — clientes (`client` navegador, `server` RSC/actions,
  `middleware` refresco de sesión) y `database.types.ts` (regenerar tras migrar).
- `supabase/migrations/` — esquema SQL con RLS. Toda evolución del modelo va
  como nueva migración numerada.
- `docs/MODELO-DOMINIO.md` — especificación funcional. `docs/ROADMAP.md` — fases.

## Invariantes que NO se rompen
- **Margen confidencial:** el trabajador (`worker`) nunca ve el margen ni el
  precio al cliente. Ese dato vive en `budget_pricing`, con RLS solo para
  `admin`/`manager`. No exponer esos campos en queries/UI del trabajador.
- **Pipeline no arrastrable:** el estado solo cambia por transiciones válidas
  (`canTransition`). Validar siempre en servidor, no solo en UI.
- **Doble notificación:** cada evento relevante notifica in-app **y** por correo.
- **Auditoría:** las transiciones y cambios de monto se registran en
  `budget_events` (inmutable desde el cliente).
- **Seguridad por defecto:** RLS en todas las tablas. Las escrituras del sistema
  (notificaciones, bitácora) van por `service_role` en el servidor.

## Comandos
```bash
npm run dev        # desarrollo
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run build      # build de producción
```
Antes de dar por terminado un cambio: `lint`, `typecheck` y `build` en verde.

## Idioma
La UI y la documentación están en **español**. Mantener ese estándar.
