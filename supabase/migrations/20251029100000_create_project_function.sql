
create or replace function public.create_new_project(
    p_name text,
    p_contract_number text,
    p_contractor_name text,
    p_client_name text,
    p_consultant_name text,
    p_project_prefix text,
    p_region_code text,
    p_lab_code text
)
returns projects
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_role text;
  v_company_id uuid;
  v_new_project projects;
begin
  -- Get user's role and company_id from the profiles table
  select role, company_id into v_user_role, v_company_id
  from public.profiles
  where user_id = v_user_id;

  -- Check if user has permission to create a project
  -- You can adjust these roles as needed.
  if v_user_role not in ('admin', 'project_manager') then
    raise exception 'You do not have permission to create a new project.';
  end if;

  -- If permission check passes, insert the new project
  insert into public.projects (
    name,
    contract_number,
    contractor_name,
    client_name,
    consultant_name,
    project_prefix,
    region_code,
    lab_code,
    company_id,
    created_by,
    status
  )
  values (
    p_name,
    p_contract_number,
    p_contractor_name,
    p_client_name,
    p_consultant_name,
    p_project_prefix,
    p_region_code,
    p_lab_code,
    v_company_id,
    v_user_id,
    'in_progress' -- Default status
  )
  returning * into v_new_project;

  return v_new_project;
end;
$$ language plpgsql security definer;

-- Grant execute permission on the function to authenticated users
grant execute on function public.create_new_project(text, text, text, text, text, text, text, text) to authenticated;
