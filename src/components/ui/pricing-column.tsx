import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Button } from "./button";

const pricingColumnVariants = cva(
  "max-w-container relative flex flex-col gap-6 rounded-3xl p-8 transition-all w-full items-center text-center",
  {
    variants: {
      variant: {
        default: "bg-obsidian text-foreground border border-charcoal shadow-sm",
        "best-value": "bg-obsidian text-foreground border border-accent-green/50 scale-105 shadow-[0_0_30px_-10px_rgba(20,184,136,0.15)] z-10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface PricingColumnProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pricingColumnVariants> {
  name: string;
  price: number;
  promotionText?: ReactNode;
  priceNote?: string;
  cta: {
    label: string;
    href: string;
  };
  features: string[];
}

export function PricingColumn({
  name,
  price,
  promotionText,
  priceNote,
  cta,
  features,
  variant,
  className,
  ...props
}: PricingColumnProps) {
  const isBestValue = variant === "best-value";

  return (
    <div
      className={cn(pricingColumnVariants({ variant, className }))}
      {...props}
    >
      <header className="flex flex-col gap-2 items-center w-full mt-2 min-h-[64px]">
        <h2 className="font-bold text-2xl tracking-tight text-foreground">
          {name}
        </h2>
        
        {isBestValue && (
          <span className="bg-accent-green/10 text-accent-green text-[10px] font-bold px-3 py-1 mt-1 rounded-full border border-accent-green/20 uppercase tracking-widest">
            Best Value
          </span>
        )}
      </header>

      <section className="flex flex-col gap-2 items-center w-full mt-4">
        <div className="flex items-center gap-1">
          <div className="flex items-baseline whitespace-nowrap">
            <span className="text-foreground/50 font-medium text-xl mr-1">₦</span>
            <span className="text-5xl font-extrabold tracking-tighter text-foreground">
              {price.toLocaleString()}
            </span>
            {promotionText && (
              <span className="text-accent-green/80 text-sm font-bold ml-2">
                {promotionText}
              </span>
            )}
          </div>
        </div>
        
        <p className="text-foreground/50 text-xs font-medium h-4 mt-2 mb-2">
          {priceNote || " "}
        </p>

        <ul className="flex flex-col gap-3 w-full mt-4 text-left px-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="w-[18px] h-[18px] mt-0.5 shrink-0 text-accent-green" strokeWidth={3} />
              <span className="text-sm font-medium leading-snug text-foreground/80">{feature}</span>
            </li>
          ))}
        </ul>

        <Link 
          href={cta.href}
          className={cn(
            "rounded-xl w-full py-4 mt-6 text-sm flex items-center justify-center transition-all border-0 text-white font-semibold",
            "bg-accent-green hover:opacity-90 shadow-md hover:shadow-lg"
          )}
        >
          {cta.label}
        </Link>
      </section>
    </div>
  );
}

export { pricingColumnVariants };
