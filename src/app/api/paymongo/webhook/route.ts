import { NextResponse } from "next/server";

import { verifyPaymongoSignature } from "@/lib/paymongo";
import { createAdminClient } from "@/lib/supabase/admin";

/** PayMongo may retry, so processing must be idempotent (the RPC handles that). */
export const dynamic = "force-dynamic";

type ResolvedStatus = "succeeded" | "failed" | "pending" | null;

interface ExtractedTransfer {
  transferId: string | null;
  status: ResolvedStatus;
}

function normalizeStatus(value: unknown): ResolvedStatus {
  const s = String(value ?? "").toLowerCase();
  if (!s) return null;
  if (s.includes("fail")) return "failed";
  if (s.includes("succe") || s.includes("paid") || s.includes("complete")) {
    return "succeeded";
  }
  if (s.includes("pending") || s.includes("processing")) return "pending";
  return null;
}

/** Defensive parsing across the shapes PayMongo may send. */
function extractTransfer(body: unknown): ExtractedTransfer {
  const root = (body ?? {}) as Record<string, unknown>;
  const data = (root.data ?? {}) as Record<string, unknown>;
  const dataAttrs = (data.attributes ?? {}) as Record<string, unknown>;

  // Event-wrapped: data.attributes.type + data.attributes.data (the resource)
  const eventType = dataAttrs.type;
  const resource =
    (dataAttrs.data as Record<string, unknown> | undefined) ??
    // Direct resource: data.id + data.attributes.status
    data ??
    root;

  const resourceAttrs =
    ((resource as Record<string, unknown>)?.attributes as
      | Record<string, unknown>
      | undefined) ?? {};

  const transferId =
    ((resource as Record<string, unknown>)?.id as string | undefined) ??
    (data.id as string | undefined) ??
    null;

  const status =
    normalizeStatus(eventType) ??
    normalizeStatus(resourceAttrs.status) ??
    normalizeStatus(dataAttrs.status);

  return { transferId: transferId ?? null, status };
}

/** Extract a paid QR Ph payment intent id, if this is a deposit event. */
function extractPaidIntentId(body: unknown): string | null {
  const root = (body ?? {}) as Record<string, unknown>;
  const data = (root.data ?? {}) as Record<string, unknown>;
  const dataAttrs = (data.attributes ?? {}) as Record<string, unknown>;
  const eventType = String(dataAttrs.type ?? "").toLowerCase();

  const resource =
    (dataAttrs.data as Record<string, unknown> | undefined) ?? data ?? root;
  const resourceAttrs =
    ((resource as Record<string, unknown>)?.attributes as
      | Record<string, unknown>
      | undefined) ?? {};
  const resourceId =
    ((resource as Record<string, unknown>)?.id as string | undefined) ?? "";

  const paid =
    eventType.includes("paid") ||
    normalizeStatus(resourceAttrs.status) === "succeeded" ||
    String(resourceAttrs.status ?? "").toLowerCase() === "paid";

  if (!paid) return null;

  // A payment resource references its intent; a payment_intent resource is the intent.
  const intentId =
    (resourceAttrs.payment_intent_id as string | undefined) ||
    (resourceId.startsWith("pi_") ? resourceId : null);

  return intentId ?? null;
}

export async function POST(request: Request) {
  const raw = await request.text();

  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[paymongo/webhook] PAYMONGO_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("paymongo-signature");
  if (!verifyPaymongoSignature(raw, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    // Deposit paid (QR Ph top-up) -> credit the wallet.
    const paidIntentId = extractPaidIntentId(body);
    if (paidIntentId) {
      const { error } = await admin.rpc("system_fulfill_deposit", {
        p_intent_id: paidIntentId,
      });
      if (error) {
        console.error("[paymongo/webhook] deposit rpc error:", error.message);
        return NextResponse.json({ error: "processing failed" }, { status: 500 });
      }
      return NextResponse.json({ received: true });
    }

    // Otherwise treat as a payout transfer update.
    const { transferId, status } = extractTransfer(body);
    if (!transferId || !status || status === "pending") {
      return NextResponse.json({ received: true });
    }

    const { error } = await admin.rpc("system_resolve_withdrawal_transfer", {
      p_transfer_id: transferId,
      p_status: status,
      p_reason: status === "failed" ? "PayMongo payout failed" : undefined,
    });
    if (error) {
      console.error("[paymongo/webhook] transfer rpc error:", error.message);
      // 500 lets PayMongo retry the delivery.
      return NextResponse.json({ error: "processing failed" }, { status: 500 });
    }
  } catch (err) {
    console.error(
      "[paymongo/webhook] processing error:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
