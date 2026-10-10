export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-container-lowest)]">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-[var(--color-primary)]">
          <span className="material-symbols-outlined text-on-primary text-3xl">M</span>
        </div>
        <div className="h-2 w-32 overflow-hidden rounded-full bg-[var(--color-surface-container-high)]">
          <div
            className="h-full animate-pulse bg-[var(--color-primary)]"
            style={{ width: "60%" }}
          />
        </div>
        <p className="mt-4 text-sm text-[var(--color-outline)]">Loading...</p>
      </div>
    </div>
  );
}
