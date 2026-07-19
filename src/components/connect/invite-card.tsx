"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

type Props = {
  referralCode: string;
};

export function InviteCard({ referralCode }: Props) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  const inviteLink = origin
    ? `${origin}/register?ref=${referralCode}`
    : `/register?ref=${referralCode}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the link stays visible for manual copy.
    }
  }

  async function share() {
    try {
      await navigator.share({
        title: "Join AnzenCare",
        text: "Get affordable digital protection with AnzenCare. Use my referral code:",
        url: inviteLink,
      });
    } catch {
      // User dismissed the share sheet — no action needed.
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-deep via-brand-mid to-brand-glow p-5 text-white shadow-md">
      <p className="text-xs font-medium text-white/75">Your referral code</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="font-mono text-3xl font-semibold tracking-[0.2em]">
          {referralCode}
        </p>
        <button
          type="button"
          onClick={copyLink}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 transition-colors hover:bg-white/25"
          aria-label="Copy invite link"
        >
          {copied ? (
            <Check className="size-5" />
          ) : (
            <Copy className="size-5" />
          )}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-white/15">
        <span className="min-w-0 flex-1 truncate text-xs text-white/85">
          {inviteLink}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white/15 text-sm font-semibold ring-1 ring-white/25 transition-colors hover:bg-white/25 active:scale-[0.98]"
        >
          {copied ? (
            <>
              <Check className="size-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-4" />
              Copy link
            </>
          )}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={share}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-brand-deep transition-colors hover:bg-white/90 active:scale-[0.98]"
          >
            <Share2 className="size-4" />
            Invite
          </button>
        )}
      </div>
    </section>
  );
}
