-- Create a security definer function to check admin role without causing RLS recursion
create or replace function public.has_admin_role(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = _user_id and role = 'admin'
  );
$$;

-- Replace recursive policies on profiles
drop policy if exists "Admins can manage all profiles" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

create policy "Admins can manage all profiles"
on public.profiles
for all
using (public.has_admin_role(auth.uid()))
with check (public.has_admin_role(auth.uid()));

create policy "Admins can view all profiles"
on public.profiles
for select
using (public.has_admin_role(auth.uid()));