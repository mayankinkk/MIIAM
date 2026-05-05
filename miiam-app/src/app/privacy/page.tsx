"use client";

import Link from "next/link";

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-slate-500 mb-12">Last updated: May 2026</p>

          <div className="prose prose-slate max-w-none space-y-12">
            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">1. Introduction</h2>
              <p className="text-slate-600 mb-4">
                MIIAM ("we", "our", or "us") operates the MIIAM mobile application and website. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
              <p className="text-slate-600">
                By accessing or using MIIAM, you agree to this Privacy Policy. If you do not agree, please do not use our services.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">2. Data We Collect</h2>
              <h3 className="font-bold text-slate-800 mt-6 mb-3">Personal Information</h3>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Name and phone number</li>
                <li>Email address</li>
                <li>Delivery address</li>
                <li>Payment details (processed securely via payment partners)</li>
              </ul>
              <h3 className="font-bold text-slate-800 mt-6 mb-3">Usage Data</h3>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Order history and browsing behavior</li>
                <li>Location data (GPS for nearby vendors/delivery)</li>
                <li>Device information and IP address</li>
              </ul>
            </section>

            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">3. Why We Collect It</h2>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>To process and deliver orders</li>
                <li>To connect customers with service professionals</li>
                <li>To send order updates, offers, and notifications</li>
                <li>To improve your app experience</li>
              </ul>
            </section>

            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">4. Data Sharing</h2>
              <p className="text-slate-600 mb-4">We share your data only with:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li><strong>Delivery partners</strong> – name and address for order delivery</li>
                <li><strong>Service professionals</strong> – name and contact for booking</li>
                <li><strong>Payment gateways</strong> – Razorpay, Cashfree, etc. (processed securely)</li>
              </ul>
              <p className="text-slate-600 mt-4 font-semibold text-[#ba001c]">
                We do NOT sell your personal data to third parties.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">5. Data Retention</h2>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li><strong>Account data</strong> – retained while account is active</li>
                <li><strong>Order data</strong> – retained up to 3 years for legal/tax compliance</li>
                <li><strong>On account closure</strong> – all data deleted upon request</li>
              </ul>
            </section>

            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">6. Your Rights (DPDPA 2023)</h2>
              <p className="text-slate-600 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li><strong>Access</strong> – request a copy of your data</li>
                <li><strong>Correct</strong> – request correction of inaccurate data</li>
                <li><strong>Delete</strong> – request account and data deletion</li>
                <li><strong>Withdraw consent</strong> – anytime via app settings</li>
              </ul>
            </section>

            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">7. Security Measures</h2>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Data encrypted in transit (HTTPS/SSL)</li>
                <li>Passwords hashed, never stored in plain text</li>
                <li>Restricted internal access to user data</li>
              </ul>
            </section>

            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">8. Grievance Officer</h2>
              <p className="text-slate-600 mb-4">
                In accordance with IT Rules 2011, our Grievance Officer is:
              </p>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-bold text-slate-800">MIIAM Grievance Team</p>
                <p className="text-slate-600">Email: support@miiam.app</p>
                <p className="text-slate-600">Response time: Within 30 days</p>
              </div>
              <p className="text-slate-600 mt-4">
                You may also file a complaint with the <strong>Data Protection Board of India</strong> if unsatisfied.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-8 border border-slate-100">
              <h2 className="text-xl font-black text-slate-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-slate-600">
                We may update this policy periodically. We will notify you of significant changes via app notification or email. Continued use after changes constitutes acceptance.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}