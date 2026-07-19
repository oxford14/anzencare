-- PayMongo webhook reconciliation.
-- Resolves a withdrawal by its PayMongo transfer id when a webhook arrives.
-- Runs as the definer and is only callable by the service_role (webhook).

create or replace function public.system_resolve_withdrawal_transfer(
  p_transfer_id text,
  p_status text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.withdrawal_requests;
begin
  select * into v_req
  from public.withdrawal_requests
  where paymongo_transfer_id = p_transfer_id
  for update;

  if not found then
    return; -- Unknown transfer id; nothing to do.
  end if;

  update public.withdrawal_requests
  set paymongo_status = p_status
  where id = v_req.id;

  if p_status in ('succeeded', 'paid') then
    if v_req.status in ('pending', 'approved') then
      update public.wallets
      set total_withdrawals = total_withdrawals + v_req.amount,
          updated_at = now()
      where user_id = v_req.user_id;

      if v_req.wallet_transaction_id is not null then
        update public.wallet_transactions
        set status = 'completed'
        where id = v_req.wallet_transaction_id;
      end if;

      update public.withdrawal_requests
      set status = 'paid', reviewed_at = now()
      where id = v_req.id;
    end if;

  elsif p_status = 'failed' then
    if v_req.status in ('pending', 'approved') then
      update public.wallets
      set available_balance = available_balance + v_req.amount,
          updated_at = now()
      where user_id = v_req.user_id;

      insert into public.wallet_transactions (user_id, type, amount, status, description)
      values (
        v_req.user_id,
        'credit',
        v_req.amount,
        'completed',
        'Withdrawal payout failed - refunded'
      );

      if v_req.wallet_transaction_id is not null then
        update public.wallet_transactions
        set status = 'rejected'
        where id = v_req.wallet_transaction_id;
      end if;

      update public.withdrawal_requests
      set status = 'rejected',
          review_notes = coalesce(p_reason, 'Payout failed'),
          reviewed_at = now()
      where id = v_req.id;
    end if;
  end if;
end;
$$;

revoke all on function public.system_resolve_withdrawal_transfer(text, text, text)
  from public, anon, authenticated;
grant execute on function public.system_resolve_withdrawal_transfer(text, text, text)
  to service_role;
