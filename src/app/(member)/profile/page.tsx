import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <div className="px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Profile
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Personal info, beneficiary, and KYC documents.
      </p>
      <div className="mt-6 rounded-2xl border border-dashed border-border bg-brand-soft/40 px-6 py-16 text-center text-sm text-muted-foreground">
        Coming soon
      </div>
    </div>
  );
}
