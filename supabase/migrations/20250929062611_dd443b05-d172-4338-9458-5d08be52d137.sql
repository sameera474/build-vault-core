-- RLS policies for profiles table to support team management

-- Read: user sees own profile; admin sees company profiles
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "profiles read self" on public.profiles;
create policy "profiles read self"
on public.profiles for select
using (auth.uid() = user_id);

drop policy if exists "profiles read company" on public.profiles;
create policy "profiles read company"
on public.profiles for select
using (
  company_id = current_user_company()
  and current_user_role() in ('admin','project_manager','quality_manager')
);

-- Update: user can update self (non-role fields). Admin can update company users (incl. role).
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self"
on public.profiles for update
using (auth.uid() = user_id);

drop policy if exists "profiles update company by admin" on public.profiles;
create policy "profiles update company by admin"
on public.profiles for update
using (
  company_id = current_user_company()
  and current_user_role() = 'admin'
);

-- Insert: users can insert their own profile during signup
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self"
on public.profiles for insert
with check (auth.uid() = user_id);

-- Admin can invite users to their company
drop policy if exists "profiles insert company by admin" on public.profiles;
create policy "profiles insert company by admin"
on public.profiles for insert
with check (
  company_id = current_user_company()
  and current_user_role() = 'admin'
);