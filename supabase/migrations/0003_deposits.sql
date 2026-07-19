-- In-app QR Ph deposits (top-up).

create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null check (amount > 0),
  status text not null default 'pending',
  paymongo_intent_id text unique,
  qr_image_url text,
  wallet_transaction_id uuid,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  expires_at timestamptz
);

create index if not exists deposits_user_idx
  on public.deposits (user_id, created_at desc);
create index if not exists deposits_intent_idx
  on public.deposits (paymongo_intent_id);

alter table public.deposits enable row level security;

drop policy if exists "deposits_select" on public.deposits;
create policy "deposits_select"
  on public.deposits for select
  using (auth.uid() = user_id or public.is_super_admin());

drop policy if exists "deposits_insert" on public.deposits;
create policy "deposits_insert"
  on public.deposits for insert
  with check (auth.uid() = user_id);

-- Credit a paid deposit to the wallet. Idempotent; service_role only
-- (called after the server verifies the PayMongo intent, or from the webhook).
create or replace function public.system_fulfill_deposit(p_intent_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dep public.deposits;
begin
  select * into v_dep
  from public.deposits
  where paymongo_intent_id = p_intent_id
  for update;

  if not found then
    return false;
  end if;
  if v_dep.status = 'paid' then
    return true;
  end if;
  if v_dep.status <> 'pending' then
    return false;
  end if;

  update public.wallets
  set available_balance = available_balance + v_dep.amount,
      updated_at = now()
  where user_id = v_dep.user_id;

  if not found then
    insert into public.wallets (user_id, available_balance)
    values (v_dep.user_id, v_dep.amount);
  end if;

  if v_dep.wallet_transaction_id is not null then
    update public.wallet_transactions
    set status = 'completed'
    where id = v_dep.wallet_transaction_id;
  end if;

  update public.deposits
  set status = 'paid', paid_at = now()
  where id = v_dep.id;

  return true;
end;
$$;

revoke all on function public.system_fulfill_deposit(text)
  from public, anon, authenticated;
grant execute on function public.system_fulfill_deposit(text) to service_role;
