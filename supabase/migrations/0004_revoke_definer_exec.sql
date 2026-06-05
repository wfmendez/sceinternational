-- 0004: Quitar EXECUTE de los roles anon/authenticated en funciones definer.
-- En 0002 se revocó de PUBLIC, pero Supabase concede EXECUTE explícito a anon y
-- authenticated mediante default privileges; hay que revocar de esos roles.

-- Funciones de trigger: no se invocan vía RPC (los triggers se disparan igual).
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.prevent_role_escalation() from anon, authenticated;

-- Helpers de RLS: quitar a anon; authenticated los necesita para las policies.
revoke execute on function public.current_app_role() from anon;
revoke execute on function public.is_privileged() from anon;
