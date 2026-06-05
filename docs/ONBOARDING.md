# Onboarding — Segundo desarrollador

Bienvenido al proyecto **SCE International · Panel de Presupuestos**. Este
documento reúne todo lo que necesitas: **accesos** a solicitar, **contexto** del
proyecto y las **herramientas de IA** que usamos para programar.

> Idioma del proyecto: **español** (UI, comentarios y docs). Mantén ese estándar.

---

## 1. Qué es el proyecto (en 1 minuto)

PWA interna para que una empresa de **construcción, remodelación y jardinería**
gestione el ciclo de vida de sus **presupuestos**: creación → aprobación
multi-rol → ejecución con control de **gastos**, más **notificaciones**
(in-app + correo) y **descarga de PDF** en cada etapa.

- Lo construimos como **agencia/dev** para un **cliente final** (sus requisitos
  mandan).
- A largo plazo: de PWA a **apps nativas** (App Store / Play Store) reutilizando
  el mismo backend.
- Estado actual: **Fase 0 (cimientos) + backend Supabase listo**. Ver
  [ROADMAP.md](ROADMAP.md).

Lee, en este orden, antes de tocar código:
1. [README.md](../README.md) — visión general y arranque.
2. [docs/MODELO-DOMINIO.md](MODELO-DOMINIO.md) — roles, pipeline y reglas de negocio.
3. [AGENTS.md](../AGENTS.md) — convenciones e **invariantes** del código.
4. [docs/ROADMAP.md](ROADMAP.md) — fases.

---

## 2. Accesos que debes solicitar (checklist)

Pídeselos al responsable del proyecto (Fernando). Usa **tu propia cuenta** en
cada servicio; **no se comparten credenciales**.

- [ ] **GitHub** — colaborador con permiso *push* en
  `https://github.com/wfmendez/sceinternational` (owner: `wfmendez`). Trabajamos
  con ramas + Pull Requests (ver §6).
- [ ] **Supabase** — invitación como miembro de la organización **"Fernando
  Mendez"** (que contiene el proyecto **SCEINTERNATIONAL**). Te da acceso al
  dashboard: API keys, SQL Editor, Auth, Storage, Logs, Advisors.
  - _Importante:_ tu cuenta de Supabase debe ser **miembro de esa organización**,
    si no, no verás el proyecto (nos pasó al inicio del proyecto).
- [ ] **Vercel** — acceso al proyecto/equipo de Vercel donde se despliega (cuando
  esté creado). Cada push a `main` despliega; cada PR genera un *preview*.
- [ ] **Resend** — acceso a la cuenta o la API key, cuando activemos los correos
  (Fase 1/2).
- [ ] **Variables de entorno** — pide el valor de `SUPABASE_SERVICE_ROLE_KEY`
  (secreta) o sácala tú del dashboard una vez tengas acceso. Las demás están en
  [.env.example](../.env.example).
- [ ] **Anthropic / Claude Code** — tu propia cuenta para usar el agente de IA
  (ver §9).

### Datos del proyecto Supabase (no secretos)
| Dato | Valor |
|------|-------|
| Nombre | `SCEINTERNATIONAL` |
| Project ref | `jeytiekmuxmhtwjumlty` |
| Organización | "Fernando Mendez" (`kdafnnwluzldmdygejlr`) |
| Región | `us-east-1` |
| API URL | `https://jeytiekmuxmhtwjumlty.supabase.co` |
| Clave publishable (pública, puede rotar) | `sb_publishable_vliGBbp5ZxqDRV7Vyxy9kg_33JifJbz` |

> La `service_role` key y demás secretos **nunca** van al repositorio. Viven en
> `.env.local` (local, ignorado por git) y en las Environment Variables de Vercel.

---

## 3. Stack

