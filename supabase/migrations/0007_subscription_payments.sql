-- Subscription payments
-- Charges the plan price to the member's wallet at submit time (held while
-- pending), finalizes the charge on approval, and refunds the wallet on denial.
-- Safe to run multiple times.

begin;

-- ---------------------------------------------------------------------------
-- 1. Track the charged amount + the wallet transaction on each application.
-- ---------------------------------------------------------------------------
alter table public.insurance_applications
  add column if not exists amount numeric,
  add column if not exists wallet_transaction_id uuid;

-- ---------------------------------------------------------------------------
-- 2. Member submits an application: validate, charge wallet, insert pending.
-- ---------------------------------------------------------------------------
create or replace function public.submit_insurance_application(
  p_product_id uuid,
  p_gov_id_path text,
  p_selfie_path text,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_product public.insurance_products%rowtype;
  v_price numeric;
  v_balance numeric;
  v_tx_id uuid;
  v_app_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_product
  from public.insurance_products
  where id = p_product_id;
  if not found then
    raise exception 'Insurance product not found';
  end if;

  v_price := coalesce(v_product.price, 0);

  if exists (
    select 1 from public.insurance_applications
    where user_id = v_uid and product_id = p_product_id and status = 'pending'
  ) then
    raise exception 'You already have a pending application for this plan';
  end if;

  if exists (
    select 1 from public.memberships
    where user_id = v_uid and product_id = p_product_id and status = 'active'
  ) then
    raise exception 'You already have an active plan';
  end if;

  -- Ensure a wallet exists, then charge it atomically.
  insert into public.wallets (user_id)
  values (v_uid)
  on conflict (user_id) do nothing;

  select available_balance into v_balance
  from public.wallets
  where user_id = v_uid
  for update;

  if coalesce(v_balance, 0) < v_price then
    raise exception 'Insufficient wallet balance';
  end if;

  if v_price > 0 then
    update public.wallets
    set available_balance = available_balance - v_price,
        updated_at = now()
    where user_id = v_uid;

    insert into public.wallet_transactions (user_id, type, amount, status, description)
    values (v_uid, 'debit', v_price, 'pending', 'Insurance plan payment')
    returning id into v_tx_id;
  end if;

  insert into public.insurance_applications (
    user_id, product_id, status, amount, wallet_transaction_id,
    gov_id_path, selfie_path,
    first_name, middle_name, last_name, date_of_birth, sex, civil_status,
    nationality, occupation, email, mobile, gov_id_type, gov_id_number,
    address_line, barangay, city, province, postal_code,
    beneficiary_full_name, beneficiary_relationship, beneficiary_mobile,
    beneficiary_date_of_birth
  )
  values (
    v_uid, p_product_id, 'pending', v_price, v_tx_id,
    nullif(p_gov_id_path, ''), nullif(p_selfie_path, ''),
    coalesce(nullif(p_payload->>'first_name', ''), ''),
    nullif(p_payload->>'middle_name', ''),
    coalesce(nullif(p_payload->>'last_name', ''), ''),
    (nullif(p_payload->>'date_of_birth', ''))::date,
    nullif(p_payload->>'sex', ''),
    nullif(p_payload->>'civil_status', ''),
    nullif(p_payload->>'nationality', ''),
    nullif(p_payload->>'occupation', ''),
    nullif(p_payload->>'email', ''),
    nullif(p_payload->>'mobile', ''),
    nullif(p_payload->>'gov_id_type', ''),
    nullif(p_payload->>'gov_id_number', ''),
    nullif(p_payload->>'address_line', ''),
    nullif(p_payload->>'barangay', ''),
    nullif(p_payload->>'city', ''),
    nullif(p_payload->>'province', ''),
    nullif(p_payload->>'postal_code', ''),
    nullif(p_payload->>'beneficiary_full_name', ''),
    nullif(p_payload->>'beneficiary_relationship', ''),
    nullif(p_payload->>'beneficiary_mobile', ''),
    (nullif(p_payload->>'beneficiary_date_of_birth', ''))::date
  )
  returning id into v_app_id;

  return v_app_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Approve: issue the policy and finalize the wallet charge.
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

  insert into public.memberships (user_id, product_id, status, start_date, expiry_date)
  values (
    v_app.user_id,
    v_app.product_id,
    'active',
    now()::date,
    (now() + make_interval(months => coalesce(v_product.term_months, 12)))::date
  )
  returning id into v_membership_id;

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

  if coalesce(v_app.gov_id_path, '') <> '' then
    insert into public.kyc_documents (user_id, membership_id, doc_type, storage_path)
    values (v_app.user_id, v_membership_id, 'government_id', v_app.gov_id_path);
  end if;
  if coalesce(v_app.selfie_path, '') <> '' then
    insert into public.kyc_documents (user_id, membership_id, doc_type, storage_path)
    values (v_app.user_id, v_membership_id, 'selfie', v_app.selfie_path);
  end if;

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

  -- Finalize the held wallet charge.
  if v_app.wallet_transaction_id is not null then
    update public.wallet_transactions
    set status = 'completed'
    where id = v_app.wallet_transaction_id;
  end if;

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
-- 4. Reject: refund the wallet and record the reason.
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

  -- Refund the held wallet charge.
  if coalesce(v_app.amount, 0) > 0 then
    update public.wallets
    set available_balance = available_balance + v_app.amount,
        updated_at = now()
    where user_id = v_app.user_id;

    insert into public.wallet_transactions (user_id, type, amount, status, description)
    values (v_app.user_id, 'credit', v_app.amount, 'completed', 'Insurance plan refunded');

    if v_app.wallet_transaction_id is not null then
      update public.wallet_transactions
      set status = 'rejected'
      where id = v_app.wallet_transaction_id;
    end if;
  end if;

  update public.insurance_applications
  set status = 'rejected',
      review_notes = p_notes,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_application_id;
end;
$$;

grant execute on function public.submit_insurance_application(uuid, text, text, jsonb) to authenticated;
grant execute on function public.admin_approve_application(uuid) to authenticated;
grant execute on function public.admin_reject_application(uuid, text) to authenticated;

commit;
