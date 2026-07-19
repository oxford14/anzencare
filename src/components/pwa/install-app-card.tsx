"use client";

import { useEffect, useState } from "react";
import { Download, Plus, Share, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppCard() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;
    setInstalled(standalone);

    const ua = nav.userAgent.toLowerCase();
    const iOS =
      /iphone|ipad|ipod/.test(ua) ||
      (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
    setIsIOS(iOS);

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setShowHelp(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function handleClick() {
    if (deferred) {
      await deferred.prompt();
      try {
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") setInstalled(true);
      } catch {
        /* user dismissed */
      }
      setDeferred(null);
      return;
    }
    setShowHelp(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-3 rounded-2xl border border-brand-mid/30 bg-brand-soft/60 p-4 text-left transition-colors active:bg-brand-soft"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-mid text-white">
          <Download className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-deep">Download app</p>
          <p className="text-xs text-muted-foreground">
            Install AnzenCare on your phone for quick access.
          </p>
        </div>
      </button>

      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Install AnzenCare
              </h2>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="rounded-full p-1 text-muted-foreground transition-colors active:bg-muted"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-3 text-sm text-foreground">
                <Step index={1}>
                  Make sure you&apos;re using{" "}
                  <span className="font-semibold">Safari</span>.
                </Step>
                <Step index={2}>
                  Tap the <span className="font-semibold">Share</span> icon{" "}
                  <Share className="inline size-4 align-text-bottom text-brand-mid" />{" "}
                  in the toolbar.
                </Step>
                <Step index={3}>
                  Choose{" "}
                  <span className="font-semibold">Add to Home Screen</span>{" "}
                  <Plus className="inline size-4 align-text-bottom text-brand-mid" />
                  , then tap <span className="font-semibold">Add</span>.
                </Step>
              </ol>
            ) : (
              <ol className="mt-4 space-y-3 text-sm text-foreground">
                <Step index={1}>
                  Open your browser menu (<span className="font-semibold">⋮</span>{" "}
                  or the address bar).
                </Step>
                <Step index={2}>
                  Tap{" "}
                  <span className="font-semibold">
                    Install app
                  </span>{" "}
                  or <span className="font-semibold">Add to Home screen</span>.
                </Step>
                <Step index={3}>Confirm to add AnzenCare to your device.</Step>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-5 h-11 w-full rounded-xl bg-brand-mid text-sm font-semibold text-white transition-colors active:bg-brand-deep"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Step({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-mid">
        {index}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}
