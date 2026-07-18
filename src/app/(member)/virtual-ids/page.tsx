import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { ShieldCheck } from "lucide-react";

import { getProfile, getVirtualIds } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Virtual IDs",
};

const statusStyles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  expired: "bg-red-100 text-red-700",
  suspended: "bg-amber-100 text-amber-700",
};

async function makeQr(token: string): Promise<string> {
  return QRCode.toDataURL(`https://anzencare.ph/verify/${token}`, {
    margin: 1,
    width: 240,
    color: { dark: "#14264f", light: "#ffffff" },
  });
}

export default async function VirtualIdsPage() {
  const [profile, virtualIds] = await Promise.all([
    getProfile(),
    getVirtualIds(),
  ]);

  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const cards = await Promise.all(
    virtualIds.map(async (v) => ({
      ...v,
      qrDataUrl: await makeQr(v.qr_token),
    }))
  );

  return (
    <div className="px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Virtual IDs
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your digital insurance cards. Show the QR for verification.
      </p>

      {cards.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-brand-soft/40 px-6 py-14 text-center">
          <ShieldCheck className="mx-auto size-8 text-brand-mid" />
          <p className="mt-3 font-semibold text-foreground">No virtual ID yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Activate an insurance plan to get your digital card.
          </p>
          <Link
            href="/insurances"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-brand-mid px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep"
          >
            Browse insurances
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {cards.map((card) => {
            const productName =
              card.membership?.product?.name ?? "AnzenCare Plan";
            return (
              <article
                key={card.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-deep via-brand-mid to-brand-glow p-5 text-white shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold leading-tight">
                        AnzenCare
                      </p>
                      <p className="text-[10px] text-white/70">{productName}</p>
                    </div>
                  </div>
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize " +
                      (statusStyles[card.status] ?? "bg-white/20 text-white")
                    }
                  >
                    {card.status}
                  </span>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-white/60">
                      Member
                    </p>
                    <p className="truncate text-lg font-semibold">
                      {fullName || "Member"}
                    </p>
                    <p className="mt-2 text-[10px] uppercase tracking-wide text-white/60">
                      Member ID
                    </p>
                    <p className="font-mono text-sm font-semibold tracking-wider">
                      {card.member_id}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl bg-white p-2">
                    <Image
                      src={card.qrDataUrl}
                      alt={`QR for ${card.member_id}`}
                      width={96}
                      height={96}
                      unoptimized
                      className="size-24"
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-3 text-xs text-white/75">
                  <span>Issued {formatDate(card.issued_at)}</span>
                  <span>Expires {formatDate(card.expiry_date)}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
