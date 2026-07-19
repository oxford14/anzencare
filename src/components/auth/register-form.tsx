"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  isValidPhPhone,
  normalizePhPhone,
  phoneToAuthEmail,
} from "@/lib/phone";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref.trim().toUpperCase());
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }

    const normalizedPhone = normalizePhPhone(phone);
    if (!isValidPhPhone(normalizedPhone)) {
      setError("Please enter a valid PH mobile number (e.g. 09XX XXX XXXX).");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError(
        "Supabase is not configured. Add your project keys to .env.local."
      );
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const authEmail = phoneToAuthEmail(normalizedPhone);
      const realEmail = email.trim() || null;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: authEmail,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            middle_name: middleName.trim() || null,
            last_name: lastName.trim(),
            phone: normalizedPhone,
            email: realEmail,
            referral_code: referralCode.trim().toUpperCase() || null,
          },
        },
      });

      if (signUpError) {
        setError(
          /already registered|already exists/i.test(signUpError.message)
            ? "An account with that phone number already exists. Try signing in."
            : signUpError.message
        );
        return;
      }

      // If a session is returned, email confirmation is off — go straight in.
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // Fallback: attempt immediate sign-in.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (signInError) {
        setError(
          "Account created. Please sign in with your phone number and password."
        );
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="no-scrollbar relative flex min-h-full flex-col overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,_#2a5bb855_0%,_transparent_45%),linear-gradient(180deg,_#14264f_0%,_#1e4a9e_28%,_#f7f9fc_28%)]" />

      <div className="relative z-10 flex flex-1 flex-col px-6 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1 rounded-full bg-white/15 py-1.5 pr-3 pl-2 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/25"
        >
          <ChevronLeft className="size-4" />
          Home
        </Link>
        <header className="animate-brand-fade mb-6 pt-3 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
            <ShieldCheck className="size-7 text-white" strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
            Create account
          </h1>
          <p className="mx-auto mt-1.5 max-w-[18rem] text-sm text-white/80">
            Join AnzenCare in a minute.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="animate-form-slide space-y-4 rounded-3xl bg-card p-5 shadow-sm"
          noValidate
        >
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              {error}
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
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-11 rounded-xl"
                autoComplete="family-name"
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
              autoComplete="additional-name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Mobile number</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="09XX XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 rounded-xl"
              autoComplete="tel"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">
              Email{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="referralCode">
              Referral code{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="referralCode"
              placeholder="Enter your inviter's code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="h-11 rounded-xl uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal"
              autoCapitalize="characters"
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl pr-11"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-11 rounded-xl"
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl text-base font-semibold transition-transform active:scale-[0.98]"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-mid hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
