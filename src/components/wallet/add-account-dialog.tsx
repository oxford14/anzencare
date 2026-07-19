"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Wallet, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  PH_BANKS,
  WITHDRAWAL_ACCOUNT_TYPES,
  formatAccountNumber,
  getAccountTypeConfig,
  getDigitProgress,
  normalizeAccountNumber,
  stripAccountNumber,
  validateAccountNumber,
  validateBankName,
  validateWithdrawalAccount,
  type WithdrawalAccountType,
} from "@/lib/instapay-banks";

export function AddAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [accountType, setAccountType] = useState<WithdrawalAccountType>("GCash");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = getAccountTypeConfig(accountType);
  const isBank = config?.category === "bank";
  const progress = getDigitProgress(accountType, accountNumber);

  useEffect(() => {
    if (!open) {
      setLabel("");
      setAccountType("GCash");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      setTouched(false);
      setError(null);
    }
  }, [open]);

  const numberError = useMemo(() => {
    if (!touched && !accountNumber) return null;
    return validateAccountNumber(accountType, accountNumber);
  }, [accountType, accountNumber, touched]);

  const bankError = useMemo(() => {
    if (!isBank || (!touched && !bankName)) return null;
    return validateBankName(accountType, bankName);
  }, [accountType, bankName, isBank, touched]);

  function handleTypeChange(next: WithdrawalAccountType) {
    setAccountType(next);
    setAccountNumber("");
    if (next !== "Bank Account") setBankName("");
    setTouched(false);
  }

  function handleNumberChange(value: string) {
    const raw = stripAccountNumber(value);
    const max = config?.digits ?? config?.maxDigits ?? 16;
    if (raw.length > max) return;
    setAccountNumber(formatAccountNumber(accountType, raw));
  }

  const isValid =
    accountName.trim().length > 0 &&
    validateWithdrawalAccount({ accountType, accountNumber, bankName }) === null;

  async function handleSave() {
    setTouched(true);
    setError(null);
    if (!isValid) return;

    setSaving(true);
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
        .from("withdrawal_accounts")
        .insert({
          user_id: user.id,
          label: label.trim() || accountType,
          account_type: accountType,
          bank_name: isBank ? bankName.trim() : null,
          account_number: normalizeAccountNumber(accountType, accountNumber),
          account_name: accountName.trim(),
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-card p-5 shadow-xl sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand-mid">
              <Wallet className="size-5" />
            </div>
            <h3 className="font-semibold text-foreground">Add payout method</h3>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="acct-label">Nickname (optional)</Label>
            <Input
              id="acct-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={isBank ? "e.g. My BDO Savings" : "e.g. My GCash"}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Account type</Label>
            <div className="relative">
              <select
                value={accountType}
                onChange={(e) =>
                  handleTypeChange(e.target.value as WithdrawalAccountType)
                }
                className="h-11 w-full appearance-none rounded-xl border border-input bg-background px-3 pr-10 text-sm outline-none focus:border-brand-mid"
              >
                {WITHDRAWAL_ACCOUNT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {isBank && (
            <div className="space-y-1.5">
              <Label>Bank</Label>
              <div className="relative">
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  onBlur={() => setTouched(true)}
                  className={cn(
                    "h-11 w-full appearance-none rounded-xl border bg-background px-3 pr-10 text-sm outline-none focus:border-brand-mid",
                    bankError ? "border-destructive/60" : "border-input"
                  )}
                >
                  <option value="">Select your bank</option>
                  {PH_BANKS.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              {bankError && (
                <p className="text-xs text-destructive">{bankError}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="acct-number">
                {config?.numberLabel ?? "Account number"}
              </Label>
              {config && (
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    progress.complete
                      ? "text-emerald-600"
                      : "text-muted-foreground"
                  )}
                >
                  {progress.label}
                </span>
              )}
            </div>
            <Input
              id="acct-number"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => handleNumberChange(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={config?.placeholder}
              className="h-11 rounded-xl"
            />
            {numberError && (
              <p className="text-xs text-destructive">{numberError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acct-name">Account holder name</Label>
            <Input
              id="acct-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Full name on the account"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-11 flex-1 rounded-xl font-semibold"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
