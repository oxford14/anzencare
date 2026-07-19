"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Action = "approve" | "reject" | null;

export function SubscriptionActions({
  applicationId,
  status,
}: {
  applicationId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action>(null);
  const [error, setError] = useState<string | null>(null);

  if (status !== "pending") {
    return (
      <span className="text-xs text-muted-foreground capitalize">{status}</span>
    );
  }

  async function run(action: "approve" | "reject") {
    setError(null);
    setBusy(action);
    try {
      const supabase = createClient();
      if (action === "approve") {
        const { error: e } = await supabase.rpc("admin_approve_application", {
          p_application_id: applicationId,
        });
        if (e) throw new Error(e.message);
      } else {
        const note =
          typeof window !== "undefined"
            ? window.prompt(
                "Reason for denial (shown to the member). The plan price will be refunded to their wallet:"
              ) ?? undefined
            : undefined;
        if (note === undefined) {
          setBusy(null);
          return;
        }
        const { error: e } = await supabase.rpc("admin_reject_application", {
          p_application_id: applicationId,
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

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        <ActionButton
          onClick={() => run("approve")}
          busy={busy === "approve"}
          disabled={busy !== null}
          className="border border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        >
          <Check className="size-3.5" />
          Approve
        </ActionButton>
        <ActionButton
          onClick={() => run("reject")}
          busy={busy === "reject"}
          disabled={busy !== null}
          className="border border-red-500/40 bg-red-50 text-red-700 hover:bg-red-100"
        >
          <X className="size-3.5" />
          Reject
        </ActionButton>
      </div>
      {error && (
        <p className="max-w-[220px] text-[11px] text-destructive">{error}</p>
      )}
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
