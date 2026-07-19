-- Make all insurance plans a one-year subscription and align existing records.

-- All products are now one-year terms.
update public.insurance_products
set term_months = 12
where term_months <> 12;

-- Extend existing active memberships to a full year from their start date.
update public.memberships
set expiry_date = (start_date + interval '1 year')::date
where status = 'active'
  and expiry_date < (start_date + interval '1 year')::date;

-- Keep issued virtual IDs in sync with their membership term (end date on the ID).
update public.virtual_ids v
set expiry_date = m.expiry_date
from public.memberships m
where v.membership_id = m.id
  and v.expiry_date is distinct from m.expiry_date;
