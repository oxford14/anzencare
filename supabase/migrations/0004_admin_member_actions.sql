-- Super-admin member management: wallet adjustments + role toggle.

-- Credit (positive) or deduct (negative) a member's wallet, logging a transaction.
create or replace function public.admin_adjust_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_reason text default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
  v_new numeric;
begin
  if not public.is_super_admin() then
    raise exception 'Not authorized';
  end if;
  if p_amount is null or p_amount = 0 then
    raise exception 'Enter a non-zero amount';
  end if;

  select available_balance into v_balance
  from public.wallets
  where user_id = p_user_id
  for update;

  if not found then
    if p_amount < 0 then
      raise exception 'Wallet not found';
    end if;
    insert into public.wallets (user_id, available_balance)
    values (p_user_id, 0)
    returning available_balance into v_balance;
  end if;

  v_new := v_balance + p_amount;
  if v_new < 0 then
    raise exception 'Insufficient balance for this deduction';
  end if;

  update public.wallets
  set available_balance = v_new,
      updated_at = now()
  where user_id = p_user_id;

  insert into public.wallet_transactions (user_id, type, amount, status, description, reference)
  values (
    p_user_id,
    case when p_amount > 0 then 'credit' else 'debit' end,
    abs(p_amount),
    'completed',
    coalesce(nullif(trim(p_reason), ''), 'Admin adjustment'),
    'admin'
  );

  return v_new;
end;
$$;

-- Promote/demote a member to/from super admin.
create or replace function public.admin_set_super_admin(
  p_user_id uuid,
  p_make boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Not authorized';
  end if;
  if p_user_id = auth.uid() and not p_make then
    raise exception 'You cannot remove your own super admin role';
  end if;

  update public.profiles
  set role = case when p_make then 'super_admin' else 'member' end
  where id = p_user_id;

  if not found then
    raise exception 'Member not found';
  end if;
end;
$$;

grant execute on function public.admin_adjust_wallet(uuid, numeric, text) to authenticated;
grant execute on function public.admin_set_super_admin(uuid, boolean) to authenticated;
