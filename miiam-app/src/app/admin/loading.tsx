export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-subtle)]">
      <div className="text-center">
        <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-sm font-bold text-[var(--color-outline-variant)]">Loading...</p>
      </div>
    </div>
  );
}
