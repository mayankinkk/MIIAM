"use client";

import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  scale?: number;
}

export function BounceButton({ children, onClick, className = "", scale = 1.05 }: Props) {
  return (
    <button
      onClick={onClick}
      className={`active:scale-95 transition-transform duration-150 hover:scale-${scale} ${className}`}
      style={{ ["--tw-scale-x" as any]: scale, ["--tw-scale-y" as any]: scale } as any}
    >
      {children}
    </button>
  );
}

export function PulseButton({ children, onClick, className = "" }: Props) {
  return (
    <button
      onClick={onClick}
      className={`active:scale-90 transition-all duration-100 ${className}`}
    >
      {children}
    </button>
  );
}

export function CartBounce({ children, show, className = "" }: { children: ReactNode; show: boolean; className?: string }) {
  return (
    <div className={`transition-transform duration-200 ${show ? "scale-110" : "scale-100"} ${className}`}>
      {children}
    </div>
  );
}