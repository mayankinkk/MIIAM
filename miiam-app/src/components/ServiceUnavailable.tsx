"use client";

import Link from "next/link";

interface ServiceUnavailableProps {
  serviceName: string;
  message: string;
  icon: string;
}

export default function ServiceUnavailable({
  serviceName,
  message,
  icon,
}: ServiceUnavailableProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-container-lowest)] p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-surface-container)]">
          <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]">
            {icon}
          </span>
        </div>
        <h2 className="mb-2 text-2xl font-black text-[var(--color-on-surface)]">{serviceName}</h2>
        <p className="mb-6 text-[var(--color-on-surface-variant)]">{message}</p>
        <Link
          href="/app/home"
          className="text-on-primary inline-block rounded-xl bg-[var(--color-primary)] px-6 py-3 font-bold hover:opacity-90"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
