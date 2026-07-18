"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { formatPeso } from "@/lib/format";

type Props = {
  price: number;
  coverageAmount: number;
  termMonths: number;
};

export function ActivationForm({ price, coverageAmount, termMonths }: Props) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [mobile, setMobile] = useState("");
  const [govId, setGovId] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function uploadDoc(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    file: File,
    label: string
  ): Promise<string> {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${label}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("kyc")
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;
    return path;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your beneficiary's full name.");
      return;
    }
    if (!govId || !selfie) {
      setError("Please upload your government ID and a selfie for KYC.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Your session expired. Please sign in again.");
        return;
      }

      const govIdPath = await uploadDoc(supabase, user.id, govId, "government_id");
      const selfiePath = await uploadDoc(supabase, user.id, selfie, "selfie");

      const { error: rpcError } = await supabase.rpc("activate_accident_plan", {
        p_full_name: fullName.trim(),
        p_relationship: relationship.trim(),
        p_mobile: mobile.trim(),
        p_gov_id_path: govIdPath,
        p_selfie_path: selfiePath,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      router.push("/virtual-ids");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="rounded-2xl bg-gradient-to-br from-brand-deep to-brand-mid p-5 text-white">
        <p className="text-xs text-white/75">Accident Protection</p>
        <p className="font-display mt-1 text-2xl font-semibold">
          {formatPeso(price)}
        </p>
        <p className="mt-1 text-sm text-white/85">
          Up to {formatPeso(coverageAmount)} · {termMonths} months
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Beneficiary</h2>
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="relationship">Relationship</Label>
            <Input
              id="relationship"
              placeholder="e.g. Spouse"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mobile">Mobile</Label>
            <Input
              id="mobile"
              type="tel"
              inputMode="tel"
              placeholder="09XX XXX XXXX"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            KYC verification
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Upload a valid government ID and a selfie to verify your identity.
          </p>
        </div>
        <FileField
          id="govId"
          label="Government ID"
          file={govId}
          onChange={setGovId}
        />
        <FileField
          id="selfie"
          label="Selfie photo"
          file={selfie}
          onChange={setSelfie}
        />
      </section>

      <Button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-xl text-base font-semibold"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Activating…
          </>
        ) : (
          `Activate for ${formatPeso(price)}`
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        By activating you agree to the AnzenCare terms and coverage validation.
      </p>
    </form>
  );
}

function FileField({
  id,
  label,
  file,
  onChange,
}: {
  id: string;
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm transition-colors hover:border-brand-mid/50"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-mid">
          <Upload className="size-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          {file ? file.name : "Tap to upload"}
        </span>
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
