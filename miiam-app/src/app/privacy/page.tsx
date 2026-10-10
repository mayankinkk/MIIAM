"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    if (hadDark) {
      root.classList.remove("dark");
    }
    return () => {
      if (hadDark) {
        root.classList.add("dark");
      }
    };
  }, []);
  return (
    <div className="bg-background text-on-background min-h-screen font-sans">
      <nav className="bg-surface-container/80 border-outline-variant/20 fixed top-0 z-50 w-full border-b backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-accent text-2xl font-black tracking-tighter">
            MIIAM
          </Link>
          <Link
            href="/"
            className="text-on-surface-variant hover:text-accent text-sm font-bold transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      <main className="px-6 pt-32 pb-20">
        <div className="mx-auto max-w-4xl">
          <span className="bg-primary/10 text-accent mb-6 inline-block rounded-full px-4 py-1.5 text-xs font-black tracking-widest uppercase">
            Legal
          </span>
          <h1 className="text-on-background mb-8 text-4xl font-black tracking-tighter md:text-5xl">
            Privacy Policy
          </h1>
          <p className="text-on-surface-variant/75 mb-12">Last updated: May 2026</p>

          <div className="prose prose-slate max-w-none space-y-12">
            <section className="bg-surface-container border-outline-variant/10 rounded-2xl border p-8 shadow-sm">
              <h2 className="text-on-background mb-4 text-xl font-black">1. Introduction</h2>
              <p className="text-on-surface-variant mb-4">
                MIIAM ("we", "our", or "us") operates the MIIAM mobile application and website. This
                Privacy Policy explains how we collect, use, disclose, and safeguard your
                information when you use our platform.
              </p>
              <p className="text-on-surface-variant">
                By accessing or using MIIAM, you agree to this Privacy Policy. If you do not agree,
                please do not use our services.
              </p>
            </section>

            <section className="bg-surface-container border-outline-variant/10 rounded-2xl border p-8 shadow-sm">
              <h2 className="text-on-background mb-4 text-xl font-black">2. Data We Collect</h2>
              <h3 className="text-on-surface mt-6 mb-3 font-bold">Personal Information</h3>
              <ul className="text-on-surface-variant list-disc space-y-2 pl-6">
                <li>Name and phone number</li>
                <li>Email address</li>
                <li>Delivery address</li>
                <li>Payment details (processed securely via payment partners)</li>
              </ul>
              <h3 className="text-on-surface mt-6 mb-3 font-bold">Usage Data</h3>
              <ul className="text-on-surface-variant list-disc space-y-2 pl-6">
                <li>Order history and browsing behavior</li>
                <li>Location data (GPS for nearby vendors/delivery)</li>
                <li>Device information and IP address</li>
              </ul>
            </section>

            <section className="bg-surface-container border-outline-variant/10 rounded-2xl border p-8 shadow-sm">
              <h2 className="text-on-background mb-4 text-xl font-black">3. Why We Collect It</h2>
              <ul className="text-on-surface-variant list-disc space-y-2 pl-6">
                <li>To process and deliver orders</li>
                <li>To connect customers with service professionals</li>
                <li>To send order updates, offers, and notifications</li>
                <li>To improve your app experience</li>
              </ul>
            </section>

            <section className="bg-surface-container border-outline-variant/10 rounded-2xl border p-8 shadow-sm">
              <h2 className="text-on-background mb-4 text-xl font-black">4. Data Sharing</h2>
              <p className="text-on-surface-variant mb-4">We share your data only with:</p>
              <ul className="text-on-surface-variant list-disc space-y-2 pl-6">
                <li>
                  <strong>Delivery partners</strong> – name and address for order delivery
                </li>
                <li>
                  <strong>Service professionals</strong> – name and contact for booking
                </li>
                <li>
                  <strong>Payment gateways</strong> – Razorpay, Cashfree, etc. (processed securely)
                </li>
              </ul>
              <p className="text-on-surface-variant text-accent mt-4 font-semibold">
                We do NOT sell your personal data to third parties.
              </p>
            </section>

            <section className="bg-surface-container border-outline-variant/10 rounded-2xl border p-8 shadow-sm">
              <h2 className="text-on-background mb-4 text-xl font-black">5. Data Retention</h2>
              <ul className="text-on-surface-variant list-disc space-y-2 pl-6">
                <li>
                  <strong>Account data</strong> – retained while account is active
                </li>
                <li>
                  <strong>Order data</strong> – retained up to 3 years for legal/tax compliance
                </li>
                <li>
                  <strong>On account closure</strong> – all data deleted upon request
                </li>
              </ul>
            </section>

            <section className="bg-surface-container border-outline-variant/10 rounded-2xl border p-8 shadow-sm">
              <h2 className="text-on-background mb-4 text-xl font-black">
                6. Your Rights (DPDPA 2023)
              </h2>
              <p className="text-on-surface-variant mb-4">You have the right to:</p>
              <ul className="text-on-surface-variant list-disc space-y-2 pl-6">
                <li>
                  <strong>Access</strong> – request a copy of your data
                </li>
                <li>
                  <strong>Correct</strong> – request correction of inaccurate data
                </li>
                <li>
                  <strong>Delete</strong> – request account and data deletion
                </li>
                <li>
                  <strong>Withdraw consent</strong> – anytime via app settings
                </li>
              </ul>
            </section>

            <section className="bg-surface-container border-outline-variant/10 rounded-2xl border p-8 shadow-sm">
              <h2 className="text-on-background mb-4 text-xl font-black">7. Security Measures</h2>
              <ul className="text-on-surface-variant list-disc space-y-2 pl-6">
                <li>Data encrypted in transit (HTTPS/SSL)</li>
                <li>Passwords hashed, never stored in plain text</li>
                <li>Restricted internal access to user data</li>
              </ul>
            </section>

            <section className="bg-surface-container border-outline-variant/10 rounded-2xl border p-8 shadow-sm">
              <h2 className="text-on-background mb-4 text-xl font-black">8. Grievance Officer</h2>
              <p className="text-on-surface-variant mb-4">
                In accordance with IT Rules 2011, our Grievance Officer is:
              </p>
              <div className="bg-surface-container-low border-outline-variant/10 rounded-xl border p-4">
                <p className="text-on-surface font-bold">MIIAM Grievance Team</p>
                <p className="text-on-surface-variant">Email: support@miiam.app</p>
                <p className="text-on-surface-variant">Response time: Within 30 days</p>
              </div>
              <p className="text-on-surface-variant mt-4">
                You may also file a complaint with the{" "}
                <strong>Data Protection Board of India</strong> if unsatisfied.
              </p>
            </section>

            <section className="bg-surface-container border-outline-variant/10 rounded-2xl border p-8 shadow-sm">
              <h2 className="text-on-background mb-4 text-xl font-black">
                9. Changes to This Policy
              </h2>
              <p className="text-on-surface-variant">
                We may update this policy periodically. We will notify you of significant changes
                via app notification or email. Continued use after changes constitutes acceptance.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
