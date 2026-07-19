"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onSignOut}
      disabled={signingOut}
      className="h-12 w-full rounded-xl border-destructive/30 font-semibold text-destructive hover:bg-destructive/10"
    >
      {signingOut ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <>
          <LogOut className="size-4" />
          Sign out
        </>
      )}
    </Button>
  );
}
