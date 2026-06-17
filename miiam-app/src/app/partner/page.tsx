"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const benefits = [
  { icon: "trending_up", title: "More Customers", desc: "Reach thousands of hungry customers in your area looking for your cuisine." },
  { icon: "payments", title: "Low Commission", desc: "Pay only 15% per order — competitive rates with transparent settlement." },
  { icon: "speed", title: "Real-time Dashboard", desc: "Manage orders, menu, analytics, and payouts from one place." },
  { icon: "support_agent", title: "24/7 Support", desc: "Dedicated partner support team to help you grow your business." },
  { icon: "campaign", title: "Marketing Boost", desc: "Get featured in promotions, discounts, and seasonal campaigns." },
  { icon: "account_balance_wallet", title: "Weekly Payouts", desc: "Get paid every week with transparent settlement reports." },
];

const steps = [
  { num: "1", title: "Register Your Store", desc: "Fill out a simple form with your business details and documents." },
  { num: "2", title: "Get Verified", desc: "Our team reviews your application within 24-48 hours." },
  { num: "3", title: "Upload Your Menu", desc: "Add your menu items, prices, photos, and set delivery preferences." },
  { num: "4", title: "Start Selling", desc: "Go live and start receiving orders from customers near you." },
];

const faqs = [
  { q: "How long does verification take?", a: "Most applications are reviewed within 24-48 hours. You'll get an email once verified." },
  { q: "What documents do I need?", a: "You'll need a valid GST number, FSSAI license (for food), and PAN card." },
  { q: "Are there any hidden fees?", a: "No hidden fees. We charge a flat 5% commission per order with no monthly or listing fees." },
  { q: "When do I get paid?", a: "Payouts are processed every Monday for the previous week's orders." },
  { q: "Can I partner from any city?", a: "We're currently active in Gauripur and Dhubri only." },
];

export default function PartnerLanding() {
  const [vendorCount, setVendorCount] = useState(0);

  useEffect(() => {
    createClient().from("vendors").select("*", { count: "exact", head: true }).then(({ count }: { count: number | null }) => {
      if (count) setVendorCount(count);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-extrabold tracking-tighter text-[var(--color-primary)]">MIIAM</Link>
        <div className="flex items-center gap-4">
          <Link href="/auth/login?redirect=/partner/dashboard" className="text-[var(--color-on-surface-variant)] font-medium text-sm hover:text-[var(--color-on-surface)]">
            Sign In
          </Link>
          <Link
            href="/partner/register"
            className="bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[var(--color-primary-dim)] transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-[var(--color-surface-container)] text-[var(--color-primary)] px-4 py-2 rounded-full text-sm font-bold mb-6">
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              Join {vendorCount > 0 ? `${vendorCount}+` : "Our"} Partners
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-[var(--color-on-surface)] tracking-tight leading-tight mb-6">
              Partner with <span className="text-[var(--color-primary)]">MIIAM</span>
              <br />
              <span className="text-[var(--color-on-surface-variant)]">and grow your business</span>
            </h1>
            <p className="text-lg text-[var(--color-outline)] mb-8 max-w-lg mx-auto md:mx-0">
              List your restaurant or store on India&apos;s fastest-growing delivery platform. Reach more customers, earn more revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                href="/partner/register"
                className="bg-[var(--color-primary)] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[var(--color-primary-dim)] transition-colors shadow-xl shadow-[var(--color-primary)]/20 text-center"
              >
                Register Your Store
              </Link>
              <Link
                href="#how-it-works"
                className="border-2 border-[var(--color-border-subtle)] text-[var(--color-on-surface)] px-8 py-4 rounded-2xl font-bold text-lg hover:border-[var(--color-outline-variant)] transition-colors text-center"
              >
                How It Works
              </Link>
            </div>
          </div>
          <div className="flex-1 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 rounded-3xl p-8 md:p-12 text-center">
            <span className="material-symbols-outlined text-8xl text-[var(--color-primary)] mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            <p className="text-2xl font-extrabold text-[var(--color-on-surface)]">{vendorCount > 0 ? `${vendorCount}+` : "Growing"}</p>
            <p className="text-[var(--color-outline)]">Active Restaurant Partners</p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div>
                <p className="text-xl font-black text-[var(--color-primary)]">50+</p>
                <p className="text-xs text-[var(--color-outline)]">Cities</p>
              </div>
              <div>
                <p className="text-xl font-black text-[var(--color-primary)]">15%</p>
                <p className="text-xs text-[var(--color-outline)]">Commission</p>
              </div>
              <div>
                <p className="text-xl font-black text-[var(--color-primary)]">24hr</p>
                <p className="text-xs text-[var(--color-outline)]">Verification</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-[var(--color-surface-subtle)] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--color-on-surface)] text-center mb-4">Why Partner with MIIAM?</h2>
          <p className="text-[var(--color-outline)] text-center mb-12 max-w-2xl mx-auto">Everything you need to run and grow your delivery business</p>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)] hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-[var(--color-surface-container)] rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">{b.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--color-on-surface)] mb-2">{b.title}</h3>
                <p className="text-sm text-[var(--color-outline)]">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--color-on-surface)] text-center mb-4">How It Works</h2>
        <p className="text-[var(--color-outline)] text-center mb-12">Get started in 4 simple steps</p>
        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="w-16 h-16 bg-[var(--color-primary)] text-white rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-4">
                {s.num}
              </div>
              <h3 className="font-bold text-[var(--color-on-surface)] mb-2">{s.title}</h3>
              <p className="text-sm text-[var(--color-outline)]">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link
            href="/partner/register"
            className="inline-block bg-[var(--color-primary)] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[var(--color-primary-dim)] transition-colors shadow-xl shadow-[var(--color-primary)]/20"
          >
            Start Registration
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[var(--color-surface-subtle)] py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--color-on-surface)] text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] group">
                <summary className="px-6 py-5 font-bold text-[var(--color-on-surface)] cursor-pointer flex items-center justify-between list-none">
                  {f.q}
                  <span className="material-symbols-outlined text-[var(--color-outline-variant)] group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="px-6 pb-5 text-sm text-[var(--color-outline)]">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--color-on-surface)] mb-4">Ready to Get Started?</h2>
          <p className="text-[var(--color-outline)] mb-8">Join thousands of partners already growing with MIIAM.</p>
          <Link
            href="/partner/register"
            className="inline-block bg-[var(--color-primary)] text-white px-10 py-4 rounded-2xl font-bold text-xl hover:bg-[var(--color-primary-dim)] transition-colors shadow-xl shadow-[var(--color-primary)]/20"
          >
            Register Now — It&apos;s Free
          </Link>
          <p className="text-xs text-[var(--color-outline-variant)] mt-4">No commitment required. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border-subtle)] py-8 text-center text-sm text-[var(--color-outline-variant)]">
        <div className="flex justify-center gap-6 mb-3">
          <Link href="/terms" className="hover:text-[var(--color-on-surface-variant)] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[var(--color-on-surface-variant)] transition-colors">Privacy</Link>
          <Link href="/refunds" className="hover:text-[var(--color-on-surface-variant)] transition-colors">Refund Policy</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} MIIAM. All rights reserved.</p>
      </footer>
    </div>
  );
}
