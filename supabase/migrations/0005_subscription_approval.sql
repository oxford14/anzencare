-- Subscription Admin Review
-- Turns plan activation into an admin-reviewed flow. Members submit a pending
-- insurance_applications row (with KYC image paths); a super admin approves
-- (issuing membership + beneficiary + kyc_documents + virtual ID) or rejects
-- with a reason. Safe to run multiple times.

begin;

-- ---------------------------------------------------------------------------
-- 1. Applications table (create if the earlier migration never ran) + review
--    columns added idempotently.
-- ---------------------------------------------------------------------------
create table if not exists public.insurance_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  membership_id uuid references public.memberships(id) on delete set null,

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

  address_line text,
  barangay text,
  city text,
  province text,
  postal_code text,

  beneficiary_full_name text,
  beneficiary_relationship text,
  beneficiary_mobile text,
  beneficiary_date_of_birth date,

  created_at timestamptz not null default now()
);

alter table public.insurance_applications
  add column if not exists product_id uuid references public.insurance_products(id),
  add column if not exists status text not null default 'pending',
  add column if not exists gov_id_path text,
  add column if not exists selfie_path text,
  add column if not exists review_notes text,
  add column if not exists reviewed_by uuid references public.profiles(id),
  add column if not exists reviewed_at timestamptz;

create index if not exists insurance_applications_user_idx
  on public.insurance_applications (user_id, created_at desc);
create index if not exists insurance_applications_membership_idx
  on public.insurance_applications (membership_id);
create index if not exists insurance_applications_status_idx
  on public.insurance_applications (status, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. RLS: members read/create their own (insert restricted to pending);
--    super admins can read everything. Writes to other states go via RPCs.
-- ---------------------------------------------------------------------------
alter table public.insurance_applications enable row level security;

drop policy if exists "insurance_applications_select_own" on public.insurance_applications;
create policy "insurance_applications_select_own"
  on public.insurance_applications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "insurance_applications_superadmin_select" on public.insurance_applications;
create policy "insurance_applications_superadmin_select"
  on public.insurance_applications
  for select
  to authenticated
  using (public.is_super_admin());

drop policy if exists "insurance_applications_insert_own" on public.insurance_applications;
create policy "insurance_applications_insert_own"
  on public.insurance_applications
  for insert
  to authenticated
  with check (user_id = auth.uid() and status = 'pending');

-- ---------------------------------------------------------------------------
-- 3. Storage: let super admins read KYC objects so the review screen can
--    generate signed URLs for the private "kyc" bucket.
-- ---------------------------------------------------------------------------
drop policy if exists "kyc_superadmin_read" on storage.objects;
create policy "kyc_superadmin_read"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'kyc' and public.is_super_admin());

-- ---------------------------------------------------------------------------
-- 4. Approve: issue the policy for the applicant.
-- ---------------------------------------------------------------------------
create or replace function public.admin_approve_application(p_application_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.insurance_applications;
  v_product public.insurance_products;
  v_membership_id uuid;
  v_member_id text;
  v_alphabet constant text := '0123456789';
  v_i int;
begin
  if not public.is_super_admin() then
    raise exception 'Not authorized';
  end if;

  select * into v_app
  from public.insurance_applications
  where id = p_application_id
  for update;
  if not found then
    raise exception 'Application not found';
  end if;
  if v_app.status <> 'pending' then
    raise exception 'Application is not pending';
  end if;

  select * into v_product
  from public.insurance_products
  where id = v_app.product_id;
  if not found then
    raise exception 'Insurance product not found';
  end if;

  -- Create the active membership (fires the referral commission trigger).
  insert into public.memberships (user_id, product_id, status, start_date, expiry_date)
  values (
    v_app.user_id,
    v_app.product_id,
    'active',
    now()::date,
    (now() + make_interval(months => coalesce(v_product.term_months, 12)))::date
  )
  returning id into v_membership_id;

  -- Beneficiary snapshot.
  if coalesce(v_app.beneficiary_full_name, '') <> '' then
    insert into public.beneficiaries (user_id, membership_id, full_name, relationship, mobile_number)
    values (
      v_app.user_id,
      v_membership_id,
      v_app.beneficiary_full_name,
      v_app.beneficiary_relationship,
      v_app.beneficiary_mobile
    );
  end if;

  -- KYC documents.
  if coalesce(v_app.gov_id_path, '') <> '' then
    insert into public.kyc_documents (user_id, membership_id, doc_type, storage_path)
    values (v_app.user_id, v_membership_id, 'government_id', v_app.gov_id_path);
  end if;
  if coalesce(v_app.selfie_path, '') <> '' then
    insert into public.kyc_documents (user_id, membership_id, doc_type, storage_path)
    values (v_app.user_id, v_membership_id, 'selfie', v_app.selfie_path);
  end if;

  -- Unique member ID for the virtual card.
  loop
    v_member_id := 'AC';
    for v_i in 1..10 loop
      v_member_id := v_member_id || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    exit when not exists (
      select 1 from public.virtual_ids where member_id = v_member_id
    );
  end loop;

  insert into public.virtual_ids (user_id, membership_id, member_id, status, issued_at, expiry_date)
  values (
    v_app.user_id,
    v_membership_id,
    v_member_id,
    'active',
    now(),
    (now() + make_interval(months => coalesce(v_product.term_months, 12)))::date
  );

  update public.insurance_applications
  set status = 'approved',
      membership_id = v_membership_id,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_application_id;

  return json_build_object(
    'membership_id', v_membership_id,
    'member_id', v_member_id
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Reject: record a reason (member can re-submit a new application).
-- ---------------------------------------------------------------------------
create or replace function public.admin_reject_application(
  p_application_id uuid,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.insurance_applications;
begin
  if not public.is_super_admin() then
    raise exception 'Not authorized';
  end if;

  select * into v_app
  from public.insurance_applications
  where id = p_application_id
  for update;
  if not found then
    raise exception 'Application not found';
  end if;
  if v_app.status <> 'pending' then
    raise exception 'Application is not pending';
  end if;

  update public.insurance_applications
  set status = 'rejected',
      review_notes = p_notes,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_application_id;
end;
$$;

grant execute on function public.admin_approve_application(uuid) to authenticated;
grant execute on function public.admin_reject_application(uuid, text) to authenticated;

commit;
