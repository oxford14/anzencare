import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  createQrPhPaymentIntent,
  isPaymongoDepositConfigured,
} from "@/lib/paymongo";

const MIN_TOPUP = 100;
const EXPIRY_MINUTES = 30;

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPaymongoDepositConfigured()) {
    return NextResponse.json(
      {
        error:
          "Top-up is not available yet. PayMongo keys are not configured.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const amount =
    typeof body === "object" && body !== null && "amount" in body
      ? Number((body as { amount: unknown }).amount)
      : NaN;

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
  }
  if (amount < MIN_TOPUP) {
    return NextResponse.json(
      { error: `Minimum top-up is ₱${MIN_TOPUP}.` },
      { status: 400 }
    );
  }

  const rounded = Math.round(amount * 100) / 100;

  let intentId: string;
  let qrImageUrl: string;
  try {
    const result = await createQrPhPaymentIntent(Math.round(rounded * 100));
    intentId = result.intentId;
    qrImageUrl = result.qrImageUrl;
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to start top-up.",
      },
      { status: 502 }
    );
  }

  if (!qrImageUrl) {
    return NextResponse.json(
      { error: "Payment provider did not return a QR code." },
      { status: 502 }
    );
  }

  const { data: tx, error: txError } = await supabase
    .from("wallet_transactions")
    .insert({
      user_id: user.id,
      type: "credit",
      amount: rounded,
      status: "pending",
      description: "Wallet top-up via QR Ph",
      reference: intentId,
    })
    .select("id")
    .single();

  if (txError || !tx) {
    return NextResponse.json(
      { error: txError?.message ?? "Failed to record top-up." },
      { status: 500 }
    );
  }

  const expiresAt = new Date(
    Date.now() + EXPIRY_MINUTES * 60 * 1000
  ).toISOString();

  const { data: deposit, error: depError } = await supabase
    .from("deposits")
    .insert({
      user_id: user.id,
      amount: rounded,
      status: "pending",
      paymongo_intent_id: intentId,
      qr_image_url: qrImageUrl,
      wallet_transaction_id: tx.id,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (depError || !deposit) {
    return NextResponse.json(
      { error: depError?.message ?? "Failed to record top-up." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    depositId: deposit.id,
    intentId,
    qrImageUrl,
    amount: rounded,
    expiresAt,
  });
}
