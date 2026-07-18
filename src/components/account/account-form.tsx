"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { formatPhoneDisplay } from "@/lib/format";

type Props = {
  userId: string;
  initial: {
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
};

export function AccountForm({ userId, initial }: Props) {
  const router = useRouter();

  const [firstName, setFirstName] = useState(initial.first_name ?? "");
  const [middleName, setMiddleName] = useState(initial.middle_name ?? "");
  const [lastName, setLastName] = useState(initial.last_name ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          middle_name: middleName.trim() || null,
          last_name: lastName.trim(),
          email: email.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function onSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={onSave}
        className="space-y-4 rounded-2xl border border-border/70 bg-card p-4"
        noValidate
      >
        <h2 className="text-sm font-semibold text-foreground">
          Personal information
        </h2>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-brand-mid/30 bg-brand-soft px-3 py-2.5 text-sm text-brand-deep">
            <Check className="size-4" />
            Changes saved.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="middleName">
            Middle name{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            id="middleName"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Mobile number</Label>
          <Input
            id="phone"
            value={formatPhoneDisplay(initial.phone)}
            readOnly
            disabled
            className="h-11 rounded-xl bg-muted/50"
          />
          <p className="text-xs text-muted-foreground">
            Your mobile number is used to sign in and can&apos;t be changed here.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">
            Email{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="h-11 w-full rounded-xl font-semibold"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
        </Button>
      </form>

      <Button
        type="button"
        variant="outline"
        onClick={onSignOut}
        disabled={signingOut}
        className="h-12 w-full rounded-xl border-destructive/30 font-semibold text-destructive hover:bg-destructive/10"
      >
        {signingOut ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <LogOut className="size-4" />
            Sign out
          </>
        )}
      </Button>
    </div>
  );
}
