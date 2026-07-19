"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Send, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Action = "approve" | "reject" | "pay" | null;

export function WithdrawalActions({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action>(null);
  const [error, setError] = useState<string | null>(null);

  const done = status === "paid" || status === "rejected";
  const canApprove = status === "pending";
  const canReject = status === "pending" || status === "approved";
  const canPay = status === "pending" || status === "approved";

  async function runRpc(action: "approve" | "reject") {
    setError(null);
    setBusy(action);
    try {
      const supabase = createClient();
      if (action === "approve") {
        const { error: e } = await supabase.rpc("admin_approve_withdrawal", {
          p_request_id: requestId,
        });
        if (e) throw new Error(e.message);
      } else {
        const note =
          typeof window !== "undefined"
            ? window.prompt("Reason for rejection (optional):") ?? undefined
            : undefined;
        const { error: e } = await supabase.rpc("admin_reject_withdrawal", {
          p_request_id: requestId,
          p_notes: note,
        });
        if (e) throw new Error(e.message);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function pay() {
    setError(null);
    setBusy("pay");
    try {
      const res = await fetch(
        `/api/console/withdrawals/${requestId}/pay`,
        { method: "POST" }
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Payout failed.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payout failed.");
    } finally {
      setBusy(null);
    }
  }

  if (done) {
    return (
      <span className="text-xs text-muted-foreground">
        {status === "paid" ? "Paid out" : "Refunded"}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {canPay && (
          <ActionButton
            onClick={pay}
            busy={busy === "pay"}
            disabled={busy !== null}
            className="bg-brand-mid text-white hover:bg-brand-deep"
          >
            <Send className="size-3.5" />
            Pay
          </ActionButton>
        )}
        {canApprove && (
          <ActionButton
            onClick={() => runRpc("approve")}
            busy={busy === "approve"}
            disabled={busy !== null}
            className="border border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          >
            <Check className="size-3.5" />
            Approve
          </ActionButton>
        )}
        {canReject && (
          <ActionButton
            onClick={() => runRpc("reject")}
            busy={busy === "reject"}
            disabled={busy !== null}
            className="border border-red-500/40 bg-red-50 text-red-700 hover:bg-red-100"
          >
            <X className="size-3.5" />
            Reject
          </ActionButton>
        )}
      </div>
      {error && <p className="max-w-[220px] text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

function ActionButton({
  onClick,
  busy,
  disabled,
  className,
  children,
}: {
  onClick: () => void;
  busy: boolean;
  disabled: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
        className
      )}
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : children}
    </button>
  );
}
