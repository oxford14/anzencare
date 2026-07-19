import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/**
 * Cached per request so multiple queries in one render share a single
 * Supabase client and a single `auth.getUser()` network round-trip.
 */
const getSupabase = cache(async () => createClient());

export const getSessionUser = cache(async () => {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function getProfile() {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data;
}

export async function getWallet() {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return data;
}

export async function getWalletTransactions(limit = 25) {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("wallet_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getActiveMembership() {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("memberships")
    .select("*, product:insurance_products(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getMemberships() {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("memberships")
    .select("*, product:insurance_products(*)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getInsuranceProducts() {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("insurance_products")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getVirtualIds() {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("virtual_ids")
    .select("*, membership:memberships(*, product:insurance_products(*))")
    .order("issued_at", { ascending: false });
  return data ?? [];
}

export async function getWithdrawalAccounts() {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("withdrawal_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMyWithdrawalRequests(limit = 20) {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** True when the current user has the super_admin role. */
export async function isSuperAdmin() {
  const supabase = await getSupabase();
  const { data } = await supabase.rpc("is_super_admin");
  return Boolean(data);
}

export const ADMIN_PAGE_SIZE = 15;

function pageRange(page: number, pageSize: number) {
  const current = Math.max(1, page);
  const from = (current - 1) * pageSize;
  return { from, to: from + pageSize - 1, current };
}

export async function getAdminMembers(page = 1, pageSize = ADMIN_PAGE_SIZE) {
  const supabase = await getSupabase();
  const { from, to, current } = pageRange(page, pageSize);
  const { data, count } = await supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  return { rows: data ?? [], count: count ?? 0, page: current, pageSize };
}

export async function getAdminWithdrawals(
  page = 1,
  pageSize = ADMIN_PAGE_SIZE
) {
  const supabase = await getSupabase();
  const { from, to, current } = pageRange(page, pageSize);
  const { data, count } = await supabase
    .from("withdrawal_requests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const rows = data ?? [];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const profileMap = new Map<
    string,
    { first_name: string | null; last_name: string | null; phone: string | null; email: string | null }
  >();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, phone, email")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id, {
        first_name: p.first_name,
        last_name: p.last_name,
        phone: p.phone,
        email: p.email,
      });
    }
  }

  return {
    rows: rows.map((r) => ({ ...r, profile: profileMap.get(r.user_id) ?? null })),
    count: count ?? 0,
    page: current,
    pageSize,
  };
}

export async function getAdminApplications(
  page = 1,
  { status = "pending", q = "" }: { status?: string; q?: string } = {},
  pageSize = ADMIN_PAGE_SIZE
) {
  const supabase = await getSupabase();
  const { from, to, current } = pageRange(page, pageSize);

  let query = supabase
    .from("insurance_applications")
    .select("*, product:insurance_products(name, slug, price)", {
      count: "exact",
    });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const term = q.trim();
  if (term) {
    const like = `%${term}%`;
    query = query.or(
      `first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like},mobile.ilike.${like}`
    );
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const rows = data ?? [];
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const profileMap = new Map<
    string,
    { first_name: string | null; last_name: string | null; phone: string | null; email: string | null }
  >();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, phone, email")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id, {
        first_name: p.first_name,
        last_name: p.last_name,
        phone: p.phone,
        email: p.email,
      });
    }
  }

  return {
    rows: rows.map((r) => ({ ...r, profile: profileMap.get(r.user_id) ?? null })),
    count: count ?? 0,
    page: current,
    pageSize,
  };
}

export async function getAdminStats() {
  const supabase = await getSupabase();

  const [members, activeCoverages, pendingWithdrawals, wallets] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("memberships")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("withdrawal_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("wallets").select("available_balance"),
    ]);

  const totalWalletBalance = (wallets.data ?? []).reduce(
    (sum, w) => sum + Number(w.available_balance ?? 0),
    0
  );

  return {
    members: members.count ?? 0,
    activeCoverages: activeCoverages.count ?? 0,
    pendingWithdrawals: pendingWithdrawals.count ?? 0,
    totalWalletBalance,
  };
}

export async function getReferralLevels() {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("referral_levels")
    .select("*")
    .order("level", { ascending: true });
  return data ?? [];
}

export async function getReferralCommissions(limit = 25) {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await getSupabase();
  const { data } = await supabase
    .from("referral_commissions")
    .select("*")
    .eq("earner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export type ConnectSummary = {
  referralCode: string | null;
  totalEarnings: number;
  commissionCount: number;
  connections: {
    id: string;
    first_name: string;
    last_name: string;
    created_at: string;
  }[];
};

export async function getConnectSummary(): Promise<ConnectSummary | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await getSupabase();

  const [profileRes, connectionsRes, commissionsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, created_at")
      .eq("referred_by", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("referral_commissions")
      .select("amount")
      .eq("earner_id", user.id),
  ]);

  const commissions = commissionsRes.data ?? [];
  const totalEarnings = commissions.reduce(
    (sum, c) => sum + Number(c.amount ?? 0),
    0
  );

  return {
    referralCode: profileRes.data?.referral_code ?? null,
    totalEarnings,
    commissionCount: commissions.length,
    connections: connectionsRes.data ?? [],
  };
}
