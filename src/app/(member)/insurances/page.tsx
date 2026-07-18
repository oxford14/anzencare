import type { Metadata } from "next";
import Link from "next/link";
import { Car, CheckCircle2, Flame, ShieldCheck } from "lucide-react";

import { getInsuranceProducts, getMemberships } from "@/lib/queries";
import { formatPeso } from "@/lib/format";

export const metadata: Metadata = {
  title: "Insurances",
};

const productIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  accident: ShieldCheck,
  fire: Flame,
  car: Car,
};

export default async function InsurancesPage() {
  const [products, memberships] = await Promise.all([
    getInsuranceProducts(),
    getMemberships(),
  ]);

  const activeProductIds = new Set(
    memberships
      .filter((m) => m.status === "active")
      .map((m) => m.product_id)
  );

  return (
    <div className="pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="px-5">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Insurances
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Affordable, digital protection for what matters most.
        </p>
      </div>

      {/* Carousel */}
      <div className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => {
          const Icon = productIcons[product.slug] ?? ShieldCheck;
          const available = product.status === "available";
          const isActive = activeProductIds.has(product.id);

          return (
            <article
              key={product.id}
              className="relative flex w-[85%] max-w-[20rem] shrink-0 snap-center flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm"
            >
              <div className="relative bg-gradient-to-br from-brand-deep via-brand-mid to-brand-glow p-6 text-white">
                <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-white/10" />
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                  <Icon className="size-6 text-white" />
                </div>
                <h2 className="font-display mt-4 text-xl font-semibold">
                  {product.name}
                </h2>
                {available ? (
                  <p className="mt-1 text-sm text-white/85">
                    {formatPeso(product.price)} / {product.term_months} months
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-white/85">Coming soon</p>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>

                {available && (
                  <ul className="mt-4 space-y-2 text-sm text-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-brand-mid" />
                      Up to {formatPeso(product.coverage_amount)} cash assistance
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-brand-mid" />
                      Digital insurance card + QR
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-brand-mid" />
                      {product.term_months}-month coverage
                    </li>
                  </ul>
                )}

                <div className="mt-5 pt-1">
                  {!available ? (
                    <button
                      disabled
                      className="h-11 w-full cursor-not-allowed rounded-xl bg-muted text-sm font-semibold text-muted-foreground"
                    >
                      Coming soon
                    </button>
                  ) : isActive ? (
                    <Link
                      href="/virtual-ids"
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-soft text-sm font-semibold text-brand-deep"
                    >
                      <CheckCircle2 className="size-4" />
                      Active — view card
                    </Link>
                  ) : (
                    <Link
                      href="/insurances/accident/activate"
                      className="flex h-11 w-full items-center justify-center rounded-xl bg-brand-mid text-sm font-semibold text-white transition-colors hover:bg-brand-deep active:scale-[0.98]"
                    >
                      Activate for {formatPeso(product.price)}
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mx-5 mt-2 rounded-2xl bg-brand-soft/60 px-4 py-3 text-xs text-muted-foreground">
        Swipe to explore plans. KYC verification is completed when you activate a
        plan.
      </div>
    </div>
  );
}
