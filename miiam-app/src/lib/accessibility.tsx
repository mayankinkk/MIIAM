"use client";

import { ReactNode } from "react";

interface VisuallyHiddenProps {
  children: ReactNode;
}

export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

interface SkipLinkProps {
  href: string;
  children: ReactNode;
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-[#ba001c] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold"
    >
      {children}
    </a>
  );
}

interface AriaButtonProps {
  onClick: () => void;
  children: ReactNode;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
}

export function AriaButton({ onClick, children, ariaLabel, className = "", disabled }: AriaButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
}

export function announceToScreenReader(message: string) {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

export const keyboardNavigation = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  TAB: "Tab",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
};

export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void
) {
  switch (event.key) {
    case keyboardNavigation.ENTER:
    case keyboardNavigation.SPACE:
      event.preventDefault();
      onEnter?.();
      break;
    case keyboardNavigation.ESCAPE:
      onEscape?.();
      break;
    case keyboardNavigation.ARROW_UP:
      event.preventDefault();
      onArrowUp?.();
      break;
    case keyboardNavigation.ARROW_DOWN:
      event.preventDefault();
      onArrowDown?.();
      break;
  }
}