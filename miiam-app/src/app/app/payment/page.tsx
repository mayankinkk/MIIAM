import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment | MIIAM" };

export default function PaymentPage() {
  return (
    <>
      <header className="fixed top-0 w-full z-50 flex items-center px-6 py-4 bg-[#fff4f4]/80 backdrop-blur-2xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
        <Link href="/app/profile" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ffe1e4] transition-all mr-4">
          <span className="material-symbols-outlined text-[#ba001c]">arrow_back</span>
        </Link>
        <span className="text-xl font-extrabold tracking-tight text-[#4d212a]">Payment Methods</span>
      </header>
      <main className="pt-32 pb-32 px-6 max-w-2xl mx-auto flex flex-col items-center justify-center text-center min-h-[70vh]">
        <div className="w-24 h-24 bg-[#e6eeff] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#0b50d5]/10">
          <span className="material-symbols-outlined text-5xl text-[#0b50d5]">payments</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#4d212a] mb-3">Feature Coming Soon</h1>
        <p className="text-[#814c55] text-lg max-w-sm">We are integrating secure payment gateways to let you manage your saved cards and wallets. Stay tuned!</p>
      </main>
    </>
  );
}
