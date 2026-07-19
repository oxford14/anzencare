"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MoreVertical,
  ShieldCheck,
  ShieldMinus,
  Wallet,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { formatPeso } from "@/lib/format";
import { cn } from "@/lib/utils";

export type MemberSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
};

type Dialog = "view" | "adjust" | "role" | null;

const MENU_WIDTH = 192;

export function MemberActions({ member }: { member: MemberSummary }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const [dialog, setDialog] = useState<Dialog>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isSuper = member.role === "super_admin";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!menuOpen) return;
    function close() {
      setMenuOpen(false);
    }
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menuOpen]);

  function toggleMenu() {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({
        top: rect.bottom + 6,
        left: Math.max(8, rect.right - MENU_WIDTH),
      });
    }
    setMenuOpen(true);
  }

  function open(d: Dialog) {
    setMenuOpen(false);
    setDialog(d);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Member actions"
        onClick={toggleMenu}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-border/70 bg-background text-muted-foreground transition-colors hover:text-foreground"
      >
        <MoreVertical className="size-4" />
      </button>

      {mounted &&
        menuOpen &&
        menuPos &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="fixed z-50 w-48 overflow-hidden rounded-xl border border-border/70 bg-card py-1 shadow-lg"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <MenuItem onClick={() => open("view")}>
                <Wallet className="size-4" />
                View details
              </MenuItem>
              <MenuItem onClick={() => open("adjust")}>
                <Wallet className="size-4" />
                Adjust balance
              </MenuItem>
              <MenuItem onClick={() => open("role")}>
                {isSuper ? (
                  <ShieldMinus className="size-4" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                {isSuper ? "Remove super admin" : "Make super admin"}
              </MenuItem>
            </div>
          </>,
          document.body
        )}

      {dialog === "view" && (
        <ViewDialog member={member} onClose={() => setDialog(null)} />
      )}
      {dialog === "adjust" && (
        <AdjustDialog
          member={member}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null);
            router.refresh();
          }}
        />
      )}
      {dialog === "role" && (
        <RoleDialog
          member={member}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function MenuItem({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
    >
      {children}
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl border border-border/70 bg-card p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type TxRow = {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
};

function ViewDialog({
  member,
  onClose,
}: {
  member: MemberSummary;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [txns, setTxns] = useState<TxRow[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const [walletRes, txRes] = await Promise.all([
        supabase
          .from("wallets")
          .select("available_balance")
          .eq("user_id", member.id)
          .maybeSingle(),
        supabase
          .from("wallet_transactions")
          .select("id, type, amount, status, description, created_at")
          .eq("user_id", member.id)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      if (!active) return;
      setBalance(Number(walletRes.data?.available_balance ?? 0));
      setTxns((txRes.data as TxRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [member.id]);

  return (
    <Modal title="Member details" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl border border-border/70 bg-background p-4">
          <p className="font-medium text-foreground">{member.name}</p>
          <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
            <Row label="Email" value={member.email || "—"} />
            <Row label="Phone" value={member.phone || "—"} />
            <Row
              label="Role"
              value={member.role.replace("_", " ")}
              valueClassName="capitalize"
            />
          </dl>
        </div>

        <div className="rounded-xl bg-brand-soft p-4">
          <p className="text-xs font-medium text-brand-deep/70">
            Wallet balance
          </p>
          <p className="mt-0.5 text-2xl font-semibold text-brand-deep">
            {loading ? "…" : formatPeso(balance ?? 0)}
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">
            Recent transactions
          </p>
          {loading ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : txns.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No transactions yet.
            </p>
          ) : (
            <ul className="max-h-60 space-y-1.5 overflow-y-auto">
              {txns.map((t) => {
                const incoming = t.type === "credit";
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-foreground">
                        {t.description || t.type}
                      </p>
                      <p className="text-[11px] capitalize text-muted-foreground">
                        {t.status}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 font-medium",
                        incoming ? "text-emerald-600" : "text-foreground"
                      )}
                    >
                      {incoming ? "+" : "−"}
                      {formatPeso(t.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{label}</dt>
      <dd className={cn("text-foreground", valueClassName)}>{value}</dd>
    </div>
  );
}

function AdjustDialog({
  member,
  onClose,
  onDone,
}: {
  member: MemberSummary;
  onClose: () => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"credit" | "deduct">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const signed = mode === "credit" ? value : -value;
      const { error: e } = await supabase.rpc("admin_adjust_wallet", {
        p_user_id: member.id,
        p_amount: signed,
        p_reason: reason.trim() || undefined,
      });
      if (e) throw new Error(e.message);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Adjust balance" onClose={onClose}>
      <p className="mb-4 text-sm text-muted-foreground">
        {member.name}
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {(["credit", "deduct"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-colors",
              mode === m
                ? m === "credit"
                  ? "border-emerald-500/50 bg-emerald-50 text-emerald-700"
                  : "border-red-500/50 bg-red-50 text-red-700"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {m === "credit" ? "Add funds" : "Deduct"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="adj-amount" className="text-sm font-medium">
            Amount (₱)
          </label>
          <input
            id="adj-amount"
            type="number"
            inputMode="decimal"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand-mid"
            placeholder="0.00"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="adj-reason" className="text-sm font-medium">
            Reason <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="adj-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand-mid"
            placeholder="e.g. Promo bonus"
          />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-11 flex-1 rounded-xl border border-border text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-brand-mid text-sm font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Confirm"}
        </button>
      </div>
    </Modal>
  );
}

function RoleDialog({
  member,
  onClose,
  onDone,
}: {
  member: MemberSummary;
  onClose: () => void;
  onDone: () => void;
}) {
  const isSuper = member.role === "super_admin";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: e } = await supabase.rpc("admin_set_super_admin", {
        p_user_id: member.id,
        p_make: !isSuper,
      });
      if (e) throw new Error(e.message);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <Modal
      title={isSuper ? "Remove super admin" : "Make super admin"}
      onClose={onClose}
    >
      <p className="text-sm text-muted-foreground">
        {isSuper ? (
          <>
            Remove super admin access from{" "}
            <span className="font-medium text-foreground">{member.name}</span>?
            They will lose access to this console.
          </>
        ) : (
          <>
            Grant super admin access to{" "}
            <span className="font-medium text-foreground">{member.name}</span>?
            They will be able to manage members, withdrawals, and balances.
          </>
        )}
      </p>

      {error && (
        <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-11 flex-1 rounded-xl border border-border text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className={cn(
            "inline-flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60",
            isSuper
              ? "bg-red-600 hover:bg-red-700"
              : "bg-brand-mid hover:bg-brand-deep"
          )}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isSuper ? (
            "Remove"
          ) : (
            "Confirm"
          )}
        </button>
      </div>
    </Modal>
  );
}
