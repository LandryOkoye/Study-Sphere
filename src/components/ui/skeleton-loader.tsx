"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  message?: string;
}

export function SkeletonLoader({ className, message = "0G Compute Node rendering..." }: SkeletonLoaderProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("w-full h-full min-h-[200px] flex flex-col items-center justify-center bg-obsidian border border-charcoal/50 p-6 rounded-sm", className)}>
      <div className="font-mono text-sm text-accent-green/80 flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-accent-green/30 border-t-accent-green rounded-full animate-spin" />
        <p>
          <span className="opacity-50">&gt;</span> {message}{dots}
        </p>
      </div>
    </div>
  );
}
