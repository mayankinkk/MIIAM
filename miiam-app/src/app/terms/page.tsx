"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fff4f4] font-sans">
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-[#ba001c]/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black text-[#ba001c] tracking-tighter">
            MIIAM
          </Link>
          <Link href="/" className="text-sm font-bold text-slate-500 hover:text-[#ba001c]">
            ← Back to Home
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-[#ba001c]/10 text-[#ba001c] rounded-full text-xs font-black uppercase tracking-widest mb-6">
            Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-8">
            Terms & Conditions
          </h1>
          <p className="text-slate-500 mb-12">Last updated: May 2026</p>

          <div className="prose prose-slate max-w-none space-y-12">
            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">1. Eligibility</h2>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>You must be 18 years or older to use MIIAM</li>
                <li>You must provide accurate information during registration</li>
                <li>You are responsible for maintaining your account credentials</li>
              </ul>
            </section>

            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">2. Orders & Payments</h2>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Prices shown are final at checkout</li>
                <li>Orders are confirmed only after successful payment</li>
                <li><strong>Cancellation window:</strong> Within 2 minutes of placing the order</li>
                <li><strong>Refunds:</strong> 5-7 business days to source account</li>
                <li>Payment methods: UPI, Cards, Wallets (Razorpay/Cashfree)</li>
              </ul>
            </section>

            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">3. Vendor & Service Partner Conduct</h2>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>MIIAM is a platform connecting users with <strong>independent businesses</strong></li>
                <li>MIIAM is not liable for quality issues beyond our refund policy</li>
                <li>All service professionals undergo background verification before onboarding</li>
                <li>Vendors are responsible for their own pricing and service delivery</li>
              </ul>
            </section>

            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">4. Prohibited Use</h2>
              <p className="text-slate-600 mb-4">You must NOT:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Create fake accounts or place fraudulent orders</li>
                <li>Abuse or manipulate offers/coupons</li>
                <li>Harass delivery partners or service professionals</li>
                <li>Use the platform for illegal activities</li>
                <li>Attempt to hack or disrupt platform services</li>
              </ul>
              <p className="text-slate-600 mt-4 font-semibold text-red-600">
                Violation may result in account termination and legal action.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">5. Intellectual Property</h2>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>MIIAM name, logo, and all content are owned by MIIAM</li>
                <li>Users cannot reproduce, resell, or distribute platform content</li>
                <li>All trademarks and copyrights are protected</li>
              </ul>
            </section>

            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">6. Limitation of Liability</h2>
              <p className="text-slate-600 mb-4">MIIAM is not liable for:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Delays caused by weather conditions</li>
                <li>Delays caused by strikes or force majeure</li>
                <li>Issues caused by third-party service providers</li>
                <li>Indirect or consequential damages</li>
              </ul>
              <p className="text-slate-600 mt-4 font-semibold">
                Maximum liability is capped at the order value paid.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">7. Governing Law</h2>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>All disputes governed by laws of India</li>
                <li>Jurisdiction: Courts of Guwahati, Assam</li>
                <li>Any disputes will be resolved amicably first</li>
              </ul>
            </section>

            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">8. Contact</h2>
              <p className="text-slate-600 mb-4">For queries:</p>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-bold text-slate-800">MIIAM Support</p>
                <p className="text-slate-600">Email: support@miiam.app</p>
                <p className="text-slate-600">Phone: +91 98765 43210</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}