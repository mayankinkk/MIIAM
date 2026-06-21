"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function PaymentContent() {
  const { t } = useTranslation();
  const supabase = createClient();
  const [paymentMethods, setPaymentMethods] = useState<{ id: string; type: string; last4: string; brand: string; isDefault: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from("payment_methods").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
      if (data) {
        setPaymentMethods(data.map((pm: { id: string; type?: string; last4?: string; brand?: string; is_default?: boolean }) => ({
          id: pm.id,
          type: pm.type || "card",
          last4: pm.last4 || "****",
          brand: pm.brand || "Card",
          isDefault: pm.is_default || false,
        })));
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  return (
    <>
      <header className="fixed top-0 w-full z-50 flex items-center px-6 py-4 bg-surface/80 backdrop-blur-2xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
        <Link href="/app/profile" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-all mr-4">
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </Link>
        <span className="text-xl font-extrabold tracking-tight text-on-surface">{t.profile.paymentMethods}</span>
      </header>
      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Payment Methods' }]} />
      <main className="pt-32 pb-32 px-6 max-w-2xl mx-auto min-h-[70vh]">
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-6">Payment Methods</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 bg-[var(--color-surface-container)] rounded-2xl animate-pulse" />)}
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[var(--color-surface-container)] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-[var(--color-outline-variant)]/60">credit_card</span>
            </div>
            <h2 className="text-xl font-bold text-[var(--color-on-surface-variant)] mb-2">No saved payment methods</h2>
            <p className="text-sm text-[var(--color-outline-variant)] mb-6">Payment methods will appear here after your first online payment via Razorpay.</p>
            <Link href="/app/food" className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm">
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((pm) => (
              <div key={pm.id} className="bg-surface-container-lowest p-4 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[var(--color-surface-container)] rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">credit_card</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{pm.brand} •••• {pm.last4}</p>
                    <p className="text-xs text-[var(--color-outline-variant)]">{pm.type}</p>
                  </div>
                </div>
                {pm.isDefault && (
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">Default</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-[var(--color-surface-subtle)] rounded-2xl">
          <p className="text-xs text-[var(--color-outline)] text-center">
            Payments are securely processed via Razorpay. Your card details are never stored on our servers.
          </p>
        </div>
      </main>
    </>
  );
}
