"use client";

import Link from "next/link";

interface ServiceUnavailableProps {
  serviceName: string;
  message: string;
  icon: string;
}

export default function ServiceUnavailable({ serviceName, message, icon }: ServiceUnavailableProps) {
  return (
    <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-slate-400">{icon}</span>
        </div>
        <h2 className="text-2xl font-black text-[#4d212a] mb-2">{serviceName}</h2>
        <p className="text-[#814c55] mb-6">{message}</p>
        <Link 
          href="/app/home"
          className="inline-block px-6 py-3 bg-[#ba001c] text-white rounded-xl font-bold hover:opacity-90"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}