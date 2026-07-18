export default function MemberLoading() {
  return (
    <div className="animate-pulse px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="mb-6 space-y-2">
        <div className="h-3 w-24 rounded-full bg-muted" />
        <div className="h-7 w-40 rounded-lg bg-muted" />
      </div>

      <div className="mb-5 h-36 rounded-2xl bg-muted" />

      <div className="mb-6 grid grid-cols-3 gap-2">
        <div className="h-20 rounded-2xl bg-muted" />
        <div className="h-20 rounded-2xl bg-muted" />
        <div className="h-20 rounded-2xl bg-muted" />
      </div>

      <div className="space-y-2">
        <div className="h-4 w-28 rounded-full bg-muted" />
        <div className="h-14 rounded-2xl bg-muted" />
        <div className="h-14 rounded-2xl bg-muted" />
        <div className="h-14 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
