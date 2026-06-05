# Modelo de dominio — SCE International

Especificación funcional del MVP. Fuente de verdad del comportamiento; el
código (`src/lib/domain/*`) y la base de datos (`supabase/migrations/*`) deben
mantenerse alineados con este documento.

## Roles

| Rol | `role` | Responsabilidad |
|-----|--------|-----------------|
| Trabajador | `worker` | Crea presupuestos (costo base) y registra gastos en ejecución. |
| Administración | `admin` | Revisa, devuelve, valida y aplica el margen de ganancia. |
| Gerencia (dueño) | `manager` | Aprobación final, envío al cliente, habilita la ejecución. |
| Cliente | — | Sin acceso a la app por ahora; recibe el presupuesto por correo. |

**Alta de usuarios:** por invitación de un admin (no hay auto-registro).

## Pipeline (máquina de estados)

El pipeline **no es arrastrable**: avanza solo por transiciones válidas
disparadas por el rol correspondiente. Cada transición escribe en la bitácora
(`budget_events`) y dispara notificaciones (in-app + correo).

| # | Estado | Quién actúa | Acción → estado siguiente | Notifica a |
|---|--------|-------------|---------------------------|-----------|
| 1 | `draft` | Trabajador | Enviar → `pending_admin_review` | — |
| 2 | `pending_admin_review` | Administración | Validar → `validated_with_margin` · Devolver → `returned_to_worker` | Admin |
| 3 | `returned_to_worker` | Trabajador | Reenviar → `pending_admin_review` | Trabajador |
| 4 | `validated_with_margin` | Administración | Enviar a gerencia → `pending_manager_approval` | — |
| 5 | `pending_manager_approval` | Gerencia | Aprobar → `approved_sent_to_client` · Devolver → `returned_by_manager` | Gerencia |
| 6 | `returned_by_manager` | Administración | Reajustar → `validated_with_margin` | Admin |
| 7 | `approved_sent_to_client` | Gerencia | Marcar aprobación → `client_approved` | — |
| 8 | `client_approved` | Gerencia | Habilitar → `in_execution` | Trabajador |
| 9 | `in_execution` | Trabajador | (registra gastos) · Cerrar → `closed` | Admin (por cada gasto) |
| 10 | `closed` | — | (estado terminal) | — |

## Reglas de negocio clave

### Margen confidencial (dos juegos de números)
- El **trabajador** opera sobre el **costo base** (`budgets.base_total`, suma de
  `budget_items`). **Nunca ve** el margen ni el precio al cliente.
- **Administración** aplica un **% de margen** con cálculo en vivo. Esto vive en
  `budget_pricing` (`margin_pct`, `client_total`), tabla con RLS solo para
  `admin`/`manager`.
- El **precio al cliente** = `base_total × (1 + margin_pct/100)`. Es lo único que
  ve el cliente (en el PDF).

### Moneda
- Cada presupuesto se denomina en **una** moneda: **USD** o **VES** (bolívares).
- **Sin IVA/impuestos por ahora** (muy probable en el futuro; el modelo deja
  espacio). Campo `exchange_rate` opcional para equivalencias futuras.

### Ejecución y gastos
- Tras `in_execution`, el trabajador registra gastos: **monto, factura,
  descripción** y **nota** (opcional). La **factura es un archivo** (foto o PDF)
  en Supabase Storage (bucket `invoices`), con validación de tipo y tamaño.
- El **techo de gasto** es `approved_purchase_amount` (por defecto = costo base,
  **sin** margen).
- **Saldo restante** = `approved_purchase_amount − Σ gastos` (vista
  `budget_balances`). **Puede ser negativo:** no se bloquea. Cuando cruza a
  negativo se envía una **notificación** (a Administración y al trabajador).
  _Futuro:_ podría requerir aprobación.
- Cada gasto notifica a Administración (solo informativo, no requiere aprobación).

### Notificaciones
Toda notificación es **doble**: interna (tabla `notifications`, campana in-app
vía Supabase Realtime) **y** correo (Resend) al email registrado del usuario.

### Documentos
En cada etapa debe poder **descargarse el documento** (PDF). El PDF al cliente
muestra el precio con margen; los documentos internos pueden mostrar el desglose
base. Hay una **plantilla de muestra** (empresa de construcción, remodelación y
jardinería) en `src/lib/pdf/`, descargable en `/api/pdf/demo`; se reemplazará por
el modelo real del cliente.

### Visibilidad y reportes
- El **trabajador** ve **solo sus** presupuestos. **Administración** y
  **Gerencia** ven **todos**, con una vista de **rendimiento por trabajador**.
- **Dashboard de Administración** (solo `admin`): ganancias, ingresos, margen
  promedio y métricas operativas. Se alimenta de las vistas `budget_profit` y
  `budget_balances`.

## Entidades

- **profiles** — usuario + rol (extiende `auth.users`).
- **clients** — cliente final (agrupación; opcional en el MVP).
- **budgets** — presupuesto: estado, costo base, techo de gasto, fechas.
- **budget_items** — líneas del presupuesto (costo base).
- **budget_pricing** — margen y precio al cliente (restringido).
- **expenses** — gastos reales en ejecución.
- **budget_balances** (vista) — gastos totales y saldo restante.
- **notifications** — notificaciones internas + estado de envío de correo.
- **budget_events** — bitácora de auditoría inmutable.

## Decisiones confirmadas (2026-06-05)

1. **Saldo negativo permitido**: no se bloquea; al cruzar a negativo se notifica.
2. **Factura = archivo** (foto o PDF) en Storage, con validación.
3. **Bitácora de auditoría** incluida por defecto (montos antes/después del margen).
4. **PDF**: plantilla de muestra para empresa de construcción/remodelación/
   jardinería (modelo real pendiente de entrega).
5. **Moneda**: USD y VES. Sin IVA por ahora.
6. **Visibilidad**: trabajador solo lo suyo; admin/gerencia todo + dashboard admin.

## Pendiente

- ¿El margen se aplica al **total** o **por línea**?
- **IVA/impuestos** (probable a futuro) y reglas de redondeo.
- **Modelo real** del PDF (logo y campos definitivos del cliente).
- **Evidencia** de la aprobación del cliente (hoy se marca a mano).
