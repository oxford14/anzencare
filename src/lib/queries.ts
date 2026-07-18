import { createClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data;
}

export async function getWallet() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return data;
}

export async function getWalletTransactions(limit = 25) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wallet_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getActiveMembership() {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("*, product:insurance_products(*)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getInsuranceProducts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("insurance_products")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getVirtualIds() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("virtual_ids")
    .select("*, membership:memberships(*, product:insurance_products(*))")
    .order("issued_at", { ascending: false });
  return data ?? [];
}
