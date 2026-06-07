-- Safe first-admin setup via security-definer functions.
-- These are callable with the anon key — no service role key required.

-- Create the first admin account (only works when zero staff rows exist)
create or replace function public.setup_first_admin()
returns json language plpgsql security definer as $$
declare
  v_user_id uuid;
  v_email   text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('error', 'not_authenticated');
  end if;

  if exists (select 1 from public.staff) then
    return json_build_object('error', 'already_setup');
  end if;

  select email into v_email from auth.users where id = v_user_id;

  insert into public.staff (id, email, role)
  values (v_user_id, coalesce(v_email, ''), 'admin');

  return json_build_object('ok', true, 'email', v_email);
end;
$$;

grant execute on function public.setup_first_admin() to anon, authenticated;

-- Check whether any staff row exists (used to conditionally show setup UI)
create or replace function public.staff_exists()
returns boolean language sql security definer as $$
  select exists (select 1 from public.staff)
$$;

grant execute on function public.staff_exists() to anon, authenticated;
