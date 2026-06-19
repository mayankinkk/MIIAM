"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguageStore } from "@/lib/store/languageStore";
import { getTranslationsSync } from "@/lib/i18n";
import { getPrintingPricing } from "@/lib/printing-pricing";
import { LandingNavbar } from "@/components/layout/LandingNavbar";

export default function PublicPrintLanding() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [pricing, setPricing] = useState({ bwPerPage: 2, colorPerPage: 10, glossySurcharge: 5, a3Surcharge: 3 });

  useEffect(() => {
    setMounted(true);
    setPricing(getPrintingPricing());
  }, []);

  const t = mounted ? getTranslationsSync(language).print : getTranslationsSync("en").print;

  const features = [
    { icon: "bolt", title: "30-minute delivery", desc: "Average delivery under 30 minutes across the city" },
    { icon: "lock", title: "Private & secure", desc: "Files are auto-deleted after print. No backups, no peeking." },
    { icon: "price_check", title: "No hidden fees", desc: "Transparent per-page pricing. No minimum, no surprises." },
    { icon: "face", title: "Passport photos", desc: "Compliant photos for 11 countries, ready in 15 minutes" },
  ];

  const useCases = [
    { icon: "school", label: "Students", desc: "Notes, assignments, projects" },
    { icon: "work", label: "Professionals", desc: "Reports, contracts, presentations" },
    { icon: "badge", label: "Travelers", desc: "Passport, visa, ID photos" },
    { icon: "menu_book", label: "Authors", desc: "Manuscripts with binding" },
  ];

  return (
    <>
      {/* SEO meta — Next.js will use the page's layout if defined; keep head in layout for app router */}
      <LandingNavbar
        variant="default"
        links={[]}
        showGetApp={false}
        rightContent={
          <Link
            href="/app/printing"
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dim)] text-white px-5 py-2 rounded-full font-bold text-sm shadow-lg shadow-[var(--color-primary)]/20 transition-all"
          >
            Start printing →
          </Link>
        }
      />

      <main className="pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0f0505] via-[#1a0a0e] to-[#0a0a0a]">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-primary)]/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--color-primary)]/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 py-20 text-center">
            <div className="inline-flex items-center gap-2 bg-[var(--color-surface-container-lowest)]/10 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/10">
              <span className="material-symbols-outlined text-white text-base">print</span>
              <span className="text-white/90 text-xs font-semibold tracking-wide">MIIAM Print Store</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.05] mb-6">
              Print anything.<br />
              <span className="bg-gradient-to-r from-[var(--color-primary-light)] to-[#ffc371] bg-clip-text text-transparent">Delivered in 30 minutes.</span>
            </h1>
            <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
              Documents, passport photos, reports, presentations. Upload, customize, and we'll print and deliver to your door.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/app/printing"
                className="flex items-center gap-2 bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 px-8 py-4 rounded-2xl font-black text-base shadow-xl transition-all"
              >
                <span className="material-symbols-outlined">upload</span>
                Upload &amp; Print
              </Link>
              <Link
                href="/app/printing/passport"
                className="flex items-center gap-2 bg-[var(--color-surface-container-lowest)]/10 backdrop-blur-md text-white border border-white/20 px-6 py-4 rounded-2xl font-bold text-base transition-all"
              >
                <span className="material-symbols-outlined">face</span>
                Passport Photos
              </Link>
            </div>

            <div className="mt-10 inline-flex items-baseline gap-2 bg-[var(--color-surface-container-lowest)]/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
              <span className="text-white/60 text-sm">From</span>
              <span className="text-3xl font-black text-white">₹{pricing.bwPerPage}</span>
              <span className="text-white/60 text-sm">per B&amp;W page · ₹{pricing.colorPerPage} color</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-black text-[var(--color-on-surface)] text-center mb-10">Why print with MIIAM</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 border border-[var(--color-border-subtle)] shadow-sm">
                <div className="w-11 h-11 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[var(--color-primary)]">{f.icon}</span>
                </div>
                <h3 className="font-bold text-[var(--color-on-surface)] text-sm">{f.title}</h3>
                <p className="text-xs text-[var(--color-outline)] mt-1 leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use cases */}
        <section className="bg-[var(--color-surface-subtle)] py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <h2 className="text-2xl font-black text-[var(--color-on-surface)] text-center mb-10">Who prints with us</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {useCases.map((u) => (
                <div key={u.label} className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 text-center border border-[var(--color-border-subtle)]">
                  <div className="w-12 h-12 bg-[var(--color-primary)]/5 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-xl">{u.icon}</span>
                  </div>
                  <p className="font-bold text-[var(--color-on-surface)] text-sm">{u.label}</p>
                  <p className="text-xs text-[var(--color-outline)] mt-0.5">{u.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing transparency */}
        <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-black text-[var(--color-on-surface)] text-center mb-2">Transparent pricing</h2>
          <p className="text-center text-[var(--color-outline)] mb-10">No minimum, no hidden fees</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 border-2 border-[var(--color-border-subtle)]">
              <p className="text-xs text-[var(--color-outline)] font-black uppercase tracking-widest">Black &amp; White</p>
              <p className="text-5xl font-black text-[var(--color-on-surface)] mt-2">₹{pricing.bwPerPage}</p>
              <p className="text-[var(--color-outline)] text-sm mt-1">per page · single-sided A4</p>
              <ul className="mt-4 space-y-1.5 text-sm text-[var(--color-on-surface-variant)]">
                <li>• Notes, drafts, contracts</li>
                <li>• No minimum pages</li>
                <li>• Same-day delivery</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dim)] rounded-2xl p-6 text-white">
              <p className="text-xs text-white/70 font-black uppercase tracking-widest">Color</p>
              <p className="text-5xl font-black mt-2">₹{pricing.colorPerPage}</p>
              <p className="text-white/80 text-sm mt-1">per page · A4 · premium color</p>
              <ul className="mt-4 space-y-1.5 text-sm text-white/90">
                <li>• Presentations, charts, photos</li>
                <li>• Glossy +₹{pricing.glossySurcharge}/page available</li>
                <li>• A3 size +₹{pricing.a3Surcharge}/page available</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ-style */}
        <section className="max-w-3xl mx-auto px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-black text-[var(--color-on-surface)] text-center mb-8">Frequently asked</h2>
          <div className="space-y-3">
            {[
              { q: "What file types can I upload?", a: "PDF, JPG, and PNG files up to 50MB each, and up to 15 files per order." },
              { q: "How long does delivery take?", a: "Most orders arrive within 30 minutes. Rush 15-minute delivery is available for last-minute jobs." },
              { q: "Are my files safe?", a: "Your files are processed only for your order and automatically deleted after delivery. We never read or share them." },
              { q: "Can I print passport photos?", a: "Yes — we support passport, visa, and ID photos for 11 countries including India, US, Schengen, UK, Japan, China, Canada, and Australia." },
              { q: "Do you offer binding and lamination?", a: "Yes. We offer spiral, soft, and hard binding, plus A4 and ID-card lamination. Cover pages, hole-punching, and folding are also available." },
            ].map((item) => (
              <details key={item.q} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-2xl p-4 group">
                <summary className="font-bold text-[var(--color-on-surface)] cursor-pointer flex items-center justify-between text-sm">
                  {item.q}
                  <span className="material-symbols-outlined text-[var(--color-outline-variant)] group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <p className="text-sm text-[var(--color-on-surface-variant)] mt-2 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-6 lg:px-8 pb-20 text-center">
          <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dim)] rounded-3xl p-10 text-white">
            <h2 className="text-3xl font-black mb-2">Ready to print?</h2>
            <p className="text-white/80 mb-6">Upload in 30 seconds. Pickup in 30 minutes.</p>
            <Link
              href="/app/printing"
              className="inline-flex items-center gap-2 bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] px-8 py-4 rounded-2xl font-black text-base shadow-xl hover:bg-[var(--color-primary)]/5 transition-all"
            >
              <span className="material-symbols-outlined">print</span>
              Start printing
            </Link>
            <p className="text-xs text-white/60 mt-3">No account required to browse · sign in to checkout</p>
          </div>
        </section>
      </main>
    </>
  );
}
