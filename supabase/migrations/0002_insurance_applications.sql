-- Insurance Application Fields
-- Per-policy snapshot of the subscriber + beneficiary details captured at
-- activation. Profiles are never modified; each activation creates one record.

begin;

create table if not exists public.insurance_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  membership_id uuid references public.memberships(id) on delete set null,

  -- Subscriber snapshot
  first_name text not null,
  middle_name text,
  last_name text not null,
  date_of_birth date,
  sex text,
  civil_status text,
  nationality text,
  occupation text,
  email text,
  mobile text,
  gov_id_type text,
  gov_id_number text,

  -- Address snapshot
  address_line text,
  barangay text,
  city text,
  province text,
  postal_code text,

  -- Beneficiary snapshot
  beneficiary_full_name text,
  beneficiary_relationship text,
  beneficiary_mobile text,
  beneficiary_date_of_birth date,

  created_at timestamptz not null default now()
);

create index if not exists insurance_applications_user_idx
  on public.insurance_applications (user_id, created_at desc);

create index if not exists insurance_applications_membership_idx
  on public.insurance_applications (membership_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: members can read and create only their own applications.
-- ---------------------------------------------------------------------------
alter table public.insurance_applications enable row level security;

drop policy if exists "insurance_applications_select_own" on public.insurance_applications;
create policy "insurance_applications_select_own"
  on public.insurance_applications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "insurance_applications_insert_own" on public.insurance_applications;
create policy "insurance_applications_insert_own"
  on public.insurance_applications
  for insert
  to authenticated
  with check (user_id = auth.uid());

commit;
