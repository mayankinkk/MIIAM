"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useSupportSettings } from "@/lib/hooks/useSupportSettings";

const faqs = [
  {
    q: "How do I accept an order?",
    a: "Go to the Orders tab and tap 'Start Shopping' on any available order.",
  },
  {
    q: "When do I get paid?",
    a: "Payouts are processed daily. You can request instant payouts anytime.",
  },
  {
    q: "How does advance work?",
    a: "For grocery orders, you receive advance money to pay the vendor. Collect payment from customer if required.",
  },
  {
    q: "What if an item is unavailable?",
    a: "Mark it as 'Not Available' in the order details. The customer will be notified.",
  },
];

export default function RiderSupportPage() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const support = useSupportSettings();

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data: { user } }: { data: { user: { id: string; email?: string } | null } }) => {
        if (!user) router.push("/rider/login");
      });
  }, [supabase, router]);

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
      <header className="bg-brand-secondary rounded-b-[3rem] p-6 pb-8 text-white">
        <div className="flex items-center gap-4">
          <Link href="/rider/account" className="text-white" aria-label="Go back">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tighter">Help & Support</h1>
        </div>
      </header>

      <main className="space-y-6 p-6 pb-32">
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
          <h2 className="mb-4 font-bold text-[var(--color-on-surface)]">Contact Us</h2>
          <div className="space-y-3">
            <a
              href={`tel:${support.support_phone}`}
              className="flex w-full items-center gap-3 rounded-xl bg-[var(--color-surface-subtle)] p-4"
            >
              <span className="material-symbols-outlined text-brand-secondary">call</span>
              <span className="flex-1 text-left font-bold">Call Support</span>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                chevron_right
              </span>
            </a>
            <a
              href={`mailto:${support.support_email}`}
              className="flex w-full items-center gap-3 rounded-xl bg-[var(--color-surface-subtle)] p-4"
            >
              <span className="material-symbols-outlined text-brand-secondary">chat</span>
              <span className="flex-1 text-left font-bold">Chat with Us</span>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                chevron_right
              </span>
            </a>
            <a
              href={`mailto:${support.support_email}`}
              className="flex w-full items-center gap-3 rounded-xl bg-[var(--color-surface-subtle)] p-4"
            >
              <span className="material-symbols-outlined text-brand-secondary">email</span>
              <span className="flex-1 text-left font-bold">Email Support</span>
              <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                chevron_right
              </span>
            </a>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
          <h2 className="mb-4 font-bold text-[var(--color-on-surface)]">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-[var(--color-border-subtle)] pb-3">
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="font-bold text-[var(--color-on-surface)]">{faq.q}</span>
                  <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                    {expanded === i ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {expanded === i && (
                  <p className="mt-2 text-sm text-[var(--color-outline)]">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
