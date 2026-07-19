"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Plus, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPeso } from "@/lib/format";

const MIN_TOPUP = 100;
const PRESETS = [100, 300, 500, 1000] as const;

type Step = "idle" | "amount" | "qr" | "success";

function normalizeQrSrc(url: string) {
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `data:image/png;base64,${url}`;
}

export function TopUpForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [amount, setAmount] = useState("");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  function reset() {
    stopPolling();
    setStep("idle");
    setAmount("");
    setQrImage(null);
    setIntentId(null);
    setError(null);
    setLoading(false);
    setChecking(false);
  }

  async function createDeposit() {
    setError(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value < MIN_TOPUP) {
      setError(`Minimum top-up is ₱${MIN_TOPUP}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/deposits/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value }),
      });
      const data = (await res.json()) as {
        intentId?: string;
        qrImageUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.qrImageUrl || !data.intentId) {
        throw new Error(data.error ?? "Failed to start top-up.");
      }
      setQrImage(normalizeQrSrc(data.qrImageUrl));
      setIntentId(data.intentId);
      setStep("qr");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const checkPayment = useCallback(
    async (manual = false) => {
      if (!intentId) return;
      if (manual) setChecking(true);
      try {
        const res = await fetch("/api/deposits/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intentId }),
        });
        const data = (await res.json()) as { paid?: boolean };
        if (data.paid) {
          stopPolling();
          setPaidAmount(Number(amount));
          setStep("success");
          router.refresh();
        }
      } catch {
        // Ignore transient polling errors; keep trying.
      } finally {
        if (manual) setChecking(false);
      }
    },
    [intentId, amount, router, stopPolling]
  );

  // Poll while the QR is on screen.
  useEffect(() => {
    if (step !== "qr" || !intentId) return;
    pollRef.current = setInterval(() => checkPayment(false), 3000);
    return stopPolling;
  }, [step, intentId, checkPayment, stopPolling]);

  if (step === "idle") {
    return (
      <Button
        onClick={() => setStep("amount")}
        variant="outline"
        className="h-12 w-full rounded-xl border-brand-mid/40 text-base font-semibold text-brand-deep"
        size="lg"
      >
        <Plus className="size-4" />
        Top up
      </Button>
    );
  }

  if (step === "success") {
    return (
      <div className="space-y-3 rounded-2xl border border-brand-mid/30 bg-brand-soft p-5 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-mid text-white">
          <CheckCircle2 className="size-6" />
        </div>
        <div>
          <p className="font-semibold text-brand-deep">Top-up received</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatPeso(paidAmount ?? 0)} added to your wallet.
          </p>
        </div>
        <Button onClick={reset} className="h-11 w-full rounded-xl font-semibold">
          Done
        </Button>
      </div>
    );
  }

  if (step === "qr") {
    return (
      <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 text-center">
        <div>
          <h3 className="font-semibold text-foreground">Scan to pay</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pay {formatPeso(Number(amount))} with any GCash, Maya, or bank app.
          </p>
        </div>

        {qrImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrImage}
            alt="QR Ph payment code"
            className="mx-auto size-56 rounded-xl border border-border bg-white object-contain p-2"
          />
        ) : (
          <div className="mx-auto flex size-56 items-center justify-center rounded-xl border border-border">
            <QrCode className="size-10 text-muted-foreground" />
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Waiting for your payment…
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={reset}
            className="h-11 flex-1 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => checkPayment(true)}
            disabled={checking}
            className="h-11 flex-1 rounded-xl font-semibold"
          >
            {checking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "I've paid"
            )}
          </Button>
        </div>
      </div>
    );
  }

  // step === "amount"
  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-4">
      <h3 className="font-semibold text-foreground">Top up wallet</h3>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="topup-amount">Amount</Label>
        <Input
          id="topup-amount"
          type="number"
          inputMode="numeric"
          min={MIN_TOPUP}
          placeholder={String(MIN_TOPUP)}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-11 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(String(p))}
            className={
              "rounded-xl border px-2 py-2 text-xs font-medium transition-colors " +
              (amount === String(p)
                ? "border-brand-mid bg-brand-soft text-brand-deep"
                : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            ₱{p.toLocaleString()}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={reset}
          className="h-11 flex-1 rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={createDeposit}
          disabled={loading}
          className="h-11 flex-1 rounded-xl font-semibold"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Continue"}
        </Button>
      </div>
    </div>
  );
}
