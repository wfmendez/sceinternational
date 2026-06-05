-- ===========================================================================
-- SCE International — Esquema inicial (Fase 0)
--
-- Panel de presupuestos: usuarios/roles, presupuestos, ítems, margen, gastos,
-- notificaciones y bitácora de auditoría.
--
-- SEGURIDAD: Row Level Security (RLS) activa en todas las tablas. El margen de
-- ganancia vive en una tabla aparte (`budget_pricing`) accesible SOLO para
-- Administración y Gerencia: el trabajador nunca ve el margen ni el precio al
-- cliente.
--
-- Aplicar con:  supabase db push   (o pegando este archivo en el SQL Editor).
-- ===========================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Tipos enumerados (sincronizar con src/lib/domain/* y database.types.ts)
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('worker', 'admin', 'manager');

create type public.budget_status as enum (
  'draft',
  'pending_admin_review',
  'returned_to_worker',
  'validated_with_margin',
  'pending_manager_approval',
  'returned_by_manager',
  'approved_sent_to_client',
  'client_approved',
  'in_execution',
  'closed'
);

create type public.notification_type as enum (
  'budget_submitted',
  'budget_returned',
  'budget_validated',
  'budget_approved',
  'client_approved',
  'execution_enabled',
  'expense_logged'
);

create type public.budget_event_type as enum (
  'status_change',
  'margin_applied',
  'expense_logged',
  'comment'
);

-- ---------------------------------------------------------------------------
-- Utilidad: mantener updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: extiende auth.users con rol y datos de perfil
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text not null default '',
  role       public.user_role not null default 'worker',
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Helpers de rol. SECURITY DEFINER para leer profiles sin disparar la RLS de
-- profiles (evita recursión infinita en las policies).
create or replace function public.current_app_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_privileged()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select role in ('admin', 'manager') from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Alta automática de perfil al crear el usuario en auth.users (invitación admin)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'worker')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Impide que un usuario no privilegiado cambie su propio rol
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if (new.role is distinct from old.role) and not public.is_privileged() then
    raise exception 'No autorizado para cambiar el rol';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

alter table public.profiles enable row level security;

create policy "profiles: ver propio o privilegiado"
  on public.profiles for select
  using (id = auth.uid() or public.is_privileged());

create policy "profiles: actualizar propio o privilegiado"
  on public.profiles for update
  using (id = auth.uid() or public.is_privileged())
  with check (id = auth.uid() or public.is_privileged());
-- INSERT lo hace el trigger handle_new_user (SECURITY DEFINER). El alta real
-- de usuarios se hace invitando desde Supabase Auth (panel de admin).

-- ---------------------------------------------------------------------------
-- clients: cliente final (agrupación para escalar; opcional en el MVP)
-- ---------------------------------------------------------------------------
create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  contact_name  text,
  contact_email text,
  phone         text,
  created_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "clients: lectura autenticada"
  on public.clients for select
  using (auth.uid() is not null);

create policy "clients: gestiona privilegiado"
  on public.clients for all
  using (public.is_privileged())
  with check (public.is_privileged());

-- ---------------------------------------------------------------------------
-- budgets: presupuesto (núcleo del pipeline)
-- ---------------------------------------------------------------------------
create sequence if not exists public.budget_code_seq;

create table public.budgets (
  id                       uuid primary key default gen_random_uuid(),
  code                     text unique,
  title                    text not null,
  description              text,
  status                   public.budget_status not null default 'draft',
  created_by               uuid not null references public.profiles (id),
  client_id                uuid references public.clients (id),
  currency                 text not null default 'USD',
  -- Costo base (dominio del trabajador): suma de los ítems.
  base_total               numeric(14, 2) not null default 0,
  -- Techo de gasto aprobado para la ejecución (por defecto = costo base).
  approved_purchase_amount numeric(14, 2),
  submitted_at             timestamptz,
  validated_at             timestamptz,
  manager_approved_at      timestamptz,
  client_approved_at       timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index budgets_created_by_idx on public.budgets (created_by);
create index budgets_status_idx on public.budgets (status);

create trigger trg_budgets_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

-- Código legible PRE-AAAA-NNNN
create or replace function public.set_budget_code()
returns trigger language plpgsql
as $$
begin
  if new.code is null then
    new.code := 'PRE-' || to_char(now(), 'YYYY') || '-' ||
                lpad(nextval('public.budget_code_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger trg_set_budget_code
  before insert on public.budgets
  for each row execute function public.set_budget_code();

alter table public.budgets enable row level security;

create policy "budgets: ver propio o privilegiado"
  on public.budgets for select
  using (created_by = auth.uid() or public.is_privileged());

create policy "budgets: crear propio en borrador"
  on public.budgets for insert
  with check (created_by = auth.uid() and status = 'draft');

create policy "budgets: editar propio mientras es editable"
  on public.budgets for update
  using (
    public.is_privileged()
    or (created_by = auth.uid() and status in ('draft', 'returned_to_worker'))
  )
  with check (
    public.is_privileged()
    or (
      created_by = auth.uid()
      and status in ('draft', 'returned_to_worker', 'pending_admin_review')
    )
  );

create policy "budgets: borrar propio borrador"
  on public.budgets for delete
  using (public.is_privileged() or (created_by = auth.uid() and status = 'draft'));

-- ---------------------------------------------------------------------------
-- budget_items: líneas del presupuesto (costos base, dominio del trabajador)
-- ---------------------------------------------------------------------------
create table public.budget_items (
  id          uuid primary key default gen_random_uuid(),
  budget_id   uuid not null references public.budgets (id) on delete cascade,
  description text not null,
  quantity    numeric(14, 2) not null default 1,
  unit        text,
  unit_cost   numeric(14, 2) not null default 0,
  line_total  numeric(14, 2) generated always as (quantity * unit_cost) stored,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index budget_items_budget_id_idx on public.budget_items (budget_id);

alter table public.budget_items enable row level security;

create policy "budget_items: ver según presupuesto"
  on public.budget_items for select
  using (
    exists (
      select 1 from public.budgets b
      where b.id = budget_id
        and (b.created_by = auth.uid() or public.is_privileged())
    )
  );

create policy "budget_items: editar según presupuesto"
  on public.budget_items for all
  using (
    public.is_privileged()
    or exists (
      select 1 from public.budgets b
      where b.id = budget_id
        and b.created_by = auth.uid()
        and b.status in ('draft', 'returned_to_worker')
    )
  )
  with check (
    public.is_privileged()
    or exists (
      select 1 from public.budgets b
      where b.id = budget_id
        and b.created_by = auth.uid()
        and b.status in ('draft', 'returned_to_worker')
    )
  );

-- ---------------------------------------------------------------------------
-- budget_pricing: margen y precio al cliente. SOLO admin/gerencia.
-- El trabajador no tiene policy => no puede leer ni escribir (margen oculto).
-- ---------------------------------------------------------------------------
create table public.budget_pricing (
  budget_id    uuid primary key references public.budgets (id) on delete cascade,
  margin_pct   numeric(6, 3) not null default 0,   -- 20.000 = 20%
  client_total numeric(14, 2) not null default 0,  -- base_total * (1 + margin/100)
  updated_by   uuid references public.profiles (id),
  updated_at   timestamptz not null default now()
);

create trigger trg_budget_pricing_updated_at
  before update on public.budget_pricing
  for each row execute function public.set_updated_at();

alter table public.budget_pricing enable row level security;

create policy "budget_pricing: solo privilegiado"
  on public.budget_pricing for all
  using (public.is_privileged())
  with check (public.is_privileged());

-- ---------------------------------------------------------------------------
-- expenses: gastos reales registrados en ejecución (dominio del trabajador)
-- ---------------------------------------------------------------------------
create table public.expenses (
  id                uuid primary key default gen_random_uuid(),
  budget_id         uuid not null references public.budgets (id) on delete cascade,
  amount            numeric(14, 2) not null check (amount > 0),
  invoice_ref       text,  -- número/referencia de factura
  invoice_file_path text,  -- ruta en Supabase Storage (bucket "invoices")
  description       text not null,
  note              text,  -- nota opcional
  created_by        uuid not null references public.profiles (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index expenses_budget_id_idx on public.expenses (budget_id);

create trigger trg_expenses_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

alter table public.expenses enable row level security;

create policy "expenses: ver según presupuesto"
  on public.expenses for select
  using (
    exists (
      select 1 from public.budgets b
      where b.id = budget_id
        and (b.created_by = auth.uid() or public.is_privileged())
    )
  );

create policy "expenses: registrar en ejecución"
  on public.expenses for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.budgets b
      where b.id = budget_id
        and b.created_by = auth.uid()
        and b.status = 'in_execution'
    )
  );

create policy "expenses: editar propio o privilegiado"
  on public.expenses for update
  using (public.is_privileged() or created_by = auth.uid())
  with check (public.is_privileged() or created_by = auth.uid());

create policy "expenses: borrar propio o privilegiado"
  on public.expenses for delete
  using (public.is_privileged() or created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- budget_balances: consolidación de gastos y saldo restante
-- security_invoker => respeta la RLS de quien consulta.
-- ---------------------------------------------------------------------------
create view public.budget_balances
with (security_invoker = on) as
select
  b.id                       as budget_id,
  b.approved_purchase_amount,
  coalesce(sum(e.amount), 0) as total_expenses,
  coalesce(b.approved_purchase_amount, 0) - coalesce(sum(e.amount), 0) as remaining_amount
from public.budgets b
left join public.expenses e on e.budget_id = b.id
group by b.id;

-- ---------------------------------------------------------------------------
-- notifications: notificaciones internas (la copia por email la envía la app)
-- ---------------------------------------------------------------------------
create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  budget_id    uuid references public.budgets (id) on delete cascade,
  type         public.notification_type not null,
  title        text not null,
  body         text,
  is_read      boolean not null default false,
  email_sent   boolean not null default false,
  created_at   timestamptz not null default now()
);

create index notifications_recipient_idx on public.notifications (recipient_id, is_read);

alter table public.notifications enable row level security;

create policy "notifications: ver propias"
  on public.notifications for select
  using (recipient_id = auth.uid());

create policy "notifications: marcar propias"
  on public.notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
-- Las notificaciones del sistema se crean desde server actions con la service
-- role key (omite RLS). No se expone INSERT a los clientes.

-- ---------------------------------------------------------------------------
-- budget_events: bitácora de auditoría (inmutable desde el cliente)
-- ---------------------------------------------------------------------------
create table public.budget_events (
  id          uuid primary key default gen_random_uuid(),
  budget_id   uuid not null references public.budgets (id) on delete cascade,
  actor_id    uuid references public.profiles (id),
  event_type  public.budget_event_type not null,
  from_status public.budget_status,
  to_status   public.budget_status,
  comment     text,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

create index budget_events_budget_id_idx on public.budget_events (budget_id, created_at);

alter table public.budget_events enable row level security;

create policy "budget_events: ver según presupuesto"
  on public.budget_events for select
  using (
    public.is_privileged()
    or exists (
      select 1 from public.budgets b
      where b.id = budget_id and b.created_by = auth.uid()
    )
  );

create policy "budget_events: insertar sobre presupuesto accesible"
  on public.budget_events for insert
  with check (
    actor_id = auth.uid()
    and exists (
      select 1 from public.budgets b
      where b.id = budget_id
        and (b.created_by = auth.uid() or public.is_privileged())
    )
  );
-- Sin policies de UPDATE/DELETE => la bitácora no se altera desde el cliente.

-- ---------------------------------------------------------------------------
-- Permisos para los roles de Supabase (la RLS sigue restringiendo por fila)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.budget_balances to authenticated;
grant usage, select on all sequences in schema public to authenticated;
