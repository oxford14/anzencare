import { cn } from "@/lib/utils";

type PhoneShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PhoneShell({ children, className }: PhoneShellProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,_#2a5bb8_0%,_#14264f_45%,_#0c1833_100%)] p-0 md:p-6">
      <div
        className={cn(
          "relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background shadow-none md:h-[min(844px,calc(100dvh-3rem))] md:rounded-[2rem] md:border md:border-white/15 md:shadow-[0_25px_80px_-20px_rgba(0,0,0,0.55)]",
          className
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden h-7 items-end justify-center md:flex">
          <div className="mb-1 h-1.5 w-24 rounded-full bg-foreground/15" />
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
