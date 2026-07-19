import crypto from "crypto";

import {
  normalizeAccountNumber,
  resolveInstapayBankName,
  type PayoutAccountSnapshot,
} from "@/lib/instapay-banks";

const PAYMONGO_V1 = "https://api.paymongo.com/v1";
const PAYMONGO_V2 = "https://api.paymongo.com/v2";
const PAYMONGO_WALLET_BIC = "PAEYPHM2XXX";
const INSTAPAY_MAX_CENTAVOS = 50_000 * 100;
const WEBHOOK_TOLERANCE_SEC = 300;

export const PAYOUT_DESCRIPTION = "AnzenCare Withdrawal";

/** Public base URL of the app, used for PayMongo callbacks. */
export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://anzencare.com"
  );
}

export function getPaymongoWebhookUrl(): string {
  return `${getAppBaseUrl()}/api/paymongo/webhook`;
}

export type PaymongoTransferStatus = "pending" | "succeeded" | "failed";

export interface ReceivingInstitution {
  name: string;
  providerCode: string;
}

/** True when the secret key + source wallet are configured (payouts). */
export function isPaymongoConfigured(): boolean {
  return Boolean(
    process.env.PAYMONGO_SECRET_KEY &&
      process.env.PAYMONGO_WALLET_ACCOUNT_NUMBER &&
      process.env.PAYMONGO_WALLET_ACCOUNT_NAME
  );
}

/** True when QR Ph deposits can be created (secret + public key). */
export function isPaymongoDepositConfigured(): boolean {
  return Boolean(
    process.env.PAYMONGO_SECRET_KEY && process.env.PAYMONGO_PUBLIC_KEY
  );
}

function getSecretKey(): string {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PayMongo is not configured");
  return key;
}

function getPublicKey(): string {
  const key = process.env.PAYMONGO_PUBLIC_KEY;
  if (!key) throw new Error("PayMongo public key is not configured");
  return key;
}

function getAuthHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

function normalizeInstitutionName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchInstitutionByName(
  institutions: ReceivingInstitution[],
  bankName: string
): string | null {
  const target = normalizeInstitutionName(bankName);
  if (!target) return null;

  const exact = institutions.find(
    (inst) => normalizeInstitutionName(inst.name) === target
  );
  if (exact) return exact.providerCode;

  const partial = institutions.find((inst) => {
    const normalized = normalizeInstitutionName(inst.name);
    return normalized.includes(target) || target.includes(normalized);
  });
  return partial?.providerCode ?? null;
}

export async function fetchReceivingInstitutions(): Promise<
  ReceivingInstitution[]
