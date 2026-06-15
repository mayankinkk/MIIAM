import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)] flex items-center justify-center p-6">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl text-[var(--color-outline-variant)]/60">question_mark</span>
        <h1 className="text-2xl font-black text-[var(--color-on-surface)] mt-4">Page Not Found</h1>
        <p className="text-sm text-[var(--color-outline-variant)] mt-2">The page you are looking for does not exist.</p>
        <Link href="/rider/orders" className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm">
          Back to Orders
        </Link>
      </div>
    </div>
  );
}
