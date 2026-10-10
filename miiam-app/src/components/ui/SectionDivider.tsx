"use client";

interface SectionDividerProps {
  variant?: "wave" | "fade" | "dots" | "gradient";
  className?: string;
}

export default function SectionDivider({ variant = "wave", className = "" }: SectionDividerProps) {
  if (variant === "wave") {
    return (
      <div className={`relative h-8 overflow-hidden ${className}`}>
        <svg
          viewBox="0 0 1200 40"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0,20 C300,40 600,0 900,20 C1050,30 1150,10 1200,20 L1200,40 L0,40 Z"
            fill="var(--color-surface-container-lowest)"
            opacity="0.3"
          />
        </svg>
      </div>
    );
  }

  if (variant === "fade") {
    return (
      <div
        className={`via-outline-variant/30 h-px bg-gradient-to-r from-transparent to-transparent ${className}`}
      />
    );
  }

  if (variant === "dots") {
    return (
      <div className={`flex items-center justify-center gap-2 py-4 ${className}`}>
        <div className="bg-primary/30 h-1 w-1 rounded-full" />
        <div className="bg-primary/50 h-1.5 w-1.5 rounded-full" />
        <div className="bg-primary/30 h-1 w-1 rounded-full" />
      </div>
    );
  }

  return (
    <div
      className={`from-primary/5 via-primary/10 to-primary/5 h-2 bg-gradient-to-r ${className}`}
    />
  );
}
