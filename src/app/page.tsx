import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Clock3,
  CreditCard,
  HeartHandshake,
  QrCode,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";

import { Reveal } from "@/components/landing/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AnzenCare — Affordable Protection, Delivered Digitally",
  description:
    "Accident cash assistance up to ₱100,000 for ₱500 over 6 months. Join AnzenCare — because we care.",
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh w-full overflow-x-clip bg-[#f7f9fc] text-[#14264f]">
      {/* —— Sticky glass header —— */}
      <header className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/anzencare-logo-tr.png"
              alt="AnzenCare"
              width={120}
              height={120}
              className="h-10 w-auto object-contain"
            />
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-semibold text-[#1e4a9e] transition-colors hover:text-[#c62828] sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "group/cta h-10 rounded-full bg-[#1e4a9e] px-5 text-sm font-semibold text-white transition-all hover:bg-[#163a7d] hover:shadow-[0_8px_24px_-8px_rgba(30,74,158,0.6)]"
              )}
            >
              Get protected
              <ArrowRight className="cta-arrow size-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* —— Hero —— */}
      <section className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,_#c5d4f5_0%,_transparent_50%),radial-gradient(ellipse_at_95%_20%,_#f5c2c24d_0%,_transparent_40%),linear-gradient(180deg,_#eef2fb_0%,_#f7f9fc_70%,_#ffffff_100%)]" />
        <div className="animate-glow-pulse pointer-events-none absolute -left-28 top-24 size-80 rounded-full bg-[#1e4a9e]/15 blur-3xl" />
        <div className="animate-glow-pulse pointer-events-none absolute -right-24 top-48 size-72 rounded-full bg-[#c62828]/10 blur-3xl [animation-delay:1.4s]" />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-12 md:grid-cols-2 md:gap-8 md:px-8 md:pb-28 md:pt-16">
          {/* Copy */}
          <div className="text-center md:text-left">
            <Reveal variant="up">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#1e4a9e]/15 bg-white/80 px-4 py-1.5 text-xs font-semibold text-[#1e4a9e] shadow-sm">
                <span className="relative flex size-2">
                  <span className="animate-ping-dot absolute inline-flex size-2 rounded-full bg-[#c62828]" />
                  <span className="relative inline-flex size-2 rounded-full bg-[#c62828]" />
                </span>
                Now accepting members
              </span>
            </Reveal>

            <Reveal variant="up" delay={100}>
              <h1 className="font-display mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-[#14264f] sm:text-5xl lg:text-6xl">
                Protection your{" "}
                <span className="bg-gradient-to-r from-[#1e4a9e] via-[#2a5bb8] to-[#c62828] bg-clip-text text-transparent">
                  family
                </span>{" "}
                can count on.
              </h1>
            </Reveal>

            <Reveal variant="up" delay={200}>
              <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-[#3a4a6b] sm:text-lg md:mx-0">
                Accident cash assistance up to{" "}
                <strong className="font-semibold text-[#14264f]">
                  ₱100,000
                </strong>{" "}
                — for just ₱500 over 6 months. Register, pay, and get your
                digital insurance card in minutes.
              </p>
            </Reveal>

            <Reveal variant="up" delay={300}>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "btn-shimmer group/cta h-13 rounded-full bg-[#1e4a9e] px-8 text-base font-semibold text-white transition-all hover:bg-[#163a7d] hover:shadow-[0_12px_32px_-8px_rgba(30,74,158,0.55)] active:scale-[0.97]"
                  )}
                >
                  Get protected — ₱500
                  <ArrowRight className="cta-arrow size-5" />
                </Link>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-13 rounded-full border-[#1e4a9e]/25 bg-white/80 px-8 text-base font-semibold text-[#1e4a9e] transition-all hover:bg-white hover:shadow-md active:scale-[0.97]"
                  )}
                >
                  Sign in
                </Link>
              </div>
            </Reveal>

            <Reveal variant="up" delay={400}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-[#6b7a98] md:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="size-4 text-[#1e4a9e]" />
                  QR-verified card
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="size-4 text-[#1e4a9e]" />
                  100% digital
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <HeartHandshake className="size-4 text-[#c62828]" />
                  Because we care
                </span>
              </div>
            </Reveal>
          </div>

          {/* Visual */}
          <Reveal variant="scale" delay={200} className="relative">
            <div className="relative mx-auto w-[min(100%,26rem)]">
              <div className="animate-float">
                <Image
                  src="/hero-family-protection.png"
                  alt="A family protected under the AnzenCare shield"
                  width={820}
                  height={820}
                  priority
                  className="h-auto w-full rounded-[2.5rem] object-contain drop-shadow-[0_30px_60px_rgba(30,74,158,0.22)]"
                />
              </div>

              {/* Floating stat chips */}
              <div className="animate-bob absolute -left-3 top-10 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-[0_12px_32px_-12px_rgba(30,74,158,0.35)] backdrop-blur-sm sm:-left-8">
                <p className="text-[10px] font-semibold tracking-wide text-[#6b7a98] uppercase">
                  Coverage
                </p>
                <p className="font-display text-lg font-semibold text-[#1e4a9e]">
                  ₱100,000
                </p>
              </div>
              <div className="animate-bob absolute -right-2 bottom-16 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-[0_12px_32px_-12px_rgba(198,40,40,0.35)] backdrop-blur-sm [animation-delay:1.2s] sm:-right-6">
                <p className="text-[10px] font-semibold tracking-wide text-[#6b7a98] uppercase">
                  Subscription
                </p>
                <p className="font-display text-lg font-semibold text-[#c62828]">
                  ₱500 / 6 mos
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* —— Stats strip —— */}
      <section className="relative z-10 w-full px-5 md:px-8">
        <Reveal variant="up">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-[#1e4a9e]/10 bg-[#1e4a9e]/10 shadow-[0_20px_50px_-25px_rgba(30,74,158,0.35)] sm:grid-cols-4">
            {[
              { icon: Banknote, value: "₱500", label: "One-time subscription" },
              { icon: ShieldCheck, value: "₱100,000", label: "Max cash assistance" },
              { icon: Clock3, value: "6 months", label: "Coverage period" },
              { icon: Users, value: "5 levels", label: "Referral earnings" },
            ].map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="group flex flex-col items-center gap-1 bg-white px-4 py-7 text-center transition-colors hover:bg-[#f2f6ff]"
              >
                <Icon className="size-5 text-[#1e4a9e] transition-transform duration-300 group-hover:scale-110 group-hover:text-[#c62828]" />
                <p className="font-display mt-1 text-xl font-semibold text-[#14264f] sm:text-2xl">
                  {value}
                </p>
                <p className="text-xs text-[#6b7a98]">{label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* —— Digital card feature —— */}
      <section className="w-full px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-16">
          <Reveal variant="left" className="order-2 md:order-1">
            <div className="animate-float-slow relative mx-auto w-[min(100%,22rem)]">
              <Image
                src="/feature-digital-card.png"
                alt="AnzenCare digital insurance card on a smartphone"
                width={820}
                height={820}
                className="h-auto w-full rounded-[2.5rem] object-contain drop-shadow-[0_30px_60px_rgba(30,74,158,0.2)]"
              />
            </div>
          </Reveal>

          <div className="order-1 md:order-2">
            <Reveal variant="right">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#1e4a9e]/8 px-4 py-1.5 text-xs font-semibold text-[#1e4a9e]">
                <CreditCard className="size-3.5" />
                Digital Insurance Card
              </span>
              <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-[#14264f] md:text-4xl">
                Your proof of protection, always in your pocket.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#3a4a6b]">
                The moment your subscription activates, your card is ready — no
                plastic, no waiting, no lost cards.
              </p>
            </Reveal>

            <div className="mt-8 space-y-3">
              {[
                {
                  icon: QrCode,
                  title: "QR verification",
                  body: "Anyone can scan to confirm your coverage is active in seconds.",
                },
                {
                  icon: ShieldCheck,
                  title: "Live coverage status",
                  body: "Active, expiry, and coverage amount — always up to date.",
                },
                {
                  icon: Smartphone,
                  title: "Works on any phone",
                  body: "No app store needed. Your card lives right in the web app.",
                },
              ].map(({ icon: Icon, title, body }, i) => (
                <Reveal key={title} variant="right" delay={100 + i * 100}>
                  <div className="card-lift flex items-start gap-4 rounded-2xl border border-[#1e4a9e]/10 bg-white p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1e4a9e]/8 text-[#1e4a9e]">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#14264f]">{title}</p>
                      <p className="mt-0.5 text-sm text-[#3a4a6b]">{body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* —— How it works —— */}
      <section className="w-full bg-[#14264f] px-5 py-20 text-white md:px-8 md:py-28">
        <div className="mx-auto w-full max-w-6xl">
          <Reveal variant="up">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90">
                <Clock3 className="size-3.5" />
                Ready in minutes
              </span>
              <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                Three steps to peace of mind
              </h2>
              <p className="mt-3 text-base leading-relaxed text-white/70">
                Register online, pay securely, and activate your protection —
                all from your phone.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: Users,
                title: "Register",
                body: "Create your member profile and add your beneficiary.",
              },
              {
                step: "02",
                icon: Wallet,
                title: "Pay ₱500",
                body: "QRPH, GCash, Maya, cards, or online banking — your choice.",
              },
              {
                step: "03",
                icon: ShieldCheck,
                title: "Get covered",
                body: "Receive your digital card and stay protected for 6 months.",
              },
            ].map(({ step, icon: Icon, title, body }, i) => (
              <Reveal key={step} variant="up" delay={i * 130}>
                <div className="card-lift group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                  <span className="font-display absolute -right-2 -top-4 text-7xl font-semibold text-white/5 transition-colors duration-300 group-hover:text-white/10">
                    {step}
                  </span>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2a5bb8] to-[#1e4a9e] shadow-[0_8px_20px_-6px_rgba(42,91,184,0.6)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="size-6 text-white" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">
                    {body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* —— Referral —— */}
      <section className="w-full px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-16">
          <div>
            <Reveal variant="left">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#c62828]/8 px-4 py-1.5 text-xs font-semibold text-[#c62828]">
                <Users className="size-3.5" />
                Referral Program
              </span>
              <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-[#14264f] md:text-4xl">
                Share care. Earn up to ₱200 per member.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#3a4a6b]">
                Every activated plan pays commissions across 5 levels of your
                connections — and again on every renewal.
              </p>
            </Reveal>

            <Reveal variant="left" delay={150}>
              <div className="mt-8 grid grid-cols-5 gap-2">
                {[
                  { level: "L1", amount: "₱100" },
                  { level: "L2", amount: "₱50" },
                  { level: "L3", amount: "₱25" },
                  { level: "L4", amount: "₱15" },
                  { level: "L5", amount: "₱10" },
                ].map(({ level, amount }, i) => (
                  <div
                    key={level}
                    className="card-lift rounded-2xl border border-[#1e4a9e]/10 bg-white px-2 py-4 text-center"
                    style={{ transitionDelay: `${i * 40}ms` }}
                  >
                    <p className="text-[10px] font-semibold tracking-wide text-[#6b7a98] uppercase">
                      {level}
                    </p>
                    <p className="font-display mt-1 text-sm font-semibold text-[#1e4a9e] sm:text-base">
                      {amount}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal variant="left" delay={250}>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group/cta mt-8 h-13 rounded-full bg-[#c62828] px-8 text-base font-semibold text-white transition-all hover:bg-[#a51f1f] hover:shadow-[0_12px_32px_-8px_rgba(198,40,40,0.55)] active:scale-[0.97]"
                )}
              >
                Start earning
                <ArrowRight className="cta-arrow size-5" />
              </Link>
            </Reveal>
          </div>

          <Reveal variant="right" delay={100}>
            <div className="animate-float-slow relative mx-auto w-[min(100%,24rem)]">
              <Image
                src="/feature-referral-shields.png"
                alt="One AnzenCare protection extending to five more across your referrals"
                width={820}
                height={820}
                className="h-auto w-full rounded-[2.5rem] object-contain drop-shadow-[0_30px_60px_rgba(198,40,40,0.15)]"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* —— CTA banner —— */}
      <section className="w-full px-5 pb-20 md:px-8 md:pb-28">
        <Reveal variant="scale">
          <div className="animate-gradient-pan relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#1e4a9e] via-[#2a5bb8] to-[#14264f] px-6 py-16 text-center text-white shadow-[0_30px_70px_-30px_rgba(30,74,158,0.6)] md:px-12 md:py-20">
            <div className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-10 size-64 rounded-full bg-[#c62828]/25 blur-3xl" />
            <div className="relative z-10">
              <h2 className="font-display mx-auto max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
                Because accidents don&apos;t wait. Neither should protection.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-white/75">
                Join AnzenCare today — ₱500 for 6 months of accident cash
                assistance up to ₱100,000.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "btn-shimmer group/cta h-13 rounded-full bg-white px-8 text-base font-semibold text-[#1e4a9e] transition-all hover:bg-white/90 hover:shadow-[0_12px_32px_-8px_rgba(255,255,255,0.4)] active:scale-[0.97]"
                  )}
                >
                  Get protected now
                  <ArrowRight className="cta-arrow size-5" />
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Already a member? Sign in
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* —— Footer —— */}
      <footer className="w-full border-t border-[#1e4a9e]/10 bg-white px-5 py-10 md:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <Image
            src="/anzencare-logo-tr.png"
            alt="AnzenCare"
            width={96}
            height={96}
            className="h-9 w-auto object-contain"
          />
          <p className="text-xs text-[#6b7a98]">
            © {new Date().getFullYear()} AnzenCare. Affordable Protection,
            Delivered Digitally. Because We Care.
          </p>
        </div>
      </footer>
    </div>
  );
}
