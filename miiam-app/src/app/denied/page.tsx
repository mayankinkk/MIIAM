"use client";

import Link from "next/link";

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fff4f4] px-6">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#ba001c]/10 text-[#ba001c] animate-pulse">
          <span className="material-symbols-outlined text-5xl">lock</span>
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight text-[#4d212a] mb-4">Access Denied</h1>
        <p className="text-[#814c55] text-lg mb-10 leading-relaxed">
          You don't have the necessary permissions to access the Super-Admin Dashboard. Please contact the system administrator or sign in with an authorized account.
        </p>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full bg-[#ba001c] text-white rounded-xl py-4 font-bold shadow-lg shadow-red-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Back to Home
          </Link>
          <Link
            href="/auth/login"
            className="block w-full bg-white text-[#4d212a] border-2 border-slate-100 rounded-xl py-4 font-bold hover:bg-slate-50 transition-all"
          >
            Sign in as Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
