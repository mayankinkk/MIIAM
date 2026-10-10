"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";

function VendorFailureContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const vendorName = searchParams.get("vendor") || "the restaurant";
  const reason = searchParams.get("reason") || "The vendor was unable to accept your order";

  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const options = [
    {
      id: "refund",
      icon: "account_balance_wallet",
      title: "Full Refund",
      description: "Get your money back to your original payment method",
    },
    {
      id: "reorder",
      icon: "restart_alt",
      title: "Try Another Restaurant",
      description: "Browse similar restaurants that are open",
    },
  ];

  const handleOptionSelect = (id: string) => {
    setSelectedOption(id);
  };

  return (
    <div className="bg-surface min-h-screen">
      <nav className="bg-surface-container-lowest/90 fixed top-0 z-50 flex w-full items-center justify-between px-6 py-4 shadow-sm backdrop-blur-2xl">
        <Link
          href="/app/orders"
          className="hover:bg-surface-container flex h-10 w-10 items-center justify-center rounded-full transition-all"
        >
          <span className="material-symbols-outlined text-accent">close</span>
        </Link>
        <span className="text-accent text-xl font-extrabold tracking-tighter">MIIAM</span>
        <div className="w-10" />
      </nav>

      <Breadcrumbs
        items={[
          { label: "Home", href: "/app/home" },
          { label: "Order", href: "/app/orders" },
          { label: "Vendor Unavailable" },
        ]}
      />

      <main className="mx-auto max-w-lg px-6 pt-24 pb-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <span
              className="material-symbols-outlined text-5xl text-red-500"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              cancel
            </span>
          </div>
          <h1 className="text-on-surface mb-2 text-2xl font-extrabold">Order Can't Be Fulfilled</h1>
          <p className="text-on-surface-variant">
            {vendorName} is unable to process your order right now.
          </p>
        </div>

        <div className={`mb-8 rounded-xl border border-red-200 bg-red-50 p-4`}>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5 text-red-500">info</span>
            <div>
              <p className="font-bold text-red-700">Reason</p>
              <p className="text-sm text-red-600">{reason}</p>
            </div>
          </div>
        </div>

        {orderId && (
          <div className="bg-surface-container-lowest mb-6 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-on-surface-variant text-xs font-bold tracking-widest uppercase">
                  Order ID
                </p>
                <p className="text-on-surface font-bold">{orderId.slice(0, 8).toUpperCase()}</p>
              </div>
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                Failed
              </span>
            </div>
          </div>
        )}

        <div className="mb-8 space-y-4">
          <h2 className="text-on-surface text-lg font-bold">How would you like to proceed?</h2>
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                selectedOption === option.id
                  ? "border-primary bg-surface-container-low"
                  : "border-outline-variant/20 bg-surface-container-lowest hover:border-outline-variant/20"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    selectedOption === option.id
                      ? "bg-primary"
                      : "bg-[var(--color-surface-container)]"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      selectedOption === option.id ? "text-white" : "text-on-surface-variant"
                    }`}
                  >
                    {option.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-on-surface font-bold">{option.title}</h3>
                  <p className="text-on-surface-variant text-xs">{option.description}</p>
                </div>
                {selectedOption === option.id && (
                  <span
                    className="material-symbols-outlined text-accent"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <button
            disabled={!selectedOption}
            onClick={() => {
              if (selectedOption === "refund") {
                import("@/lib/store/toastStore").then((m) =>
                  m.useToastStore
                    .getState()
                    .addToast(
                      "Refund request submitted. You'll receive it within 3-5 business days.",
                      "success"
                    )
                );
              } else if (selectedOption === "reorder") {
                window.location.href = "/app/food";
              }
            }}
            className="bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary w-full rounded-xl py-4 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.common.confirm} {selectedOption === "refund" ? "Refund" : "Browse Restaurants"}
          </button>

          <div className="flex gap-3">
            <Link
              href="/app/orders"
              className="border-outline-variant/20 text-on-surface hover:border-primary flex-1 rounded-xl border-2 py-4 text-center font-bold transition-colors"
            >
              View All Orders
            </Link>
            <Link
              href="/app/support"
              className="border-outline-variant/20 text-on-surface hover:border-primary flex-1 rounded-xl border-2 py-4 text-center font-bold transition-colors"
            >
              Get Help
            </Link>
          </div>
        </div>

        <div className="bg-surface-container mt-8 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary">support_agent</span>
            <div>
              <p className="text-on-surface font-bold">Need immediate help?</p>
              <p className="text-on-surface-variant text-sm">Contact our 24/7 support team</p>
            </div>
          </div>
          <Link
            href="/app/support"
            className="bg-secondary mt-3 block w-full rounded-lg py-3 text-center text-sm font-bold text-white"
          >
            Chat with Support
          </Link>
        </div>
      </main>
    </div>
  );
}

function Loading() {
  return (
    <div className="bg-surface flex min-h-screen items-center justify-center">
      <div className="flex animate-pulse flex-col items-center">
        <div className="mb-4 h-16 w-16 rounded-full bg-[var(--color-surface-container-high)]"></div>
        <div className="h-4 w-48 rounded bg-[var(--color-surface-container-high)]"></div>
      </div>
    </div>
  );
}

export default function VendorFailurePage() {
  return (
    <Suspense fallback={<Loading />}>
      <VendorFailureContent />
    </Suspense>
  );
}