| Capa | Tecnología |
|------|-----------|
| Frontend / PWA | **Next.js 16** (App Router) · React 19 · TypeScript · alias `@/* → src/*` |
| UI | **Tailwind v4** (CSS-first, sin `tailwind.config`) · componentes estilo shadcn (`cn` en `src/lib/utils.ts`) |
| Backend | **Supabase** (Postgres 17 · Auth · Realtime · Storage · RLS) |
| Correo | **Resend** + React Email |
| PDF | **@react-pdf/renderer** (server-side) |
| Formularios | React Hook Form + Zod |
| Hosting / CI | **Vercel** · **GitHub Actions** |
| Runtime local | Node ≥ 20 (CI usa Node 22) · npm |

Arquitectura **desacoplada** (frontend ↔ Supabase) para reutilizar el backend en
la futura app nativa.

---

## 4. Mapa del repositorio

```
src/
  app/                    Rutas (App Router)
    page.tsx              Landing (enlaza las vistas de muestra)
    admin/page.tsx        Dashboard de administración (datos de ejemplo aún)
    api/pdf/demo/route.ts Genera el PDF de presupuesto de muestra
  components/ui/          Componentes reutilizables (badge, metric-card, …)
  lib/
    domain/               FUENTE DE VERDAD del dominio
      roles.ts            Roles (worker/admin/manager)
      budget-status.ts    Máquina de estados del pipeline (transiciones)
      currency.ts         Monedas USD/VES
    supabase/             Clientes (client/server) + database.types.ts
    pdf/budget-document.tsx  Plantilla del PDF
    utils.ts              cn() y formatMoney()
  proxy.ts                Refresco de sesión (convención Next 16, antes "middleware")
supabase/
  migrations/             Esquema SQL versionado (0001…); fuente de verdad de la BD
  README.md               Cómo aplicar migraciones / regenerar tipos
docs/                     MODELO-DOMINIO, ROADMAP, ONBOARDING (este archivo)
.github/workflows/ci.yml  CI: lint + typecheck + build
AGENTS.md / CLAUDE.md     Guía para los agentes de IA (CLAUDE.md importa AGENTS.md)
```

---

## 5. Puesta en marcha local

```bash
git clone https://github.com/wfmendez/sceinternational.git
cd sceinternational
npm install

cp .env.example .env.local      # completa los valores (Supabase, Resend)
npm run dev                     # http://localhost:3000
```

Para el `.env.local` necesitas: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (clave publishable), y para trabajo de servidor
`SUPABASE_SERVICE_ROLE_KEY` (secreta, del dashboard).

### Scripts
| Script | Acción |
|--------|--------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier |

**Antes de subir cambios:** `lint`, `typecheck` y `build` en verde.

---

## 6. Flujo de trabajo (git, ahora que somos 2)

- Trabaja en **ramas** (`feat/...`, `fix/...`), abre **Pull Request** a `main`.
- El **CI** (lint + typecheck + build) debe pasar antes de hacer merge.
- Mensajes de commit estilo *conventional* (`feat:`, `fix:`, `chore:`, `docs:`).
- Si usas un agente de IA, añade el trailer de co-autoría al commit
  (ver ejemplos en el historial: `Co-Authored-By: Claude ...`).
- **No** subas `.env.local` ni secretos. **No** edites una migración ya aplicada:
  crea una **nueva** numerada.

---

## 7. Base de datos: cómo trabajar

La fuente de verdad es **`supabase/migrations/`** (archivos `0001…`). El esquema
ya está aplicado al proyecto remoto.

- **Cambiar el esquema** → crea una **nueva** migración `000N_descripcion.sql` y
  aplícala (vía Supabase CLI `supabase db push`, el SQL Editor, o el conector MCP).
- **Tras cada cambio** → regenera los tipos:
  ```bash
  npx supabase gen types typescript --project-id jeytiekmuxmhtwjumlty \
    --schema public > src/lib/supabase/database.types.ts
  ```
- **Revisa seguridad** tras cambios de DDL (Advisors en el dashboard o vía MCP):
  esperamos **0 errores**; hay 2 *warnings* intencionales (ver §8).
- Detalles en [supabase/README.md](../supabase/README.md).

