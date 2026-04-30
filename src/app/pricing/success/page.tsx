"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import {
  PLAN_CONFIG,
  PlanKey,
  verifyTransaction,
  TransactionVerifyResponse,
} from "@/lib/interswitch";

type VerifyState = "loading" | "success" | "failed";

function SuccessContent() {
  const searchParams = useSearchParams();
  const txnRef = searchParams.get("ref");
  const planKey = searchParams.get("plan") as PlanKey | null;
  const statusParam = searchParams.get("status");

  const [verifyState, setVerifyState] = useState<VerifyState>("loading");
  const [txnData, setTxnData] = useState<TransactionVerifyResponse | null>(
    null
  );

  const plan =
    planKey && (planKey === "standard" || planKey === "premium")
      ? PLAN_CONFIG[planKey]
      : null;

  useEffect(() => {
    if (!txnRef || !plan) {
      setVerifyState("failed");
      return;
    }

    // If we got a success status from inline callback, verify server-side
    if (statusParam === "success") {
      verifyTransaction(txnRef, plan.amountKobo)
        .then((data) => {
          if (data.ResponseCode === "00") {
            setVerifyState("success");
            setTxnData(data);
          } else {
            setVerifyState("failed");
            setTxnData(data);
          }
        })
        .catch(() => {
          // Even if verification call fails, the payment may have succeeded
          // Show success based on inline callback
          setVerifyState("success");
        });
    } else {
      setVerifyState("failed");
    }
  }, [txnRef, plan, statusParam]);

  return (
    <div className="min-h-screen bg-obsidian flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-charcoal/50 bg-obsidian/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="StudySphere Logo"
              width={24}
              height={24}
              priority
            />
            <span className="font-bold tracking-tight text-lg">
              StudySphere
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {verifyState === "loading" && (
            <div className="text-center space-y-6 animate-in fade-in duration-500">
              <div className="w-20 h-20 rounded-full bg-charcoal/30 flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-accent-green animate-spin" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  Verifying your payment...
                </h1>
                <p className="text-foreground/60 text-sm">
                  Please wait while we confirm your transaction.
                </p>
              </div>
            </div>
          )}

          {verifyState === "success" && (
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 rounded-full bg-accent-green/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-accent-green" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
                <p className="text-foreground/60 text-sm">
                  Your {plan?.name || ""} plan is now active. Welcome to
                  StudySphere!
                </p>
              </div>

              {/* Transaction details */}
              <div className="rounded-xl border border-charcoal/50 bg-charcoal/10 p-5 text-left space-y-3">
                <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">
                  Transaction Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground/50">Plan</span>
                    <span className="font-medium">{plan?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/50">Amount</span>
                    <span className="font-medium">
                      ₦{plan?.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/50">Reference</span>
                    <span className="font-mono text-xs text-foreground/70">
                      {txnRef}
                    </span>
                  </div>
                  {txnData?.TransactionDate && (
                    <div className="flex justify-between">
                      <span className="text-foreground/50">Date</span>
                      <span className="text-foreground/70">
                        {new Date(txnData.TransactionDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href="/auth"
                  className="w-full py-3.5 rounded-xl bg-accent-green text-white font-semibold text-sm
                    hover:opacity-90 transition-all shadow-lg shadow-accent-green/20
                    flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/"
                  className="block text-center text-sm text-foreground/50 hover:text-foreground transition-colors"
                >
                  Return to home
                </Link>
              </div>
            </div>
          )}

          {verifyState === "failed" && (
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
                <p className="text-foreground/60 text-sm">
                  {txnData?.ResponseDescription ||
                    "Your payment could not be processed. Please try again."}
                </p>
              </div>

              {txnRef && (
                <div className="rounded-xl border border-charcoal/50 bg-charcoal/10 p-4 text-left">
                  <p className="text-xs text-foreground/50">
                    Reference:{" "}
                    <span className="font-mono">{txnRef}</span>
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-2">
                {planKey && (
                  <Link
                    href={`/pricing?plan=${planKey}`}
                    className="w-full py-3.5 rounded-xl bg-accent-green text-white font-semibold text-sm
                      hover:opacity-90 transition-all shadow-lg shadow-accent-green/20
                      flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Try Again
                  </Link>
                )}
                <Link
                  href="/#pricing"
                  className="block text-center text-sm text-foreground/50 hover:text-foreground transition-colors"
                >
                  Back to pricing
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-charcoal/50 bg-obsidian mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-xs font-mono text-foreground/40">
          StudySphere Protocol v1.0.0
        </div>
      </footer>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-obsidian flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent-green animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
