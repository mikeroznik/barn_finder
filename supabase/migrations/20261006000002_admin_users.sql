-- =============================================================================
-- Barn Finder — admin user list (emails live in auth.users, which the app
-- can't read directly). Run after 20261006000001_schema.sql.
-- =============================================================================

create function public.admin_list_users()
returns table (
  id                 uuid,
  display_name       text,
  email              text,
  is_admin           boolean,
  created_at         timestamptz,
  email_confirmed_at timestamptz,
  last_sign_in_at    timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can list users';
  end if;
  return query
    select p.id, p.display_name, u.email::text, p.is_admin, p.created_at, u.email_confirmed_at, u.last_sign_in_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_list_users() from public, anon;
grant  execute on function public.admin_list_users() to authenticated;
