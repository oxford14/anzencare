-- Backfill applications for legacy active memberships
-- Memberships created before the admin-review flow have no insurance_applications
-- row, so they never appeared on the super-admin Subscriptions page. Create an
-- approved application snapshot for each active membership that lacks one, using
-- the profile, beneficiary, and KYC documents already linked to the membership.
-- Idempotent: skips memberships that already have an application.

begin;

insert into public.insurance_applications (
  user_id, product_id, membership_id, status, amount,
  first_name, middle_name, last_name, email, mobile,
  gov_id_path, selfie_path,
  beneficiary_full_name, beneficiary_relationship, beneficiary_mobile,
  reviewed_at, created_at
)
select
  m.user_id,
  m.product_id,
  m.id,
  'approved',
  null,
  coalesce(p.first_name, ''),
  p.middle_name,
  coalesce(p.last_name, ''),
  p.email,
  p.phone,
  (
    select k.storage_path
    from public.kyc_documents k
    where k.membership_id = m.id and k.doc_type = 'government_id'
    order by k.created_at
    limit 1
  ),
  (
    select k.storage_path
    from public.kyc_documents k
    where k.membership_id = m.id and k.doc_type = 'selfie'
    order by k.created_at
    limit 1
  ),
  b.full_name,
  b.relationship,
  b.mobile_number,
  m.created_at,
  m.created_at
from public.memberships m
join public.profiles p on p.id = m.user_id
left join lateral (
  select *
  from public.beneficiaries b
  where b.membership_id = m.id
  order by b.created_at
  limit 1
) b on true
where m.status = 'active'
  and not exists (
    select 1
    from public.insurance_applications a
    where a.membership_id = m.id
  );

commit;
