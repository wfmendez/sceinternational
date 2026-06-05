-- 0003: Bucket privado de Storage para las facturas de los gastos (foto/PDF).

insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- Cada usuario gestiona sus propios archivos; admin/gerencia pueden leerlos.
create policy "invoices: leer propios o privilegiado"
  on storage.objects for select to authenticated
  using (bucket_id = 'invoices' and (owner = auth.uid() or public.is_privileged()));

create policy "invoices: subir propios"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'invoices' and owner = auth.uid());

create policy "invoices: actualizar propios"
  on storage.objects for update to authenticated
  using (bucket_id = 'invoices' and owner = auth.uid());

create policy "invoices: borrar propios o privilegiado"
  on storage.objects for delete to authenticated
  using (bucket_id = 'invoices' and (owner = auth.uid() or public.is_privileged()));
