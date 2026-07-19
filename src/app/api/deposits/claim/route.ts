import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentIntentStatus } from "@/lib/paymongo";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const intentId =
    typeof body === "object" && body !== null && "intentId" in body
      ? String((body as { intentId: unknown }).intentId)
      : "";

  if (!intentId.startsWith("pi_")) {
    return NextResponse.json({ error: "Invalid intent id" }, { status: 400 });
  }

  // Confirm the intent belongs to this user's deposit.
  const { data: deposit } = await supabase
    .from("deposits")
    .select("id, status")
    .eq("paymongo_intent_id", intentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!deposit) {
    return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
  }
  if (deposit.status === "paid") {
    return NextResponse.json({ paid: true });
  }

  let status: string;
  try {
    status = await getPaymentIntentStatus(intentId);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not check payment.",
      },
      { status: 502 }
    );
  }

  if (status !== "succeeded") {
    return NextResponse.json({ paid: false, status });
  }

  const admin = createAdminClient();
  const { data: credited, error } = await admin.rpc("system_fulfill_deposit", {
    p_intent_id: intentId,
  });

  if (error) {
    return NextResponse.json(
      { error: "Payment confirmed but crediting failed. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ paid: Boolean(credited) });
}
