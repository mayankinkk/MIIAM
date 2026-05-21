import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-5xl text-primary">search_off</span>
        </div>
        <h1 className="text-3xl font-black text-on-surface mb-2">404</h1>
        <h2 className="text-xl font-bold text-on-surface mb-2">Page Not Found</h2>
        <p className="text-on-surface-variant mb-8">
          This page doesn&apos;t exist or has been moved.
        </p>

        <div className="space-y-3">
          <Link
            href="/app/explore"
            className="block w-full px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Browse Services
          </Link>
          <Link
            href="/app/home"
            className="block w-full px-6 py-3 bg-surface-container-lowest border-2 border-outline text-on-surface rounded-xl font-bold hover:border-primary transition-colors"
          >
            Go Home
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-outline-variant">
          <p className="text-sm text-on-surface-variant mb-3">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/app/food" className="text-xs px-3 py-1 bg-surface-container rounded-full text-on-surface-variant hover:bg-surface-container-high">
              Food
            </Link>
            <Link href="/app/grocery" className="text-xs px-3 py-1 bg-surface-container rounded-full text-on-surface-variant hover:bg-surface-container-high">
              Grocery
            </Link>
            <Link href="/app/pharmacy" className="text-xs px-3 py-1 bg-surface-container rounded-full text-on-surface-variant hover:bg-surface-container-high">
              Pharmacy
            </Link>
            <Link href="/app/services" className="text-xs px-3 py-1 bg-surface-container rounded-full text-on-surface-variant hover:bg-surface-container-high">
              Services
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
