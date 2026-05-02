import { cn } from "@/lib/utils";
import { PricingColumn, PricingColumnProps } from "@/components/ui/pricing-column";
import { Section } from "@/components/ui/section";

interface PricingProps {
  title?: string | false;
  description?: string | false;
  className?: string;
}

export default function Pricing({
  title = "Choose the right plan for you",
  description = "Find the ideal plan that fits your budget and goals. Make informed choices with ease.",
  className = "",
}: PricingProps) {

  const plans: PricingColumnProps[] = [
    {
      name: "Free",
      price: 0.0,
      priceNote: "Per month",
      cta: {
        label: "Start for Free",
        href: "/auth",
      },
      features: [
        "Access to basic course content (SS1–SS3 + limited university topics",
        "AI explanations (with daily usage limits",
        "Ability to view full course outlines",
        "Create one study libray",
        // "Basic progress tracking",
        "Access on one device"
      ],
      variant: "default",
    },
    {
      name: "Standard",
      price: 29050,
      promotionText: "-33%",
      priceNote: "Per month",
      cta: {
        label: "Get Standard",
        href: "/pricing?plan=standard",
      },
      features: [
        "Everything in Free +",
        "Full access to all courses (Secondary + University)",
        "Increased AI usage (longer explanations + more questions per day)",
        "Create up to 10 study libraries per course",
        "Basic progress tracking",
        "Advanced progress tracking (completion stats, learning streaks)",
        "Faster response time from AI assistant"
      ],
      variant: "best-value",
    },
    {
      name: "Premium",
      price: 54209,
      promotionText: "-50%",
      priceNote: "Per month",
      cta: {
        label: "Get Premium",
        href: "/pricing?plan=premium",
      },
      features: [
        "Everything in Standard +",
        "Unlimited AI assistance (no daily limits)",
        "Create unlimited study libraries",
        "Full analytics dashboard",
        "Email Priority support",
        "Early access to new features"
      ],
      variant: "default",
    },
  ];

  return (
    <Section id="pricing" className={cn("scroll-mt-24 pt-16 pb-32", className)}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12">
        {(title || description) && (
          <div className="flex flex-col items-center gap-4 px-4 text-center sm:gap-8">
            <h4 className="text-xs font-mono tracking-widest uppercase mb-4 text-accent-green">Pricing</h4>
            {title && (
              <h2 className="text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-md text-foreground/60 max-w-[600px] font-medium sm:text-xl">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="max-w-container mx-auto grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 items-center justify-center w-full px-4 lg:px-0">
          {plans.map((plan) => (
            <PricingColumn
              key={plan.name}
              name={plan.name}
              price={plan.price}
              promotionText={plan.promotionText}
              priceNote={plan.priceNote}
              cta={plan.cta}
              features={plan.features}
              variant={plan.variant}
              className={plan.className}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
