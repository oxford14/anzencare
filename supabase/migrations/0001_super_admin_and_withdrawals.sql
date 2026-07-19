-- Super Admin role + Withdrawals
-- Safe to run multiple times.

-------------------------------------------------------------------------------
-- 1. Roles
-------------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'member';

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'super_admin'
  );
$$;

-- Seed the super admin (matches profiles.email or the auth.users email).
update public.profiles p
set role = 'super_admin'
where lower(coalesce(p.email, '')) = 'oxfordgalawan@gmail.com'
   or p.id in (
     select id from auth.users where lower(coalesce(email, '')) = 'oxfordgalawan@gmail.com'
   );

-------------------------------------------------------------------------------
-- 2. Super-admin read access to existing tables
-------------------------------------------------------------------------------
drop policy if exists "profiles_superadmin_select" on public.profiles;
create policy "profiles_superadmin_select"
  on public.profiles for select
  using (public.is_super_admin());

drop policy if exists "wallets_superadmin_select" on public.wallets;
create policy "wallets_superadmin_select"
  on public.wallets for select
  using (public.is_super_admin());

drop policy if exists "wallet_tx_superadmin_select" on public.wallet_transactions;
create policy "wallet_tx_superadmin_select"
  on public.wallet_transactions for select
  using (public.is_super_admin());

-------------------------------------------------------------------------------
-- 3. Withdrawal accounts (saved payout methods)
-------------------------------------------------------------------------------
create table if not exists public.withdrawal_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null default '',
  account_type text not null,
  bank_name text,
  account_number text not null,
  account_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists withdrawal_accounts_user_idx
  on public.withdrawal_accounts (user_id, created_at desc);

alter table public.withdrawal_accounts enable row level security;

drop policy if exists "wa_select" on public.withdrawal_accounts;
create policy "wa_select"
  on public.withdrawal_accounts for select
  using (auth.uid() = user_id or public.is_super_admin());

drop policy if exists "wa_insert" on public.withdrawal_accounts;
create policy "wa_insert"
  on public.withdrawal_accounts for insert
  with check (auth.uid() = user_id);

drop policy if exists "wa_update" on public.withdrawal_accounts;
create policy "wa_update"
  on public.withdrawal_accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "wa_delete" on public.withdrawal_accounts;
create policy "wa_delete"
  on public.withdrawal_accounts for delete
  using (auth.uid() = user_id);

-------------------------------------------------------------------------------
-- 4. Withdrawal requests
-------------------------------------------------------------------------------
create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null check (amount > 0),
  account_snapshot jsonb,
  status text not null default 'pending',
  paymongo_transfer_id text,
  paymongo_status text,
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  wallet_transaction_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists withdrawal_requests_created_idx
  on public.withdrawal_requests (created_at desc);
create index if not exists withdrawal_requests_status_idx
  on public.withdrawal_requests (status, created_at desc);

alter table public.withdrawal_requests enable row level security;

-- Reads only; all writes go through the SECURITY DEFINER RPCs below.
drop policy if exists "wr_select" on public.withdrawal_requests;
create policy "wr_select"
  on public.withdrawal_requests for select
  using (auth.uid() = user_id or public.is_super_admin());

-------------------------------------------------------------------------------
-- 5. RPCs
-------------------------------------------------------------------------------