> {
  const res = await fetch(
    `${PAYMONGO_V1}/wallets/receiving_institutions?provider=instapay`,
    { headers: { Authorization: getAuthHeader(getSecretKey()) } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Receiving institutions lookup failed: ${err}`);
  }

  const json = (await res.json()) as {
    data?: Array<{
      attributes?: { name?: string; provider_code?: string };
    }>;
  };

  return (json.data ?? [])
    .map((item) => ({
      name: item.attributes?.name?.trim() ?? "",
      providerCode: item.attributes?.provider_code?.trim() ?? "",
    }))
    .filter((item) => item.name && item.providerCode);
}

export async function resolveDestinationBic(
  account: PayoutAccountSnapshot
): Promise<string> {
  if (account.accountType === "Bank Account" && account.bankName === "Other") {
    throw new Error('Bank "Other" is not supported for direct payout.');
  }

  const bankName = resolveInstapayBankName(account);
  const institutions = await fetchReceivingInstitutions();
  const bic = matchInstitutionByName(institutions, bankName);

  if (!bic) {
    throw new Error(
      `No PayMongo institution found for "${bankName}". Pay manually instead.`
    );
  }

  return bic;
}

/** Send an InstaPay payout via PayMongo v2 batch transfers. */
export async function createInstapayTransfer(params: {
  centavos: number;
  accountName: string;
  accountNumber: string;
  bic: string;
}): Promise<{ transferId: string; status: PaymongoTransferStatus }> {
  const walletNumber = process.env.PAYMONGO_WALLET_ACCOUNT_NUMBER?.trim();
  const walletName = process.env.PAYMONGO_WALLET_ACCOUNT_NAME?.trim();
  if (!walletNumber || !walletName) {
    throw new Error("PayMongo wallet not configured");
  }

  if (params.centavos <= 0) {
    throw new Error("Payout amount must be positive");
  }
  if (params.centavos > INSTAPAY_MAX_CENTAVOS) {
    throw new Error("Payout exceeds InstaPay per-transaction limit of PHP 50,000");
  }

  const accountNumber = normalizeAccountNumber(
    "Bank Account",
    params.accountNumber
  );
  const accountName = params.accountName.trim();
  if (!accountNumber || !accountName) {
    throw new Error("Recipient account name and number are required");
  }

  const res = await fetch(`${PAYMONGO_V2}/batch_transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(getSecretKey()),
    },
    body: JSON.stringify({
      transfers: [
        {
          source_account: {
            number: walletNumber,
            name: walletName,
            bic: PAYMONGO_WALLET_BIC,
          },
          destination_account: {
            number: accountNumber,
            name: accountName,
            bic: params.bic,
          },
          amount: params.centavos,
          currency: "PHP",
          provider: "instapay",
          description: PAYOUT_DESCRIPTION,
          callback_url: getPaymongoWebhookUrl(),
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayMongo transfer failed: ${err}`);
  }

  const json = (await res.json()) as {
    data?: { transfers?: Array<{ id?: string; status?: string }> };
    transfers?: Array<{ id?: string; status?: string }>;
  };

  const transfer = json.data?.transfers?.[0] ?? json.transfers?.[0];
  if (!transfer?.id) {
    throw new Error("PayMongo transfer response missing transfer id");
  }

  return {
    transferId: transfer.id,
    status: (transfer.status as PaymongoTransferStatus) ?? "pending",
  };
}

/** Look up a payment intent's status (e.g. "awaiting_payment_method", "succeeded"). */
export async function getPaymentIntentStatus(intentId: string): Promise<string> {
  const res = await fetch(`${PAYMONGO_V1}/payment_intents/${intentId}`, {
    headers: { Authorization: getAuthHeader(getSecretKey()) },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Payment intent lookup failed: ${err}`);
  }
  const data = await res.json();
  return data?.data?.attributes?.status as string;
}

/**
 * Create a QR Ph payment intent, attach a qrph payment method, and return the
 * QR image the user scans to pay.
 */
export async function createQrPhPaymentIntent(amountInCentavos: number): Promise<{
  intentId: string;
  clientKey: string;
  qrImageUrl: string;
}> {
  const secretKey = getSecretKey();

  const intentRes = await fetch(`${PAYMONGO_V1}/payment_intents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(secretKey),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: amountInCentavos,
          payment_method_allowed: ["qrph"],
          currency: "PHP",
        },
      },
    }),
  });
  if (!intentRes.ok) {
    throw new Error(`Payment intent failed: ${await intentRes.text()}`);
  }
  const intentData = await intentRes.json();
  const intentId = intentData.data.id as string;
  const clientKey = intentData.data.attributes.client_key as string;

  const publicKey = getPublicKey();

  const methodRes = await fetch(`${PAYMONGO_V1}/payment_methods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(publicKey),
    },
    body: JSON.stringify({ data: { attributes: { type: "qrph" } } }),
  });
  if (!methodRes.ok) {
    throw new Error(`Payment method failed: ${await methodRes.text()}`);
  }
  const methodData = await methodRes.json();
  const paymentMethodId = methodData.data.id as string;

  const attachRes = await fetch(
    `${PAYMONGO_V1}/payment_intents/${intentId}/attach`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getAuthHeader(publicKey),
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: paymentMethodId,
            client_key: clientKey,
          },
        },
      }),
    }
  );
  if (!attachRes.ok) {
    throw new Error(`Attach failed: ${await attachRes.text()}`);
  }
  const attachData = await attachRes.json();
  const nextAction = attachData.data.attributes.next_action;
  const qrImageUrl = (nextAction?.code?.image_url as string) ?? "";

  return { intentId, clientKey, qrImageUrl };
}

/**
 * Verify a PayMongo webhook signature.
 * Header format: `t=<timestamp>,te=<test_sig>,li=<live_sig>`.
 * The signed payload is `${timestamp}.${rawBody}`, HMAC-SHA256 with the secret.
 */
export function verifyPaymongoSignature(
  payload: string,
  signatureHeader: string | null,
  webhookSecret: string
): boolean {
  if (!signatureHeader) return false;

  const parts = signatureHeader.split(",").reduce((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {} as Record<string, string>);

  const timestamp = parts.t;
  const signature = parts.li || parts.te || parts.v1;
  if (!timestamp || !signature) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const ageSec = Math.abs(Math.floor(Date.now() / 1000) - ts);
  if (ageSec > WEBHOOK_TOLERANCE_SEC) return false;

  const signed = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  if (signed.length !== signature.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signed, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}
