"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
  ArrowLeft,
  Shield,
  Zap,
  Crown,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  PLAN_CONFIG,
  PlanKey,
  initiatePayment,
  InterswitchPaymentResponse,
} from "@/lib/interswitch";

function PricingDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planParam = searchParams.get("plan") as PlanKey | null;
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validPlan =
    planParam && (planParam === "standard" || planParam === "premium")
      ? planParam
      : null;

  const plan = validPlan ? PLAN_CONFIG[validPlan] : null;
  const otherPlanKey: PlanKey | null = validPlan === "standard" ? "premium" : validPlan === "premium" ? "standard" : null;
  const otherPlan = otherPlanKey ? PLAN_CONFIG[otherPlanKey] : null;

  const handlePayment = useCallback(() => {
    if (!validPlan) return;

    setIsProcessing(true);
    setError(null);

    const onComplete = (response: InterswitchPaymentResponse) => {
      setIsProcessing(false);

      if (response.resp === "00") {
        router.push(
          `/pricing/success?ref=${response.txnref}&plan=${validPlan}&status=success`
        );
      } else {
        setError(
          response.desc || "Payment was not completed. Please try again."
        );
      }
    };

    const txnRef = initiatePayment(validPlan, onComplete);

    if (!txnRef) {
      setIsProcessing(false);
      setError(
        "Payment system is loading. Please wait a moment and try again."
      );
    }
  }, [validPlan, router]);

  if (!plan || !validPlan) {
    return (
      <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">
            Plan not found
          </h1>
          <p className="text-foreground/60">
            Please select a valid plan from our pricing page.
          </p>
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-2 text-accent-green hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to pricing
          </Link>
        </div>
      </div>
    );
  }

  const isStandard = validPlan === "standard";

  return (
    <div className="min-h-screen bg-obsidian flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-charcoal/50 bg-obsidian/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
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
          <Link
            href="/#pricing"
            className="text-sm text-foreground/60 hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to plans
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 md:py-20 w-full">
        {/* Plan Hero */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-accent-green/30 bg-accent-green/5 rounded-full mb-6">
            {isStandard ? (
              <Zap className="w-3.5 h-3.5 text-accent-green" />
            ) : (
              <Crown className="w-3.5 h-3.5 text-accent-green" />
            )}
            <span className="text-xs font-semibold text-accent-green uppercase tracking-wider">
              {plan.name} Plan
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {isStandard
              ? "Unlock your full potential"
              : "The ultimate learning experience"}
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            {isStandard
              ? "Get full access to all courses and enhanced AI assistance to accelerate your learning journey."
              : "Unlimited everything. No limits on AI, libraries, or features. Built for serious learners."}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 md:gap-12 items-start">
          {/* Features List */}
          <div className="lg:col-span-3 space-y-8">
            {/* Main plan card */}
            <div className="rounded-2xl border border-charcoal bg-charcoal/10 p-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent-green" />
                What&apos;s included
              </h2>
              <ul className="space-y-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-accent-green/10 flex items-center justify-center shrink-0">
                      <Check
                        className="w-3 h-3 text-accent-green"
                        strokeWidth={3}
                      />
                    </div>
                    <span className="text-foreground/80 text-[15px] leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-charcoal/50 bg-charcoal/5 p-4 flex items-center gap-3">
                <Shield className="w-5 h-5 text-accent-green shrink-0" />
                <div>
                  <p className="text-sm font-medium">Secure Payment</p>
                  <p className="text-xs text-foreground/50">
                    Powered by Interswitch
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-charcoal/50 bg-charcoal/5 p-4 flex items-center gap-3">
                <Zap className="w-5 h-5 text-accent-green shrink-0" />
                <div>
                  <p className="text-sm font-medium">Instant Access</p>
                  <p className="text-xs text-foreground/50">
                    Active immediately
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-charcoal/50 bg-charcoal/5 p-4 flex items-center gap-3">
                <Crown className="w-5 h-5 text-accent-green shrink-0" />
                <div>
                  <p className="text-sm font-medium">Cancel Anytime</p>
                  <p className="text-xs text-foreground/50">
                    No lock-in period
                  </p>
                </div>
              </div>
            </div>

            {/* Compare with other plan */}
            {otherPlan && otherPlanKey && (
              <div className="rounded-xl border border-charcoal/30 bg-charcoal/5 p-6">
                <p className="text-sm text-foreground/50 mb-3">
                  Looking for{" "}
                  {isStandard ? "more features" : "something simpler"}?
                </p>
                <Link
                  href={`/pricing?plan=${otherPlanKey}`}
                  className="text-accent-green hover:underline text-sm font-medium"
                >
                  View {otherPlan.name} Plan — ₦
                  {otherPlan.price.toLocaleString()}/mo →
                </Link>
              </div>
            )}
          </div>

          {/* Payment Card */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-2xl border border-charcoal bg-obsidian p-8 shadow-2xl shadow-black/20">
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-foreground/50 font-medium text-lg">
                    ₦
                  </span>
                  <span className="text-5xl font-extrabold tracking-tighter">
                    {plan.price.toLocaleString()}
                  </span>
                </div>
                <p className="text-foreground/50 text-sm">
                  {plan.priceNote}
                  {plan.promotionText && (
                    <span className="ml-2 text-accent-green font-bold">
                      {plan.promotionText}
                    </span>
                  )}
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-accent-green text-white font-semibold text-base
                  hover:opacity-90 transition-all shadow-lg shadow-accent-green/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Pay ₦{plan.price.toLocaleString()} Now</>
                )}
              </button>

              <p className="text-center text-xs text-foreground/40 mt-4 leading-relaxed">
                You&apos;ll be charged ₦{plan.price.toLocaleString()} for your{" "}
                {plan.name} plan. Payment is processed securely via Interswitch.
              </p>

              {/* Payment methods */}
              <div className="mt-6 pt-6 border-t border-charcoal/50">
                <p className="text-xs text-foreground/40 text-center mb-3">
                  Accepted payment methods
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {["Visa", "Mastercard", "Verve", "Bank Transfer", "USSD"].map(
                    (method) => (
                      <span
                        key={method}
                        className="px-2.5 py-1 text-[10px] font-mono border border-charcoal/50 rounded bg-charcoal/10 text-foreground/50"
                      >
                        {method}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-charcoal/50 bg-obsidian mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-xs font-mono text-foreground/40">
          Payments are processed securely by Interswitch. StudySphere Protocol
          v1.0.0
        </div>
      </footer>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-obsidian flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent-green animate-spin" />
        </div>
      }
    >
      <PricingDetailContent />
    </Suspense>
  );
}
