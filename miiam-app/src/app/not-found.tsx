import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fff4f4] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-[#ba001c]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-5xl text-[#ba001c]">search_off</span>
        </div>
        <h1 className="text-2xl font-bold text-[#4d212a] mb-2">Page Not Found</h1>
        <p className="text-[#814c55] mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#ba001c] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}