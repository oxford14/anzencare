"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { formatPeso } from "@/lib/format";
import { compressImage } from "@/lib/image";
import {
  CIVIL_STATUS_OPTIONS,
  DEFAULT_NATIONALITY,
  GOV_ID_TYPE_OPTIONS,
  SEX_OPTIONS,
} from "@/lib/insurance/options";

type Props = {
  price: number;
  coverageAmount: number;
  termMonths: number;
  productId: string;
  balance: number;
  initial: {
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
};

const selectClassName =
  "h-11 w-full rounded-xl border border-input bg-transparent px-2.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm";

export function ActivationForm({
  price,
  coverageAmount,
  termMonths,
  productId,
  balance,
  initial,
}: Props) {
  const router = useRouter();

  const insufficientBalance = balance < price;

  // Subscriber
  const [firstName, setFirstName] = useState(initial.first_name ?? "");
  const [middleName, setMiddleName] = useState(initial.middle_name ?? "");
  const [lastName, setLastName] = useState(initial.last_name ?? "");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [nationality, setNationality] = useState(DEFAULT_NATIONALITY);
  const [occupation, setOccupation] = useState("");
  const [email, setEmail] = useState(initial.email ?? "");
  const [subscriberMobile, setSubscriberMobile] = useState(initial.phone ?? "");
  const [govIdType, setGovIdType] = useState("");
  const [govIdNumber, setGovIdNumber] = useState("");

  // Address
  const [addressLine, setAddressLine] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Beneficiary
  const [fullName, setFullName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [mobile, setMobile] = useState("");
  const [beneficiaryDob, setBeneficiaryDob] = useState("");

  // KYC
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
    const optimized = await compressImage(file, { maxEdge: 1600, quality: 0.85 });
    const ext = optimized.name.split(".").pop() || "jpg";
    const path = `${userId}/${label}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("kyc")
      .upload(path, optimized, {
        upsert: true,
        contentType: optimized.type || undefined,
      });
    if (uploadError) throw uploadError;
    return path;
  }

  function validate(): string | null {
    if (!firstName.trim() || !lastName.trim()) {
      return "Please enter the subscriber's first and last name.";
    }
    if (!dateOfBirth) return "Please enter the subscriber's date of birth.";
    if (!sex) return "Please select the subscriber's sex.";
    if (!civilStatus) return "Please select the subscriber's civil status.";
    if (!nationality.trim()) return "Please enter the subscriber's nationality.";
    if (!occupation.trim()) return "Please enter the subscriber's occupation.";
    if (!subscriberMobile.trim()) return "Please enter the subscriber's mobile number.";
    if (!govIdType) return "Please select the government ID type.";
    if (!govIdNumber.trim()) return "Please enter the government ID number.";
    if (!addressLine.trim()) return "Please enter the house/unit and street.";
    if (!barangay.trim()) return "Please enter the barangay.";
    if (!city.trim()) return "Please enter the city or municipality.";
    if (!province.trim()) return "Please enter the province.";
    if (!postalCode.trim()) return "Please enter the postal code.";
    if (!fullName.trim()) return "Please enter your beneficiary's full name.";
    if (!govId || !selfie) {
      return "Please upload your government ID and a selfie for KYC.";
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
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

      const govIdPath = await uploadDoc(supabase, user.id, govId!, "government_id");
      const selfiePath = await uploadDoc(supabase, user.id, selfie!, "selfie");

      // Submit for admin review; the plan price is charged to the wallet and
      // held until an admin approves (finalized) or denies (refunded).
      const { error: rpcError } = await supabase.rpc(
        "submit_insurance_application",
        {
          p_product_id: productId,
          p_gov_id_path: govIdPath,
          p_selfie_path: selfiePath,
          p_payload: {
            first_name: firstName.trim(),
            middle_name: middleName.trim(),
            last_name: lastName.trim(),
            date_of_birth: dateOfBirth,
            sex,
            civil_status: civilStatus,
            nationality: nationality.trim(),
            occupation: occupation.trim(),
            email: email.trim(),
            mobile: subscriberMobile.trim(),
            gov_id_type: govIdType,
            gov_id_number: govIdNumber.trim(),
            address_line: addressLine.trim(),
            barangay: barangay.trim(),
            city: city.trim(),
            province: province.trim(),
            postal_code: postalCode.trim(),
            beneficiary_full_name: fullName.trim(),
            beneficiary_relationship: relationship.trim(),
            beneficiary_mobile: mobile.trim(),
            beneficiary_date_of_birth: beneficiaryDob,
          },
        }
      );

      if (rpcError) {
        setError(
          rpcError.message.includes("Insufficient wallet balance")
            ? "Your wallet balance is not enough to cover this plan. Please top up and try again."
            : rpcError.message
        );
        return;
      }

      router.refresh();
      router.push("/insurances/accident/activate");
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
        <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-sm">
          <span className="text-white/75">
            Charged from wallet on submit
          </span>
          <span className="font-semibold">{formatPeso(price)}</span>
        </div>
        <p className="mt-1 text-xs text-white/70">
          Wallet balance: {formatPeso(balance)}
        </p>
      </div>

      {insufficientBalance && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          Your wallet balance is not enough to cover this plan.{" "}
          <Link href="/wallet" className="font-semibold underline">
            Top up your wallet
          </Link>{" "}
          to continue.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">
          Subscriber details
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-11 rounded-xl"
            autoComplete="given-name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="middleName">
              Middle name{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="middleName"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="h-11 rounded-xl"
              autoComplete="additional-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-11 rounded-xl"
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="h-11 rounded-xl"
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sex">Sex</Label>
            <select
              id="sex"
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className={selectClassName}
            >
              <option value="">Select</option>
              {SEX_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="civilStatus">Civil status</Label>
            <select
              id="civilStatus"
              value={civilStatus}
              onChange={(e) => setCivilStatus(e.target.value)}
              className={selectClassName}
            >
              <option value="">Select</option>
              {CIVIL_STATUS_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            className="h-11 rounded-xl"
            placeholder="e.g. Teacher"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="subscriberMobile">Mobile</Label>
            <Input
              id="subscriberMobile"
              type="tel"
              inputMode="tel"
              placeholder="09XX XXX XXXX"
              value={subscriberMobile}
              onChange={(e) => setSubscriberMobile(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">
              Email{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="govIdType">Government ID type</Label>
          <select
            id="govIdType"
            value={govIdType}
            onChange={(e) => setGovIdType(e.target.value)}
            className={selectClassName}
          >
            <option value="">Select</option>
            {GOV_ID_TYPE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="govIdNumber">Government ID number</Label>
          <Input
            id="govIdNumber"
            value={govIdNumber}
            onChange={(e) => setGovIdNumber(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Present address</h2>

        <div className="space-y-1.5">
          <Label htmlFor="addressLine">House/Unit no. & street</Label>
          <Input
            id="addressLine"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            className="h-11 rounded-xl"
            autoComplete="address-line1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="barangay">Barangay</Label>
            <Input
              id="barangay"
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City / Municipality</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="province">Province</Label>
            <Input
              id="province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="postalCode">Postal code</Label>
            <Input
              id="postalCode"
              inputMode="numeric"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="h-11 rounded-xl"
              autoComplete="postal-code"
            />
          </div>
        </div>
      </section>

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
        <div className="space-y-1.5">
          <Label htmlFor="beneficiaryDob">
            Date of birth{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="beneficiaryDob"
            type="date"
            value={beneficiaryDob}
            onChange={(e) => setBeneficiaryDob(e.target.value)}
            className="h-11 rounded-xl"
            max={new Date().toISOString().split("T")[0]}
          />
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
        disabled={loading || insufficientBalance}
        className="h-12 w-full rounded-xl text-base font-semibold"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Submitting…
          </>
        ) : insufficientBalance ? (
          "Insufficient wallet balance"
        ) : (
          `Submit & pay ${formatPeso(price)}`
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
