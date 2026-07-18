"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const MIN_WITHDRAWAL = 300;
const METHODS = ["GCash", "Maya", "Bank Transfer"] as const;

export function WithdrawForm({ availableBalance }: { availableBalance: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("GCash");
  const [account, setAccount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (!account.trim()) {
      setError("Enter your account number or details.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Your session expired. Please sign in again.");
        return;
      }

      const { error: insertError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: user.id,
          type: "withdrawal",
          amount: value,
          status: "pending",
          description: `Withdrawal via ${method}`,
          reference: account.trim(),
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setSuccess("Withdrawal request submitted. We'll process it shortly.");
      setAmount("");
      setAccount("");
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
    );
  }

  return (
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
          placeholder="300"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-11 rounded-xl"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Method</Label>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={
                "rounded-xl border px-2 py-2 text-xs font-medium transition-colors " +
                (method === m
                  ? "border-brand-mid bg-brand-soft text-brand-deep"
                  : "border-border text-muted-foreground hover:text-foreground")
              }
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="account">Account number / details</Label>
        <Input
          id="account"
          placeholder="e.g. 0917 123 4567"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className="h-11 rounded-xl"
        />
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
  );
}
