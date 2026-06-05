# SCE International · Panel de Presupuestos

PWA interna para crear, aprobar y ejecutar **presupuestos**, con control de
**gastos** en tiempo real, **notificaciones** (in-app + correo) y **descarga de
documentos**. Pensada para escalar y, a futuro, llevarse a app nativa.

> Estado: **Fase 0 — Cimientos**. Ver [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend / PWA | Next.js 16 (App Router) · React 19 · TypeScript |
| UI | Tailwind v4 · componentes estilo shadcn/ui |
| Backend | Supabase (Postgres · Auth · Realtime · Storage · RLS) |
| Correo | Resend |
| Hosting / CI | Vercel · GitHub Actions |

Arquitectura desacoplada (frontend ↔ Supabase) para reutilizar el mismo backend
en la futura app nativa (Expo / React Native).

## Documentación

- [`docs/MODELO-DOMINIO.md`](docs/MODELO-DOMINIO.md) — roles, pipeline y reglas de negocio.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — fases del MVP.
- [`supabase/README.md`](supabase/README.md) — cómo aplicar el esquema.
- [`AGENTS.md`](AGENTS.md) — convenciones e invariantes del código.

## Puesta en marcha (local)

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env.local   # y completar los valores (Supabase, Resend)

# 3. Base de datos (ver supabase/README.md)
supabase link --project-ref <PROJECT_REF>
supabase db push

# 4. Desarrollo
npm run dev                  # http://localhost:3000
```

### Scripts

| Script | Acción |
|--------|--------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier |

## Despliegue

1. **Supabase** — crear proyecto, aplicar `supabase/migrations/0001_init.sql`,
   crear el bucket `invoices` y activar Auth por email. Ver
   [`supabase/README.md`](supabase/README.md).
2. **Vercel** — importar este repo de GitHub. Configurar las variables de
   entorno (las de `.env.example`). Cada push a `main` despliega; cada PR genera
   un _preview_.
3. **Resend** — verificar el dominio de envío y crear la API key.

## Seguridad

Row Level Security en todas las tablas. El **margen de ganancia** es visible solo
para Administración y Gerencia (nunca para el trabajador). Las claves de servicio
solo se usan en el servidor. No subir `.env.local` al repositorio.
