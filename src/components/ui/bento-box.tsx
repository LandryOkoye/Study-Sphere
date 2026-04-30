import React from "react";
import { cn } from "@/lib/utils";

interface BentoBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function BentoBox({ className, children, ...props }: BentoBoxProps) {
  return (
    <div
      className={cn(
        "bg-card border border-charcoal/50 shadow-sm rounded-sm p-4 overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function BentoGrid({ className, children, ...props }: BentoBoxProps) {
  return (
    <div
      className={cn(
        "grid gap-4 w-full h-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
