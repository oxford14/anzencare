"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff, X } from "lucide-react";

type Photo = {
  label: string;
  url: string | null;
};

export function PhotoViewer({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState<Photo | null>(null);

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {photos.map((photo) => (
          <div key={photo.label} className="w-28">
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">
              {photo.label}
            </p>
            {photo.url ? (
              <button
                type="button"
                onClick={() => setActive(photo)}
                className="block aspect-[3/4] w-full overflow-hidden rounded-xl border border-border/70 bg-muted transition-opacity hover:opacity-90"
              >
                <Image
                  src={photo.url}
                  alt={photo.label}
                  width={160}
                  height={213}
                  unoptimized
                  className="size-full object-cover"
                />
              </button>
            ) : (
              <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground">
                <ImageOff className="size-5" />
                <span className="text-[10px]">No image</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {active?.url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex size-10 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm transition-colors hover:bg-white/25"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <div
            className="max-h-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2 text-center text-sm font-medium text-white/90">
              {active.label}
            </p>
            <Image
              src={active.url}
              alt={active.label}
              width={1200}
              height={1600}
              unoptimized
              className="max-h-[80vh] w-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
