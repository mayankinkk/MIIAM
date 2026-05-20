import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fff4f4] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-[#ba001c]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-5xl text-[#ba001c]">search_off</span>
        </div>
        <h1 className="text-3xl font-black text-[#4d212a] mb-2">404</h1>
        <h2 className="text-xl font-bold text-[#4d212a] mb-2">Page Not Found</h2>
        <p className="text-[#814c55] mb-8">
          The page you're looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>
        
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-[#ba001c] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Go Home
          </Link>
          <Link
            href="/app/home"
            className="block w-full px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:border-[#ba001c] transition-colors"
          >
            Open App
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-3">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/food" className="text-xs px-3 py-1 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200">
              Food
            </Link>
            <Link href="/grocery" className="text-xs px-3 py-1 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200">
              Grocery
            </Link>
            <Link href="/pharmacy" className="text-xs px-3 py-1 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200">
              Pharmacy
            </Link>
            <Link href="/services" className="text-xs px-3 py-1 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200">
              Services
            </Link>
            <Link href="/partner" className="text-xs px-3 py-1 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200">
              Become a Partner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}