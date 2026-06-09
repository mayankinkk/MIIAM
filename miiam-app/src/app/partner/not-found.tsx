import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl text-slate-300">question_mark</span>
        <h1 className="text-2xl font-black text-slate-700 mt-4">Page Not Found</h1>
        <p className="text-sm text-slate-400 mt-2">The page you are looking for does not exist.</p>
        <Link href="/partner/dashboard" className="inline-block mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
