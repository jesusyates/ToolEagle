-- Admin RBAC: email + role on profiles; auto-create profile on signup.

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text not null default 'user';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, plan)
  values (new.id, new.email, 'user', 'free')
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
