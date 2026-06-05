-- 0002: Endurecimiento de funciones (resuelve advisors de seguridad)

-- 1) Fijar search_path en las funciones que faltaban (lint 0011)
alter function public.set_updated_at() set search_path = '';
alter function public.set_budget_code() set search_path = '';

-- 2) Funciones de trigger: no deben exponerse como RPC (lint 0028/0029).
--    Los triggers se disparan igual aunque se revoque EXECUTE.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.prevent_role_escalation() from public;

-- 3) Helpers usados en RLS: accesibles solo por `authenticated` (no anónimos).
--    `authenticated` necesita EXECUTE para evaluar las policies.
revoke execute on function public.current_app_role() from public;
grant execute on function public.current_app_role() to authenticated;
revoke execute on function public.is_privileged() from public;
grant execute on function public.is_privileged() to authenticated;
