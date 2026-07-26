"use client";

import { ReactNode } from "react";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

interface BentoItemProps {
  children: ReactNode;
  span?: "full" | "half" | "third" | "two-thirds";
  height?: "auto" | "sm" | "md" | "lg";
  className?: string;
}

export function BentoGrid({ children, className = "" }: BentoGridProps) {
  return (
    <div className={`grid grid-cols-3 gap-3 auto-rows-auto ${className}`}>
      {children}
    </div>
  );
}

export function BentoItem({ children, span = "auto", height = "auto", className = "" }: BentoItemProps) {
  const spanClasses = {
    auto: "",
    full: "col-span-3",
    half: "col-span-3 sm:col-span-1",
    third: "col-span-1",
    "two-thirds": "col-span-2",
  };

  const heightClasses = {
    auto: "",
    sm: "h-24",
    md: "h-36",
    lg: "h-48",
  };

  return (
    <div className={`${spanClasses[span]} ${heightClasses[height]} ${className}`}>
      {children}
    </div>
  );
}