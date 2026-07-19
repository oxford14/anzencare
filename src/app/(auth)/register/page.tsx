import { Suspense } from "react";
import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-brand-deep text-white">
          Loading…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
