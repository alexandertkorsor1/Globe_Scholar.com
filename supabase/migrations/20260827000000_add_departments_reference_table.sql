create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists departments_name_lower_idx
on public.departments (lower(name));

insert into public.departments (name, code, description, sort_order)
values
  ('admin', 'ADMIN', 'System administration and platform oversight', 10),
  ('marketing', 'MKT', 'Marketing and lead generation', 20),
  ('admissions', 'ADM', 'Admissions and university applications', 30),
  ('counseling', 'COUNSEL', 'Student counseling and guidance', 40),
  ('data_applications', 'DATA', 'Data and application processing', 50),
  ('operations', 'OPS', 'Operations and workflow coordination', 60),
  ('finance', 'FIN', 'Finance and payment management', 70),
  ('country_directors', 'COUNTRY', 'Country-level management and oversight', 80),
  ('management', 'MGMT', 'Management and organizational oversight', 90),
  ('institutional_relations', 'IR', 'Institutional and partner relations', 100),
  ('human_resources', 'HR', 'Human resources and staff management', 110)
on conflict (name) do update set
  code = excluded.code,
  description = excluded.description,
  is_active = true,
  sort_order = excluded.sort_order,
  updated_at = now();

alter table public.departments enable row level security;

drop policy if exists departments_authenticated_select
on public.departments;

create policy departments_authenticated_select
on public.departments
for select
to authenticated
using (is_active = true or is_report_admin());

drop policy if exists departments_admin_manage
on public.departments;

create policy departments_admin_manage
on public.departments
for all
to authenticated
using (is_report_admin())
with check (is_report_admin());

grant select on public.departments to authenticated;

grant insert, update, delete
on public.departments
to authenticated;
