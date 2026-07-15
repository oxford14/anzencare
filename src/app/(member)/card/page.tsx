import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insurance Card",
};

export default function CardPage() {
  return (
    <Placeholder
      title="Digital Insurance Card"
      body="Your photo, member ID, coverage dates, and QR verification will appear here."
    />
  );
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-full flex-col px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <div className="mt-8 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-brand-soft/40 px-6 py-16 text-center text-sm text-muted-foreground">
        Coming soon
      </div>
    </div>
  );
}
