-- Connect Referral Feature
-- 5-level upline commission system. Amounts are configurable via referral_levels.
-- Safe to run once on an existing AnzenCare Supabase project.

begin;

-- ---------------------------------------------------------------------------
-- 1. Profiles: referral code + upline link
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles(id);

create unique index if not exists profiles_referral_code_key
  on public.profiles (referral_code);

create index if not exists profiles_referred_by_idx
  on public.profiles (referred_by);

-- ---------------------------------------------------------------------------
-- 2. Commission configuration (the "amounts I provided")
-- ---------------------------------------------------------------------------
create table if not exists public.referral_levels (
  level int primary key,
  amount numeric(12, 2) not null
);

insert into public.referral_levels (level, amount) values
  (1, 100),
  (2, 50),
  (3, 25),
  (4, 15),
  (5, 10)
on conflict (level) do update set amount = excluded.amount;

-- ---------------------------------------------------------------------------
-- 3. Commission ledger
-- ---------------------------------------------------------------------------
create table if not exists public.referral_commissions (
  id uuid primary key default gen_random_uuid(),
  earner_id uuid not null references public.profiles(id) on delete cascade,
  source_user_id uuid not null references public.profiles(id) on delete cascade,
  membership_id uuid references public.memberships(id) on delete set null,
  level int not null,
  amount numeric(12, 2) not null,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

-- Never pay the same upline twice for the same activation.
create unique index if not exists referral_commissions_membership_level_key
  on public.referral_commissions (membership_id, level);

create index if not exists referral_commissions_earner_idx
  on public.referral_commissions (earner_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. Referral code generator
-- ---------------------------------------------------------------------------
create or replace function public.generate_referral_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
  v_i int;
begin
  loop
    v_code := '';
    for v_i in 1..7 loop
      v_code := v_code || substr(
        v_alphabet,
        1 + floor(random() * length(v_alphabet))::int,
        1
      );
    end loop;
    exit when not exists (
      select 1 from public.profiles where referral_code = v_code
    );
  end loop;
  return v_code;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Set referral_code + referred_by when a profile is created
--    Reads the upline's code from the signup metadata on auth.users so the
--    existing handle_new_user function does not need to change.
-- ---------------------------------------------------------------------------
create or replace function public.set_connect_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref_code text;
  v_upline uuid;
begin
  if new.referral_code is null then
    new.referral_code := public.generate_referral_code();
  end if;

  if new.referred_by is null then
    select nullif(trim(u.raw_user_meta_data->>'referral_code'), '')
      into v_ref_code
    from auth.users u
    where u.id = new.id;

    if v_ref_code is not null then
      select p.id into v_upline
      from public.profiles p
      where upper(p.referral_code) = upper(v_ref_code)
        and p.id <> new.id
      limit 1;

      new.referred_by := v_upline;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists set_connect_defaults on public.profiles;
create trigger set_connect_defaults
  before insert on public.profiles
  for each row execute function public.set_connect_defaults();

-- ---------------------------------------------------------------------------
-- 6. Backfill referral codes for existing members
-- ---------------------------------------------------------------------------
update public.profiles
set referral_code = public.generate_referral_code()
where referral_code is null;

-- ---------------------------------------------------------------------------
-- 7. Distribute commissions up the referred_by chain (up to 5 levels)
-- ---------------------------------------------------------------------------
create or replace function public.distribute_referral_commissions(
  p_membership_id uuid,
  p_source_user uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_level int := 0;
  v_current uuid;
  v_amount numeric(12, 2);
  v_inserted boolean;
begin
  -- Start from the direct upline of the member who activated.
  select referred_by into v_current
  from public.profiles
  where id = p_source_user;

  while v_current is not null and v_level < 5 loop
    v_level := v_level + 1;

    select amount into v_amount
    from public.referral_levels
    where level = v_level;

    if v_amount is not null and v_amount > 0 then
      -- Record the commission; skip if already paid for this membership/level.
      insert into public.referral_commissions (
        earner_id, source_user_id, membership_id, level, amount, status
      )
      values (
        v_current, p_source_user, p_membership_id, v_level, v_amount, 'completed'
      )
      on conflict (membership_id, level) do nothing;

      get diagnostics v_inserted = row_count;

      if v_inserted then
        -- Ensure the earner has a wallet.
        insert into public.wallets (user_id)
        values (v_current)
        on conflict (user_id) do nothing;

        insert into public.wallet_transactions (
          user_id, amount, type, status, description, reference
        )
        values (
          v_current,
          v_amount,
          'credit',
          'completed',
          'Referral commission (Level ' || v_level || ')',
          p_membership_id::text
        );

        update public.wallets
        set available_balance = available_balance + v_amount,
            total_earnings = total_earnings + v_amount,
            updated_at = now()
        where user_id = v_current;
      end if;
    end if;

    -- Move to the next upline.
    select referred_by into v_current
    from public.profiles
    where id = v_current;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Fire commission distribution when a membership becomes active
-- ---------------------------------------------------------------------------
create or replace function public.on_membership_activated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active'
     and (tg_op = 'INSERT' or coalesce(old.status, '') <> 'active') then
    perform public.distribute_referral_commissions(new.id, new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_membership_activated on public.memberships;
create trigger on_membership_activated
  after insert or update of status on public.memberships
  for each row execute function public.on_membership_activated();

-- ---------------------------------------------------------------------------
-- 9. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.referral_levels enable row level security;
alter table public.referral_commissions enable row level security;

-- Anyone signed in can read the commission tiers (used by the Connect UI).
drop policy if exists "referral_levels_select" on public.referral_levels;
create policy "referral_levels_select"
  on public.referral_levels
  for select
  to authenticated
  using (true);

-- Members can see commissions they earned.
drop policy if exists "referral_commissions_select_own" on public.referral_commissions;
create policy "referral_commissions_select_own"
  on public.referral_commissions
  for select
  to authenticated
  using (earner_id = auth.uid());

-- Members can see the profiles of people they referred (their connections).
drop policy if exists "profiles_select_connections" on public.profiles;
create policy "profiles_select_connections"
  on public.profiles
  for select
  to authenticated
  using (referred_by = auth.uid());

commit;