---

## 8. Invariantes que NO se rompen

Estas reglas son el corazón del sistema. Respetarlas siempre (en UI, server
actions y RLS):

1. **Margen confidencial.** El rol `worker` **nunca** ve el margen ni el precio al
   cliente. Ese dato vive en `budget_pricing` (RLS solo para `admin`/`manager`).
2. **Pipeline no arrastrable.** El estado solo cambia por **transiciones válidas**
   (`canTransition` en `budget-status.ts`). Validar **en servidor**, no solo en UI.
3. **Doble notificación.** Cada evento relevante notifica **in-app y por correo**.
4. **Auditoría inmutable.** Las transiciones y cambios de monto se registran en
   `budget_events` (no se edita desde el cliente).
5. **Saldo de gastos** puede ser **negativo** → se notifica el sobregiro.
6. **Seguridad por defecto.** RLS en todas las tablas; las escrituras del sistema
   (notificaciones, bitácora) van por `service_role` **en el servidor**.
7. **Seguridad (advisors):** 2 *warnings* esperados — `authenticated` puede
   ejecutar `is_privileged()` y `current_app_role()`; es **necesario** para la
   RLS. Cualquier otro aviso hay que atenderlo.

---

## 9. Herramientas de IA para código

El proyecto se desarrolla asistido por un agente de IA. Configúralo con **tu
propia cuenta**.

### Claude Code (agente principal)
- **Qué es:** la CLI oficial de Anthropic (también app de escritorio / extensión
  de IDE). Modelo en uso: **Claude Opus 4.8**.
- **Instalación / login:** instala Claude Code y autentícate con tu cuenta de
  Anthropic. Ábrelo **dentro de la carpeta del repo**.
- El agente lee **automáticamente** `AGENTS.md` / `CLAUDE.md` al iniciar: ahí
  están las convenciones e invariantes. Manténlos actualizados cuando cambie algo
  estructural.
- ⚠️ **Next.js 16 tiene cambios de ruptura**: como indica `AGENTS.md`, el agente
  debe consultar los docs en `node_modules/next/dist/docs/` antes de escribir
  código de Next (p. ej. la convención `proxy.ts` reemplazó a `middleware.ts`).

### Conector Supabase (MCP)
- Permite al agente: **listar proyectos, aplicar migraciones, generar tipos,
  ejecutar SQL y correr los Advisors de seguridad** directamente.
- **Conéctalo a tu cuenta de Supabase** que sea **miembro de la organización**
  del proyecto (si no, no verá `SCEINTERNATIONAL`).
- En Claude Code: gestiona los conectores con `/mcp`.

### Skills útiles del agente
- `/code-review` — revisa el diff actual antes de abrir PR.
- `/security-review` — revisión de seguridad (útil tras tocar RLS/DDL).
- `/run` — levanta la app para ver un cambio funcionando.

### Forma de trabajo recomendada con el agente
1. Describe la tarea y deja que lea `AGENTS.md` + los docs relevantes.
2. Que haga los cambios; luego corre `lint` + `typecheck` + `build`.
3. Cambios de BD → **nueva migración** + **regenerar tipos** + Advisors.
4. Commit en una **rama** + PR (CI verde). Añade el trailer de co-autoría.

> Otros conectores pueden estar disponibles en tu entorno (Figma, Notion, etc.),
> pero el **único crítico para este proyecto es Supabase**.

---

## 10. Siguientes pasos del proyecto

Estamos por iniciar la **Fase 1**: autenticación (login), alta de usuarios por
invitación y el flujo trabajador→administración (formulario de presupuesto +
vista de cards) con datos reales. Ver [ROADMAP.md](ROADMAP.md).

**Pendiente con el cliente** (en [MODELO-DOMINIO.md](MODELO-DOMINIO.md)): margen
por total vs. por línea, IVA a futuro, modelo real del PDF y evidencia de
aprobación del cliente.

¿Dudas? Habla con Fernando (responsable del proyecto).
