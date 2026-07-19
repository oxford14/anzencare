/**
 * Saved payout accounts: e-wallet (GCash/Maya) or bank transfer.
 * Bank names map to PayMongo InstaPay receiving-institution names used
 * when disbursing payouts.
 */

export type WithdrawalAccountType = "GCash" | "Maya" | "Bank Account";

export type WithdrawalAccountCategory = "ewallet" | "bank";

export interface WithdrawalAccountTypeConfig {
  value: WithdrawalAccountType;
  label: string;
  category: WithdrawalAccountCategory;
  numberLabel: string;
  placeholder: string;
  hint: string;
  /** Exact length for e-wallets */
  digits?: number;
  /** Inclusive range for bank account numbers */
  minDigits?: number;
  maxDigits?: number;
  requiresBank: boolean;
}

export const PH_BANKS = [
  "BDO Unibank",
  "BPI",
  "Metrobank",
  "Landbank",
  "PNB",
  "Security Bank",
  "UnionBank",
  "RCBC",
  "China Bank",
  "EastWest Bank",
  "AUB",
  "PSBank",
  "Robinsons Bank",
  "GoTyme",
  "Maribank",
  "Other",
] as const;

export type PhilippineBank = (typeof PH_BANKS)[number];

export const WITHDRAWAL_ACCOUNT_TYPES: WithdrawalAccountTypeConfig[] = [
  {
    value: "GCash",
    label: "GCash",
    category: "ewallet",
    digits: 11,
    numberLabel: "Mobile Number",
    placeholder: "09XX XXX XXXX",
    hint: "11-digit Philippine mobile number starting with 09",
    requiresBank: false,
  },
  {
    value: "Maya",
    label: "Maya",
    category: "ewallet",
    digits: 11,
    numberLabel: "Mobile Number",
    placeholder: "09XX XXX XXXX",
    hint: "11-digit Philippine mobile number starting with 09",
    requiresBank: false,
  },
  {
    value: "Bank Account",
    label: "Bank Account",
    category: "bank",
    minDigits: 10,
    maxDigits: 16,
    numberLabel: "Account Number",
    placeholder: "Enter bank account number",
    hint: "10-16 digit account number from your bank",
    requiresBank: true,
  },
];

export function getAccountTypeConfig(
  accountType: string
): WithdrawalAccountTypeConfig | undefined {
  return WITHDRAWAL_ACCOUNT_TYPES.find((t) => t.value === accountType);
}

export function stripAccountNumber(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatAccountNumber(accountType: string, raw: string): string {
  const config = getAccountTypeConfig(accountType);
  if (!config) return raw.trim();

  const digits = stripAccountNumber(raw);

  if (config.category === "ewallet") {
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  }

  return digits;
}

export function validateAccountNumber(
  accountType: string,
  accountNumber: string
): string | null {
  const config = getAccountTypeConfig(accountType);
  if (!config) return "Invalid account type";

  const digits = stripAccountNumber(accountNumber);

  if (config.category === "ewallet") {
    if (digits.length !== config.digits) {
      return `${config.numberLabel} must be exactly ${config.digits} digits`;
    }
    if (!digits.startsWith("09")) {
      return "Philippine mobile numbers must start with 09";
    }
    return null;
  }

  const min = config.minDigits ?? 10;
  const max = config.maxDigits ?? 16;
  if (digits.length < min || digits.length > max) {
    return `${config.numberLabel} must be ${min}-${max} digits`;
  }

  return null;
}

export function validateBankName(
  accountType: string,
  bankName?: string
): string | null {
  const config = getAccountTypeConfig(accountType);
  if (!config?.requiresBank) return null;
  if (!bankName?.trim()) return "Bank name is required";
  return null;
}

export function validateWithdrawalAccount(data: {
  accountType: string;
  accountNumber: string;
  bankName?: string;
}): string | null {
  const bankError = validateBankName(data.accountType, data.bankName);
  if (bankError) return bankError;
  return validateAccountNumber(data.accountType, data.accountNumber);
}

export function normalizeAccountNumber(
  accountType: string,
  accountNumber: string
): string {
  return stripAccountNumber(accountNumber);
}

export function getDigitProgress(
  accountType: string,
  accountNumber: string
): { current: number; label: string; complete: boolean } {
  const config = getAccountTypeConfig(accountType);
  const current = stripAccountNumber(accountNumber).length;

  if (!config) return { current, label: "", complete: false };

  if (config.digits) {
    return {
      current,
      label: `${current}/${config.digits}`,
      complete: current === config.digits,
    };
  }

  const min = config.minDigits ?? 10;
  const max = config.maxDigits ?? 16;
  return {
    current,
    label: `${current} (${min}-${max})`,
    complete: current >= min && current <= max,
  };
}

export function maskAccountNumber(
  accountType: string,
  accountNumber: string
): string {
  const config = getAccountTypeConfig(accountType);
  const digits = stripAccountNumber(accountNumber);
  if (!config || digits.length < 4) return accountNumber;
  if (config.category === "ewallet") {
    return `${digits.slice(0, 4)} •••• ${digits.slice(-4)}`;
  }
  return `•••• ${digits.slice(-4)}`;
}

/** PayMongo InstaPay institution names (from PayMongo receiving_institutions). */
const INSTAPAY_GCASH = "G-Xchange, Inc.";
const INSTAPAY_MAYA = "Maya Philippines, Inc.";

const BANK_TO_INSTAPAY: Record<string, string> = {
  "BDO Unibank": "BDO Unibank, Inc.",
  BPI: "Bank of the Philippine Islands / BPI Family",
  Metrobank: "Metropolitan Bank and Trust Company",
  Landbank: "Land Bank of The Philippines",
  PNB: "Philippine National Bank",
  "Security Bank": "Security Bank Corporation",
  UnionBank: "Union Bank of the Philippines",
  RCBC: "Rizal Commercial Banking Corporation",
  "China Bank": "China Banking Corporation",
  "EastWest Bank": "East West Banking Corporation",
  AUB: "Asia United Bank Corporation",
  PSBank: "Philippine Savings Bank",
  "Robinsons Bank": "Robinsons Bank Corporation",
  GoTyme: "GoTyme Bank Corporation",
  Maribank: "MariBank Philippines, Inc.",
};

export interface PayoutAccountSnapshot {
  accountType: string;
  accountNumber: string;
  accountName: string;
  bankName?: string | null;
}

/** Resolve the InstaPay institution name we should match against PayMongo. */
export function resolveInstapayBankName(account: PayoutAccountSnapshot): string {
  const type = account.accountType.trim();
  if (type === "GCash") return INSTAPAY_GCASH;
  if (type === "Maya") return INSTAPAY_MAYA;
  if (account.bankName) {
    const mapped = BANK_TO_INSTAPAY[account.bankName];
    if (mapped) return mapped;
  }
  return account.bankName?.trim() || type;
}
