"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const MIN_LENGTH = 6;

export function PasswordForm() {
  const router = useRouter();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (next.length < MIN_LENGTH) {
      setError(`New password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (next === current) {
      setError("New password must be different from your current password.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      // Verify the current password by re-authenticating.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (verifyError) {
        setError(
          verifyError.message === "Invalid login credentials"
            ? "Your current password is incorrect."
            : verifyError.message
        );
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: next,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSaved(true);
      setCurrent("");
      setNext("");
      setConfirm("");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-border/70 bg-card p-4"
      noValidate
    >
      <h2 className="text-sm font-semibold text-foreground">Change password</h2>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-mid/30 bg-brand-soft px-3 py-2.5 text-sm text-brand-deep">
          <Check className="size-4" />
          Password updated.
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="current">Current password</Label>
        <Input
          id="current"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="h-11 rounded-xl"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new">New password</Label>
        <Input
          id="new"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="h-11 rounded-xl"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="h-11 rounded-xl"
        />
      </div>

      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        {show ? "Hide passwords" : "Show passwords"}
      </button>

      <Button
        type="submit"
        disabled={saving}
        className="h-11 w-full rounded-xl font-semibold"
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          "Update password"
        )}
      </Button>
    </form>
  );
}
