"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddAccountDialog } from "@/components/wallet/add-account-dialog";
import { createClient } from "@/lib/supabase/client";
import { maskAccountNumber } from "@/lib/instapay-banks";
import { cn } from "@/lib/utils";

const MIN_WITHDRAWAL = 100;

type Account = {
  id: string;
  label: string;
  account_type: string;
  bank_name: string | null;
  account_number: string;
  account_name: string;
};

export function WithdrawForm({
  availableBalance,
  accounts,
}: {
  availableBalance: number;
  accounts: Account[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState<string | null>(
    accounts[0]?.id ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedId = accountId ?? accounts[0]?.id ?? null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (value < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is ₱${MIN_WITHDRAWAL}.`);
      return;
    }
    if (value > availableBalance) {
      setError("Amount exceeds your available balance.");
      return;
    }
    if (!selectedId) {
      setError("Add a payout method first.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("request_withdrawal", {
        p_amount: value,
        p_account_id: selectedId,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      setSuccess(
        "Withdrawal request submitted. It may be received instantly, or take 24–48 hours to be approved."
      );
      setAmount("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <>
        <div className="space-y-2">
          {success && (
            <div className="rounded-xl border border-brand-mid/30 bg-brand-soft px-3 py-2.5 text-sm text-brand-deep">
              {success}
            </div>
          )}
          <Button
            onClick={() => {
              setOpen(true);
              setSuccess(null);
            }}
            className="h-12 w-full rounded-xl text-base font-semibold"
            size="lg"
          >
            Withdraw funds
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Minimum withdrawal ₱{MIN_WITHDRAWAL}
          </p>
        </div>
        <AddAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-border/70 bg-card p-4"
        noValidate
      >
        <h3 className="font-semibold text-foreground">Request withdrawal</h3>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            inputMode="numeric"
            min={MIN_WITHDRAWAL}
            placeholder={String(MIN_WITHDRAWAL)}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Send to</Label>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-mid hover:underline"
            >
              <Plus className="size-3.5" />
              Add
            </button>
          </div>

          {accounts.length === 0 ? (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-mid/40 px-3 py-4 text-sm font-medium text-brand-deep"
            >
              <Plus className="size-4" />
              Add a payout method
            </button>
          ) : (
            <div className="space-y-2">
              {accounts.map((acct) => {
                const active = selectedId === acct.id;
                return (
                  <button
                    key={acct.id}
                    type="button"
                    onClick={() => setAccountId(acct.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                      active
                        ? "border-brand-mid bg-brand-soft"
                        : "border-border hover:border-brand-mid/50"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {acct.label || acct.account_type}
                        {acct.bank_name ? ` · ${acct.bank_name}` : ""}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {acct.account_name} ·{" "}
                        {maskAccountNumber(acct.account_type, acct.account_number)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "size-4 shrink-0 rounded-full border-2",
                        active
                          ? "border-brand-mid bg-brand-mid"
                          : "border-border"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-brand-soft/60 px-3 py-2.5 text-xs text-muted-foreground">
          <Clock className="mt-0.5 size-4 shrink-0 text-brand-mid" />
          Withdrawals may be received instantly, or may take 24–48 hours to be
          approved.
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-11 flex-1 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 flex-1 rounded-xl font-semibold"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Submit"}
          </Button>
        </div>
      </form>
      <AddAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
