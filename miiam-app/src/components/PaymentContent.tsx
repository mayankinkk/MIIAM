"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function PaymentContent() {
  const { t } = useTranslation();
  const supabase = useMemo(() => createClient(), []);
  const [paymentMethods, setPaymentMethods] = useState<
    { id: string; type: string; last4: string; brand: string; isDefault: boolean }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      if (data) {
        setPaymentMethods(
          data.map(
            (pm: {
              id: string;
              type?: string;
              last4?: string;
              brand?: string;
              is_default?: boolean;
            }) => ({
              id: pm.id,
              type: pm.type || "card",
              last4: pm.last4 || "****",
              brand: pm.brand || "Card",
              isDefault: pm.is_default || false,
            })
          )
        );
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  return (
    <>
      <header className="bg-surface/80 fixed top-0 z-50 flex w-full items-center px-6 py-4 shadow-[0px_20px_40px_rgba(0,0,0,0.06)] backdrop-blur-2xl">
        <Link
          href="/app/profile"
          className="hover:bg-surface-container mr-4 flex h-10 w-10 items-center justify-center rounded-full transition-all"
        >
          <span className="material-symbols-outlined text-accent">arrow_back</span>
        </Link>
        <span className="text-on-surface text-xl font-extrabold tracking-tight">
          {t.profile.paymentMethods}
        </span>
      </header>
      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "Payment Methods" }]} />
      <main className="mx-auto min-h-[70vh] max-w-2xl px-6 pt-32 pb-32">
        <h1 className="text-on-surface mb-6 text-3xl font-extrabold tracking-tight">
          Payment Methods
        </h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-[var(--color-surface-container)]"
              />
            ))}
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-surface-container)]">
              <span className="material-symbols-outlined text-4xl text-[var(--color-outline-variant)]/60">
                credit_card
              </span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-[var(--color-on-surface-variant)]">
              No saved payment methods
            </h2>
            <p className="mb-6 text-sm text-[var(--color-outline-variant)]">
              Payment methods will appear here after your first online payment via Razorpay.
            </p>
            <Link
              href="/app/food"
              className="bg-primary text-on-primary inline-block rounded-xl px-6 py-3 text-sm font-bold"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className="bg-surface-container-lowest flex items-center justify-between rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-container)]">
                    <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                      credit_card
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">
                      {pm.brand} •••• {pm.last4}
                    </p>
                    <p className="text-xs text-[var(--color-outline-variant)]">{pm.type}</p>
                  </div>
                </div>
                {pm.isDefault && (
                  <span className="bg-primary/10 text-accent rounded-full px-2 py-1 text-xs font-bold">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-[var(--color-surface-subtle)] p-4">
          <p className="text-center text-xs text-[var(--color-outline)]">
            Payments are securely processed via Razorpay. Your card details are never stored on our
            servers.
          </p>
        </div>
      </main>
    </>
  );
}
