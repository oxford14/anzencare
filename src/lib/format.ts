export function formatPeso(amount: number | string | null | undefined): string {
  const value = typeof amount === "string" ? Number(amount) : amount ?? 0;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value as number) ? (value as number) : 0);
}

export function formatDate(
  value: string | null | undefined,
  opts?: Intl.DateTimeFormatOptions
): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(
    "en-PH",
    opts ?? { year: "numeric", month: "short", day: "numeric" }
  ).format(d);
}

export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "—";
  // 639171234567 -> 0917 123 4567
  const d = phone.replace(/[^0-9]/g, "");
  if (d.startsWith("63") && d.length === 12) {
    const local = `0${d.slice(2)}`;
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
  return phone;
}
