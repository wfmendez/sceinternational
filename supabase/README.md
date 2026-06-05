# Supabase — SCE International

Backend del proyecto: Postgres + Auth + Realtime + Storage + RLS.

## Aplicar el esquema

El esquema inicial está en [`migrations/0001_init.sql`](./migrations/0001_init.sql).

**Opción A — Supabase CLI (recomendada)**

```bash
# 1. Instalar la CLI:  https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push
```

**Opción B — SQL Editor**

Copiar el contenido de `migrations/0001_init.sql` y ejecutarlo en
_Dashboard → SQL Editor_.

## Después de migrar

1. **Regenerar los tipos de TypeScript:**
   ```bash
   npx supabase gen types typescript --project-id <PROJECT_ID> \
     --schema public > src/lib/supabase/database.types.ts
   ```
2. **Crear el bucket de Storage** `invoices` (privado) para los archivos de
   factura de los gastos, y añadir sus policies de acceso.
3. **Auth:** activar el proveedor _Email_ y configurar el SMTP (o usar Resend).
   El alta de usuarios se hace **invitando** desde _Authentication → Users_;
   el trigger `handle_new_user` crea el perfil automáticamente. El rol se pasa
   en el `user_metadata` (`role`: `worker` | `admin` | `manager`); por defecto
   `worker`.

## Notas de seguridad

- **RLS activa** en todas las tablas. La clave `anon` solo puede lo que las
  policies permiten.
- El **margen de ganancia** (`budget_pricing`) es accesible solo para
  `admin`/`manager`. El trabajador no tiene policy sobre esa tabla.
- Las **notificaciones del sistema** y la **bitácora** se escriben desde el
  servidor con la `service_role` key (nunca en el cliente).
