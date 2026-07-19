-- Public virtual ID verification
-- Lets anyone who scans a member's QR code confirm the policy is genuine
-- without exposing the virtual_ids table. The QR encodes a random qr_token;
-- this SECURITY DEFINER function returns only the minimal fields needed to
-- display a verification result.

begin;

create or replace function public.verify_virtual_id(p_token text)
returns table (
  member_id text,
  full_name text,
  status text,
  product_name text,
  issued_at timestamptz,
  expiry_date date,
  is_valid boolean
)
language sql
security definer
set search_path = public
as $$
  select
    v.member_id,
    nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), '')
      as full_name,
    v.status,
    ip.name as product_name,
    v.issued_at,
    v.expiry_date,
    (
      v.status = 'active'
      and (v.expiry_date is null or v.expiry_date >= current_date)
    ) as is_valid
  from public.virtual_ids v
  join public.profiles p on p.id = v.user_id
  left join public.memberships m on m.id = v.membership_id
  left join public.insurance_products ip on ip.id = m.product_id
  where v.qr_token::text = p_token
  limit 1;
$$;

grant execute on function public.verify_virtual_id(text) to anon, authenticated;

commit;
