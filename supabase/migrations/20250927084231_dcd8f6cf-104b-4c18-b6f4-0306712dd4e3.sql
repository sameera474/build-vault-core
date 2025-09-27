-- Enums (if not exist)
do $$ begin
  create type public.side_enum as enum ('left','right','middle');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.material_enum as enum ('soil','concrete','aggregates','asphalt','custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status_enum as enum ('draft','submitted','approved','rejected');
exception when duplicate_object then null; end $$;

-- Template library
create table if not exists public.test_report_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  name text not null,
  material material_enum not null,
  custom_material text,
  test_type text not null,
  standard text,
  road_class text,
  units text default 'SI',
  visibility_roles text[] default '{technician,quality_manager,project_manager}',
  version int not null default 1,
  status text not null default 'draft',
  schema_json jsonb not null,
  rules_json jsonb,
  preview_json jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Extend test_reports for full metadata & template binding
do $$ begin
  alter table public.test_reports
    drop column if exists material,
    drop column if exists side,
    drop column if exists status,
    add column if not exists template_id uuid references public.test_report_templates(id),
    add column if not exists material material_enum,
    add column if not exists custom_material text,
    add column if not exists standard text,
    add column if not exists road_name text,
    add column if not exists chainage_from text,
    add column if not exists chainage_to text,
    add column if not exists side side_enum,
    add column if not exists laboratory_test_no text,
    add column if not exists covered_chainage text,
    add column if not exists road_offset text,
    add column if not exists status report_status_enum default 'draft';
exception when others then null; end $$;

-- Helpful indexes
create index if not exists idx_mcat_company on public.material_categories(company_id);
create index if not exists idx_templates_company on public.test_report_templates(company_id);
create index if not exists idx_templates_material on public.test_report_templates(material, test_type, status);
create index if not exists idx_reports_company on public.test_reports(company_id);
create index if not exists idx_reports_project on public.test_reports(project_id);
create index if not exists idx_reports_status on public.test_reports(status);

-- RLS for templates
alter table public.test_report_templates enable row level security;

-- Drop existing policies if they exist and recreate
drop policy if exists "Templates - Users can view their company templates" on public.test_report_templates;
drop policy if exists "Templates - Users can create templates for their company" on public.test_report_templates;
drop policy if exists "Templates - Users can update their company templates" on public.test_report_templates;
drop policy if exists "Templates - Users can delete their company templates" on public.test_report_templates;

create policy "Templates - Users can view their company templates" on public.test_report_templates
for select using (company_id = (select company_id from public.profiles where user_id = auth.uid()));

create policy "Templates - Users can create templates for their company" on public.test_report_templates
for insert with check (company_id = (select company_id from public.profiles where user_id = auth.uid()));

create policy "Templates - Users can update their company templates" on public.test_report_templates
for update using (company_id = (select company_id from public.profiles where user_id = auth.uid()));

create policy "Templates - Users can delete their company templates" on public.test_report_templates
for delete using (company_id = (select company_id from public.profiles where user_id = auth.uid()));

-- Update triggers
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_templates_touch on public.test_report_templates;
create trigger trg_templates_touch
before update on public.test_report_templates
for each row execute function public.touch_updated_at();