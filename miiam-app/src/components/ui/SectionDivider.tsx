"use client";

interface SectionDividerProps {
  variant?: "wave" | "fade" | "dots" | "gradient";
  className?: string;
}

export default function SectionDivider({ variant = "wave", className = "" }: SectionDividerProps) {
  if (variant === "wave") {
    return (
      <div className={`relative h-8 overflow-hidden ${className}`}>
        <svg viewBox="0 0 1200 40" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <path d="M0,20 C300,40 600,0 900,20 C1050,30 1150,10 1200,20 L1200,40 L0,40 Z" fill="var(--color-surface-container-lowest)" opacity="0.3" />
        </svg>
      </div>
    );
  }

  if (variant === "fade") {
    return (
      <div className={`h-px bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent ${className}`} />
    );
  }

  if (variant === "dots") {
    return (
      <div className={`flex items-center justify-center gap-2 py-4 ${className}`}>
        <div className="w-1 h-1 rounded-full bg-primary/30" />
        <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
        <div className="w-1 h-1 rounded-full bg-primary/30" />
      </div>
    );
  }

  return (
    <div className={`h-2 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 ${className}`} />
  );
}