-- User submits a withdrawal: validates, deducts wallet, records request + tx.
create or replace function public.request_withdrawal(
  p_amount numeric,
  p_account_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_balance numeric;
  v_acct public.withdrawal_accounts;
  v_snapshot jsonb;
  v_tx_id uuid;
  v_req_id uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;
  if p_amount is null or p_amount < 100 then
    raise exception 'Minimum withdrawal is 100';
  end if;

  select * into v_acct
  from public.withdrawal_accounts
  where id = p_account_id and user_id = v_user;
  if not found then
    raise exception 'Withdrawal account not found';
  end if;

  select available_balance into v_balance
  from public.wallets
  where user_id = v_user
  for update;
  if v_balance is null then
    raise exception 'Wallet not found';
  end if;
  if v_balance < p_amount then
    raise exception 'Insufficient wallet balance';
  end if;

  update public.wallets
  set available_balance = available_balance - p_amount,
      updated_at = now()
  where user_id = v_user;

  v_snapshot := jsonb_build_object(
    'label', v_acct.label,
    'account_type', v_acct.account_type,
    'bank_name', v_acct.bank_name,
    'account_number', v_acct.account_number,
    'account_name', v_acct.account_name
  );

  insert into public.wallet_transactions (user_id, type, amount, status, description, reference)
  values (
    v_user,
    'withdrawal',
    p_amount,
    'pending',
    'Withdrawal via ' || v_acct.account_type,
    v_acct.account_number
  )
  returning id into v_tx_id;

  insert into public.withdrawal_requests (user_id, amount, account_snapshot, status, wallet_transaction_id)
  values (v_user, p_amount, v_snapshot, 'pending', v_tx_id)
  returning id into v_req_id;

  return v_req_id;
end;
$$;

-- Admin: approve (no money movement, just marks approved).
create or replace function public.admin_approve_withdrawal(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.withdrawal_requests;
begin
  if not public.is_super_admin() then
    raise exception 'Not authorized';
  end if;

  select * into v_req from public.withdrawal_requests where id = p_request_id for update;
  if not found then
    raise exception 'Request not found';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'Request is not pending';
  end if;

  update public.withdrawal_requests
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_request_id;
end;
$$;

-- Admin: reject and refund the wallet.
create or replace function public.admin_reject_withdrawal(
  p_request_id uuid,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.withdrawal_requests;
begin
  if not public.is_super_admin() then
    raise exception 'Not authorized';
  end if;

  select * into v_req from public.withdrawal_requests where id = p_request_id for update;
  if not found then
    raise exception 'Request not found';
  end if;
  if v_req.status not in ('pending', 'approved') then
    raise exception 'Cannot reject this request';
  end if;

  update public.wallets
  set available_balance = available_balance + v_req.amount,
      updated_at = now()
  where user_id = v_req.user_id;

  insert into public.wallet_transactions (user_id, type, amount, status, description)
  values (v_req.user_id, 'credit', v_req.amount, 'completed', 'Withdrawal rejected - refunded');

  if v_req.wallet_transaction_id is not null then
    update public.wallet_transactions
    set status = 'rejected'
    where id = v_req.wallet_transaction_id;
  end if;

  update public.withdrawal_requests
  set status = 'rejected',
      review_notes = p_notes,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_request_id;
end;
$$;

-- Admin: mark paid (called after a successful PayMongo transfer, or manual pay).
create or replace function public.admin_mark_withdrawal_paid(
  p_request_id uuid,
  p_ref text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.withdrawal_requests;
begin
  if not public.is_super_admin() then
    raise exception 'Not authorized';
  end if;

  select * into v_req from public.withdrawal_requests where id = p_request_id for update;
  if not found then
    raise exception 'Request not found';
  end if;
  if v_req.status = 'paid' then
    raise exception 'Already paid';
  end if;
  if v_req.status = 'rejected' then
    raise exception 'Request was rejected';
  end if;

  update public.wallets
  set total_withdrawals = total_withdrawals + v_req.amount,
      updated_at = now()
  where user_id = v_req.user_id;

  if v_req.wallet_transaction_id is not null then
    update public.wallet_transactions
    set status = 'completed',
        reference = coalesce(p_ref, reference)
    where id = v_req.wallet_transaction_id;
  end if;

  update public.withdrawal_requests
  set status = 'paid',
      paymongo_transfer_id = coalesce(p_ref, paymongo_transfer_id),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_request_id;
end;
$$;

grant execute on function public.request_withdrawal(numeric, uuid) to authenticated;
grant execute on function public.admin_approve_withdrawal(uuid) to authenticated;
grant execute on function public.admin_reject_withdrawal(uuid, text) to authenticated;
grant execute on function public.admin_mark_withdrawal_paid(uuid, text) to authenticated;
grant execute on function public.is_super_admin() to authenticated;
