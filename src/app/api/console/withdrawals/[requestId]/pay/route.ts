import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  createInstapayTransfer,
  isPaymongoConfigured,
  resolveDestinationBic,
  type PaymongoTransferStatus,
} from "@/lib/paymongo";
import type { PayoutAccountSnapshot } from "@/lib/instapay-banks";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await params;
  if (!requestId) {
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: isAdmin } = await supabase.rpc("is_super_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isPaymongoConfigured()) {
    return NextResponse.json(
      {
        error:
          "PayMongo is not configured yet. Add PAYMONGO_SECRET_KEY and wallet details to enable direct payouts, or use Approve and pay manually.",
      },
      { status: 503 }
    );
  }

  const { data: req, error: reqError } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (reqError || !req) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (req.status === "paid") {
    return NextResponse.json({ error: "Already paid" }, { status: 409 });
  }
  if (req.status === "rejected") {
    return NextResponse.json(
      { error: "Request was rejected" },
      { status: 409 }
    );
  }

  const snap = (req.account_snapshot ?? {}) as Record<string, unknown>;
  const account: PayoutAccountSnapshot = {
    accountType: String(snap.account_type ?? ""),
    accountNumber: String(snap.account_number ?? ""),
    accountName: String(snap.account_name ?? ""),
    bankName: snap.bank_name ? String(snap.bank_name) : null,
  };

  if (!account.accountType || !account.accountNumber || !account.accountName) {
    return NextResponse.json(
      { error: "Withdrawal account details are incomplete" },
      { status: 400 }
    );
  }

  let transferId: string;
  let status: PaymongoTransferStatus;
  try {
    const bic = await resolveDestinationBic(account);
    const result = await createInstapayTransfer({
      centavos: Math.round(Number(req.amount) * 100),
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      bic,
    });
    transferId = result.transferId;
    status = result.status;
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "PayMongo transfer failed",
      },
      { status: 502 }
    );
  }

  const { error: markError } = await supabase.rpc("admin_mark_withdrawal_paid", {
    p_request_id: requestId,
    p_ref: transferId,
  });

  if (markError) {
    return NextResponse.json(
      {
        error:
          "Payout sent to PayMongo but recording it failed. Refresh and verify before retrying.",
        transferId,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, transferId, status });
}
