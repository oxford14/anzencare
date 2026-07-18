"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("anzencare_remember_identifier");
    if (saved) {
      setIdentifier(saved);
      setRemember(true);
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError("Please enter your phone or email and password.");
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

      // Resolve phone-or-email to the deterministic auth email.
      const { data: authEmail, error: resolveError } = await supabase.rpc(
        "resolve_auth_email",
        { identifier: identifier.trim() }
      );

      if (resolveError) {
        setError(resolveError.message);
        return;
      }

      if (!authEmail) {
        setError("No account found with that phone or email.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Incorrect password. Please try again."
            : signInError.message
        );
        return;
      }

      if (remember) {
        localStorage.setItem("anzencare_remember_identifier", identifier.trim());
      } else {
        localStorage.removeItem("anzencare_remember_identifier");
      }

      router.push(redirectTo);
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
      {/* Atmospheric background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,_#2a5bb855_0%,_transparent_50%),radial-gradient(ellipse_at_90%_10%,_#1e4a9e55_0%,_transparent_45%),linear-gradient(180deg,_#14264f_0%,_#1e4a9e_38%,_#f7f9fc_38%)]" />
      <div className="animate-glow-pulse pointer-events-none absolute -left-16 top-24 size-48 rounded-full bg-brand-glow/30 blur-3xl" />
      <div className="animate-glow-pulse pointer-events-none absolute -right-10 top-10 size-40 rounded-full bg-brand-mid/40 blur-3xl [animation-delay:1.5s]" />

      <div className="relative z-10 flex flex-1 flex-col px-6 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1 rounded-full bg-white/15 py-1.5 pr-3 pl-2 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/25"
        >
          <ChevronLeft className="size-4" />
          Home
        </Link>
        {/* Brand hero */}
        <header className="animate-brand-fade mb-8 pt-4 text-center text-primary-foreground">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
            <ShieldCheck className="size-8 text-white" strokeWidth={1.75} />
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-white">
            AnzenCare
          </h1>
          <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-relaxed text-white/80">
            Affordable Protection, Delivered Digitally. Because We Care.
          </p>
        </header>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="animate-form-slide mt-auto space-y-5 rounded-t-3xl bg-transparent pt-2"
          noValidate
        >
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Sign in
            </h2>
            <p className="text-sm text-muted-foreground">
              Access your coverage, wallet, and insurances.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Phone or email</Label>
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="09XX XXX XXXX or you@email.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="h-11 rounded-xl bg-card"
                aria-invalid={Boolean(error && !identifier.trim())}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-brand-mid hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl bg-card pr-11"
                  aria-invalid={Boolean(error && !password)}
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

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-4 rounded border-input accent-brand-mid"
              />
              Remember me
            </label>
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
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>

          <p className="pb-2 text-center text-sm text-muted-foreground">
            New to AnzenCare?{" "}
            <Link
              href="/register"
              className="font-semibold text-brand-mid hover:underline"
            >
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
