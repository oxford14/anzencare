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
