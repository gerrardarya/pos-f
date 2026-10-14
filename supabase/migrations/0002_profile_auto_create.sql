-- Auto-create a profiles row whenever a new auth user is created, so
-- "Authentication -> Add user" in the dashboard (or the future in-app staff
-- creation flow) never leaves a user without a profile. Defaults to 'staff';
-- bump the role to 'admin' manually for your bootstrap account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, name)
  values (
    new.id,
    'staff',
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any auth users created before this trigger existed.
insert into public.profiles (id, role, name)
select
  u.id,
  'staff',
  coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
