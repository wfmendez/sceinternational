# Roadmap del MVP — SCE International

Cada fase es desplegable. La arquitectura desacopla frontend (Next.js/PWA) de
backend (Supabase) para reutilizar el mismo backend en la futura app nativa.

## Fase 0 — Cimientos ✅ (en curso)
- Scaffolding Next.js + TypeScript + Tailwind, repo en GitHub.
- Clientes de Supabase (navegador/servidor/middleware).
- Esquema de base de datos con RLS, auditoría y notificaciones.
- Capa de dominio (roles + máquina de estados del pipeline).
- CI (lint + typecheck + build), PWA manifest, documentación.
- **Muestras tempranas:** PDF de presupuesto (`/api/pdf/demo`) y dashboard de
  administración con datos de ejemplo (`/admin`).
- **Pendiente de infra:** provisionar Supabase, conectar Vercel, configurar
  variables de entorno y Resend.

## Fase 1 — Flujo trabajador → administración
- Autenticación (login) y gestión de usuarios por invitación.
- Layout del panel + control de acceso por rol (middleware).
- Formulario de presupuesto (ítems, costo base) con borrador/enviar.
- Vista catálogo (cards con estado a primera vista) + detalle.
- Revisión de administración: validar / devolver con comentario.
- Notificaciones in-app (Realtime) + correo (Resend).

## Fase 2 — Margen y aprobación de gerencia
- Input de % de margen con **cálculo en vivo** (precio al cliente).
- Aprobación de gerencia (aprobar / devolver).
- Generación y **descarga de PDF** del presupuesto.
- Envío al cliente por correo; marca de aprobación del cliente.

## Fase 3 — Ejecución y gastos
- Habilitar ejecución; sección de gastos del trabajador.
- Registro de gastos (monto, factura/archivo, descripción, nota).
- Consolidación de **saldo restante** en vivo.
- Notificación a administración por cada gasto + bitácora.

## Fase 4 — Pulido PWA y operación
- Service worker (instalable, offline básico) con Serwist.
- Iconos PWA, dashboards y reportes básicos.
- Búsqueda y filtros de presupuestos.

## Futuro (post-MVP)
- App nativa con Expo / React Native sobre el mismo Supabase → App Store y
  Play Store.
- Portal de cliente y/o firma electrónica.
- Reportería avanzada (márgenes, gastos por trabajador/cliente).
