import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-subtle)] p-6">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)]/60">
          question_mark
        </span>
        <h1 className="mt-4 text-2xl font-black text-[var(--color-on-surface)]">Page Not Found</h1>
        <p className="mt-2 text-sm text-[var(--color-outline-variant)]">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/admin"
          className="bg-primary text-on-primary mt-6 inline-block rounded-xl px-6 py-3 text-sm font-bold"
        >
          Back to Admin
        </Link>
      </div>
    </div>
  );
}
