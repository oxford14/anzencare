"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Animation style */
  variant?: "up" | "left" | "right" | "scale";
  /** Transition delay in ms */
  delay?: number;
};

export function Reveal({
  children,
  className,
  variant = "up",
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        !visible && "opacity-0",
        !visible && variant === "up" && "translate-y-8",
        !visible && variant === "left" && "-translate-x-10",
        !visible && variant === "right" && "translate-x-10",
        !visible && variant === "scale" && "scale-95",
        visible && "translate-x-0 translate-y-0 scale-100 opacity-100",
        className
      )}
    >
      {children}
    </div>
  );
}
