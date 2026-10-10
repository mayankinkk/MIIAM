"use client";

import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useTranslation } from "@/lib/i18n/useTranslation";

const legalLinks = [
  {
    icon: "description",
    title: "Terms of Service",
    sub: "Rules and conditions of use",
    href: "/terms",
  },
  {
    icon: "privacy_tip",
    title: "Privacy Policy",
    sub: "How we handle your data",
    href: "/privacy",
  },
  {
    icon: "assignment_return",
    title: "Refund Policy",
    sub: "Returns & cancellations",
    href: "/terms#refund",
  },
  { icon: "gavel", title: "Cookie Policy", sub: "How we use cookies", href: "/terms#cookies" },
  {
    icon: "contact_support",
    title: "Grievance Officer",
    sub: "Raise a formal complaint",
    href: "/app/support",
  },
];

export default function LegalPage() {
  const { t } = useTranslation();
  return (
    <div className="bg-background text-on-background min-h-screen pb-24">
      <header className="bg-surface-container border-outline-variant/10 sticky top-0 z-10 border-b px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/app/settings"
            className="bg-surface-container-high hover:bg-surface-container-highest flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-on-background">arrow_back</span>
          </Link>
          <h1 className="text-on-background text-xl font-black">{t.settings.legal}</h1>
        </div>
      </header>

      <Breadcrumbs
        items={[
          { label: t.common.home, href: "/app/home" },
          { label: t.settings.title, href: "/app/settings" },
          { label: t.settings.legal },
        ]}
      />

      <main className="p-6">
        <div className="bg-surface-container border-outline-variant/10 overflow-hidden rounded-2xl border shadow-sm">
          {legalLinks.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`hover:bg-surface-container-high flex items-center gap-4 p-4 transition-colors ${i !== legalLinks.length - 1 ? "border-outline-variant/10 border-b" : ""}`}
            >
              <div className="bg-surface-container-high flex h-10 w-10 items-center justify-center rounded-xl">
                <span className="material-symbols-outlined text-on-surface-variant">
                  {item.icon}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-on-surface font-bold">{item.title}</p>
                <p className="text-on-surface-variant text-xs">{item.sub}</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/50">
                open_in_new
              </span>
            </Link>
          ))}
        </div>

        <p className="text-on-surface-variant/60 mt-8 text-center text-xs">
          MIIAM v1.0 · © 2026 MIIAM Technologies Pvt. Ltd.
          <br />
          Registered in India · CIN: U74999XX2025PTC000001
        </p>
      </main>
    </div>
  );
}
