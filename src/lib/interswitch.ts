// Interswitch WebCheckout Inline Integration Utility

export interface InterswitchPaymentRequest {
  merchant_code: string;
  pay_item_id: string;
  txn_ref: string;
  amount: number; // in kobo (100 kobo = 1 Naira)
  currency: number; // ISO 4217 numeric code (566 = NGN)
  site_redirect_url: string;
  onComplete: (response: InterswitchPaymentResponse) => void;
  mode: "TEST" | "LIVE";
  cust_name?: string;
  cust_email?: string;
  cust_id?: string;
}

export interface InterswitchPaymentResponse {
  resp: string; // "00" = success
  desc: string;
  txnref: string;
  payRef?: string;
  retRef?: string;
  amount?: number;
  apprAmt?: number;
  cardNum?: string;
}

export interface TransactionVerifyResponse {
  Amount: number;
  CardNumber: string;
  MerchantReference: string;
  PaymentReference: string;
  RetrievalReferenceNumber: string;
  SplitAccounts: unknown[];
  TransactionDate: string;
  ResponseCode: string;
  ResponseDescription: string;
  AccountNumber: string;
}

// Plan configurations with amounts in kobo
export const PLAN_CONFIG = {
  standard: {
    name: "Standard",
    price: 29050, // display price in Naira
    amountKobo: 2905000, // 29,050 * 100
    features: [
      "Everything in Free +",
      "Full access to all courses (Secondary + University)",
      "Increased AI usage (longer explanations + more questions per day)",
      "Create up to 10 study libraries per course",
      "Basic progress tracking",
      "Advanced progress tracking (completion stats, learning streaks)",
      "Faster response time from AI assistant",
    ],
    priceNote: "Per month",
    promotionText: "-33%",
  },
  premium: {
    name: "Premium",
    price: 54209, // display price in Naira
    amountKobo: 5420900, // 54,209 * 100
    features: [
      "Everything in Standard +",
      "Unlimited AI assistance (no daily limits)",
      "Create unlimited study libraries",
      "Full analytics dashboard",
      "Email Priority support",
      "Early access to new features",
    ],
    priceNote: "Per month",
    promotionText: "-50%",
  },
} as const;

export type PlanKey = keyof typeof PLAN_CONFIG;

// Generate a unique transaction reference
export function generateTxnRef(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `SS_${timestamp}_${random}`;
}

// Declare global type for Interswitch script
declare global {
  interface Window {
    webpayCheckout?: (request: InterswitchPaymentRequest) => void;
  }
}

// Initiate Interswitch inline checkout
export function initiatePayment(
  planKey: PlanKey,
  onComplete: (response: InterswitchPaymentResponse) => void,
  options?: {
    custName?: string;
    custEmail?: string;
  }
): string | null {
  if (typeof window === "undefined" || !window.webpayCheckout) {
    console.error("Interswitch checkout script not loaded");
    return null;
  }

  const plan = PLAN_CONFIG[planKey];
  const txnRef = generateTxnRef();
  const merchantCode = (process.env.NEXT_PUBLIC_INTERSWITCH_MERCHANT_CODE || "").trim();
  const payItemId = (process.env.NEXT_PUBLIC_INTERSWITCH_PAY_ITEM_ID || "").trim();

  const paymentRequest: InterswitchPaymentRequest = {
    merchant_code: merchantCode,
    pay_item_id: payItemId,
    txn_ref: txnRef,
    amount: plan.amountKobo,
    currency: 566, // NGN
    site_redirect_url: `${window.location.origin}/pricing/success?ref=${txnRef}&plan=${planKey}`,
    onComplete,
    mode: "TEST", // Change to "LIVE" for production
    ...(options?.custName && { cust_name: options.custName }),
    ...(options?.custEmail && { cust_email: options.custEmail }),
  };

  window.webpayCheckout(paymentRequest);
  return txnRef;
}

// Verify transaction on the server
export async function verifyTransaction(
  txnRef: string,
  amount: number
): Promise<TransactionVerifyResponse> {
  const res = await fetch(
    `/api/interswitch/verify?ref=${encodeURIComponent(txnRef)}&amount=${amount}`
  );
  if (!res.ok) {
    throw new Error("Failed to verify transaction");
  }
  return res.json();
}
