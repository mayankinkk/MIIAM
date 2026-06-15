"use client";

import Link from "next/link";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface ButtonAsButton extends ButtonBaseProps, React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: never;
}

interface ButtonAsLink extends ButtonBaseProps {
  href: string;
  children?: React.ReactNode;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dim)] shadow-lg shadow-[var(--color-primary)]/20 hover:shadow-[var(--color-primary)]/30 active:scale-95",
  secondary:
    "bg-[var(--color-surface-container)] text-[var(--color-on-surface)] border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-container-high)] active:scale-95",
  tertiary:
    "bg-[var(--color-secondary)] text-white hover:bg-[var(--color-secondary-dim)] shadow-lg shadow-[var(--color-secondary)]/20 active:scale-95",
  ghost:
    "bg-transparent text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)] active:scale-95",
  danger:
    "bg-[var(--color-error)] text-white hover:opacity-90 shadow-lg shadow-[var(--color-error)]/20 active:scale-95",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs rounded-xl gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-7 py-4 text-base rounded-2xl gap-2.5",
};

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const {
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      loading = false,
      fullWidth = false,
      className = "",
      children,
      ...rest
    } = props;

    const classes = [
      "inline-flex items-center justify-center font-bold no-underline transition-all duration-200 select-none cursor-pointer",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
      "disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none",
      variantStyles[variant],
      sizeStyles[size],
      fullWidth ? "w-full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const iconSpan = icon ? (
      <span
        key={icon}
        className={`material-symbols-outlined text-[1.2em] ${loading ? "animate-spin" : ""}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {loading ? "progress_activity" : icon}
      </span>
    ) : null;

    const content = (
      <>
        {loading && !icon && (
          <span className="material-symbols-outlined text-[1.2em] animate-spin">
            progress_activity
          </span>
        )}
        {icon && iconPosition === "left" && iconSpan}
        {children && <span className="truncate">{children}</span>}
        {icon && iconPosition === "right" && iconSpan}
      </>
    );

    if ("href" in rest && rest.href) {
      const { href, ...linkProps } = rest as ButtonAsLink;
      return (
        <Link href={href} className={classes} ref={ref as any} {...linkProps}>
          {content}
        </Link>
      );
    }

    const { href: _h, ...buttonProps } = rest as ButtonAsButton;
    return (
      <button className={classes} ref={ref as any} {...buttonProps}>
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
