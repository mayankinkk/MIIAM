"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const benefits = [
  {
    icon: "trending_up",
    title: "More Customers",
    desc: "Reach thousands of hungry customers in your area looking for your cuisine.",
  },
  {
    icon: "payments",
    title: "Low Commission",
    desc: "Pay only 15% per order — competitive rates with transparent settlement.",
  },
  {
    icon: "speed",
    title: "Real-time Dashboard",
    desc: "Manage orders, menu, analytics, and payouts from one place.",
  },
  {
    icon: "support_agent",
    title: "24/7 Support",
    desc: "Dedicated partner support team to help you grow your business.",
  },
  {
    icon: "campaign",
    title: "Marketing Boost",
    desc: "Get featured in promotions, discounts, and seasonal campaigns.",
  },
  {
    icon: "account_balance_wallet",
    title: "Weekly Payouts",
    desc: "Get paid every week with transparent settlement reports.",
  },
];

const steps = [
  {
    num: "1",
    title: "Register Your Store",
    desc: "Fill out a simple form with your business details and documents.",
  },
  {
    num: "2",
    title: "Get Verified",
    desc: "Our team reviews your application within 24-48 hours.",
  },
  {
    num: "3",
    title: "Upload Your Menu",
    desc: "Add your menu items, prices, photos, and set delivery preferences.",
  },
  {
    num: "4",
    title: "Start Selling",
    desc: "Go live and start receiving orders from customers near you.",
  },
];

const faqs = [
  {
    q: "How long does verification take?",
    a: "Most applications are reviewed within 24-48 hours. You'll get an email once verified.",
  },
  {
    q: "What documents do I need?",
    a: "You'll need a valid GST number, FSSAI license (for food), and PAN card.",
  },
  {
    q: "Are there any hidden fees?",
    a: "No hidden fees. We charge a flat 15% commission per order with no monthly or listing fees.",
  },
  {
    q: "When do I get paid?",
    a: "Payouts are processed every Monday for the previous week's orders.",
  },
  { q: "Can I partner from any city?", a: "We're currently active in Gauripur and Dhubri only." },
];

export default function PartnerLanding() {
  const [vendorCount, setVendorCount] = useState(0);

  useEffect(() => {
    createClient()
      .from("vendors")
      .select("*", { count: "exact", head: true })
      .then(({ count }: { count: number | null }) => {
        if (count) setVendorCount(count);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tighter text-[var(--color-primary)]"
        >
          MIIAM
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login?redirect=/partner/dashboard"
            className="text-sm font-medium text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]"
          >
            Sign In
          </Link>
          <Link
            href="/partner/register"
            className="text-on-primary rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold transition-colors hover:bg-[var(--color-primary-dim)]"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="flex flex-col items-center gap-12 md:flex-row">
          <div className="flex-1 text-center md:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-container)] px-4 py-2 text-sm font-bold text-[var(--color-primary)]">
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              Join {vendorCount > 0 ? `${vendorCount}+` : "Our"} Partners
            </div>
            <h1 className="mb-6 text-4xl leading-tight font-extrabold tracking-tight text-[var(--color-on-surface)] md:text-6xl">
              Partner with <span className="text-[var(--color-primary)]">MIIAM</span>
              <br />
              <span className="text-[var(--color-on-surface-variant)]">and grow your business</span>
            </h1>
            <p className="mx-auto mb-8 max-w-lg text-lg text-[var(--color-outline)] md:mx-0">
              List your restaurant or store on India&apos;s fastest-growing delivery platform. Reach
              more customers, earn more revenue.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
              <Link
                href="/partner/register"
                className="text-on-primary rounded-2xl bg-[var(--color-primary)] px-8 py-4 text-center text-lg font-bold shadow-[var(--color-primary)]/20 shadow-xl transition-colors hover:bg-[var(--color-primary-dim)]"
              >
                Register Your Store
              </Link>
              <Link
                href="#how-it-works"
                className="rounded-2xl border-2 border-[var(--color-border-subtle)] px-8 py-4 text-center text-lg font-bold text-[var(--color-on-surface)] transition-colors hover:border-[var(--color-outline-variant)]"
              >
                How It Works
              </Link>
            </div>
          </div>
          <div className="flex-1 rounded-3xl bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-primary)]/5 p-8 text-center md:p-12">
            <span
              className="material-symbols-outlined mb-4 text-8xl text-[var(--color-primary)]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              storefront
            </span>
            <p className="text-2xl font-extrabold text-[var(--color-on-surface)]">
              {vendorCount > 0 ? `${vendorCount}+` : "Growing"}
            </p>
            <p className="text-[var(--color-outline)]">Active Restaurant Partners</p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xl font-black text-[var(--color-primary)]">2+</p>
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
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-extrabold text-[var(--color-on-surface)] md:text-4xl">
            Why Partner with MIIAM?
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-[var(--color-outline)]">
            Everything you need to run and grow your delivery business
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-container)]">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">
                    {b.icon}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold text-[var(--color-on-surface)]">{b.title}</h3>
                <p className="text-sm text-[var(--color-outline)]">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-4 text-center text-3xl font-extrabold text-[var(--color-on-surface)] md:text-4xl">
          How It Works
        </h2>
        <p className="mb-12 text-center text-[var(--color-outline)]">
          Get started in 4 simple steps
        </p>
        <div className="grid gap-8 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="text-on-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-2xl font-black">
                {s.num}
              </div>
              <h3 className="mb-2 font-bold text-[var(--color-on-surface)]">{s.title}</h3>
              <p className="text-sm text-[var(--color-outline)]">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link
            href="/partner/register"
            className="text-on-primary inline-block rounded-2xl bg-[var(--color-primary)] px-8 py-4 text-lg font-bold shadow-[var(--color-primary)]/20 shadow-xl transition-colors hover:bg-[var(--color-primary-dim)]"
          >
            Start Registration
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[var(--color-surface-subtle)] py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-12 text-center text-3xl font-extrabold text-[var(--color-on-surface)] md:text-4xl">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-5 font-bold text-[var(--color-on-surface)]">
                  {f.q}
                  <span className="material-symbols-outlined text-[var(--color-outline-variant)] transition-transform group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <div className="px-6 pb-5 text-sm text-[var(--color-outline)]">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-4 text-3xl font-extrabold text-[var(--color-on-surface)] md:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mb-8 text-[var(--color-outline)]">
            Join thousands of partners already growing with MIIAM.
          </p>
          <Link
            href="/partner/register"
            className="text-on-primary inline-block rounded-2xl bg-[var(--color-primary)] px-10 py-4 text-xl font-bold shadow-[var(--color-primary)]/20 shadow-xl transition-colors hover:bg-[var(--color-primary-dim)]"
          >
            Register Now — It&apos;s Free
          </Link>
          <p className="mt-4 text-xs text-[var(--color-outline-variant)]">
            No commitment required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border-subtle)] py-8 text-center text-sm text-[var(--color-outline-variant)]">
        <div className="mb-3 flex justify-center gap-6">
          <Link
            href="/terms"
            className="transition-colors hover:text-[var(--color-on-surface-variant)]"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="transition-colors hover:text-[var(--color-on-surface-variant)]"
          >
            Privacy
          </Link>
          <Link
            href="/refunds"
            className="transition-colors hover:text-[var(--color-on-surface-variant)]"
          >
            Refund Policy
          </Link>
        </div>
        <p>&copy; {new Date().getFullYear()} MIIAM. All rights reserved.</p>
      </footer>
    </div>
  );
}
