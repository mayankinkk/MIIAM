"use client";

import Link from "next/link";

type CardVariant = "default" | "elevated" | "outlined" | "glass";

interface CardProps {
  variant?: CardVariant;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  as?: "div" | "section" | "article";
  role?: string;
  ariaLabel?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    "bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)]",
  elevated:
    "bg-[var(--color-surface-container-lowest)] shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[var(--color-border-subtle)]",
  outlined:
    "bg-transparent border-2 border-[var(--color-border-default)]",
  glass:
    "bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg",
};

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

function Card({
  variant = "default",
  hover = false,
  padding = "md",
  className = "",
  children,
  href,
  onClick,
  as: Component = "div",
  role,
  ariaLabel,
}: CardProps) {
  const classes = [
    "rounded-2xl overflow-hidden transition-all duration-300",
    variantStyles[variant],
    padding !== "none" ? paddingStyles[padding] : "",
    hover
      ? "cursor-pointer hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} className={classes} role={role} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${classes} w-full text-left`}
        role={role}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    );
  }

  return (
    <Component className={classes} role={role} aria-label={ariaLabel}>
      {children}
    </Component>
  );
}

function CardHeader({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      {children}
    </div>
  );
}

function CardBody({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <div className={`${className}`}>{children}</div>;
}

function CardFooter({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-3 mt-4 pt-3 border-t border-[var(--color-border-subtle)] ${className}`}>
      {children}
    </div>
  );
}

function CardMedia({
  src,
  alt,
  aspectRatio = "16/9",
  className = "",
}: {
  src: string;
  alt: string;
  aspectRatio?: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=ba001c&color=fff`;
        }}
      />
    </div>
  );
}

export { Card, CardHeader, CardBody, CardFooter, CardMedia };
export type { CardProps, CardVariant };
