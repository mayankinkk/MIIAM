"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguageStore } from "@/lib/store/languageStore";
import { translations } from "@/lib/i18n/translations";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { createClient } from "@/lib/supabase/client";

export default function LandingPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, [supabase]);

  const t = mounted ? translations[language] : translations['en'];

  const quickServices = [
    { icon: "restaurant", label: "Food", href: "/app/food", color: "from-[#ba001c] to-[#ff5f6d]" },
    { icon: "home_repair_service", label: "Services", href: "/services", color: "from-[#0b50d5] to-[#667eea]" },
    { icon: "local_grocery_store", label: "Grocery", href: "/app/grocery", color: "from-[#11998e] to-[#38ef7d]" },
    { icon: "local_pharmacy", label: "Pharmacy", href: "/app/pharmacy", color: "from-[#8e2de2] to-[#da22ff]" },
    { icon: "local_florist", label: "Flowers", href: "/app/flowers", color: "from-[#f7971e] to-[#ffd200]" },
    { icon: "spa", label: "Beauty", href: "/app/beauty", color: "from-[#ee0979] to-[#ff6a00]" },
  ];

  return (
    <>
      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100/80 transition-all duration-500">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <Link href="/" className="text-3xl font-black text-[#ba001c] tracking-tighter select-none">
            MIIAM
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: t.navFood, href: "/app/food" },
              { label: t.navServices, href: "/services" },
              { label: t.navVendors, href: "/app/explore" },
              { label: t.navCareers, href: "/careers" },
              { label: t.navBusiness, href: "/about" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-slate-600 font-semibold text-sm hover:text-[#ba001c] transition-colors duration-200 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#ba001c] after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {mounted && <LanguageSwitcher />}
            {user ? (
              <Link
                href="/app/profile"
                className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-full transition-all duration-200 group"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ba001c] to-[#ff5f6d] text-white flex items-center justify-center font-bold text-xs">
                  {user.email?.[0].toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-slate-700 group-hover:text-[#ba001c] hidden sm:block">My Account</span>
              </Link>
            ) : (
              <Link
                href="/onboarding"
                className="bg-[#ba001c] hover:bg-[#a40017] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-[#ba001c]/20 hover:shadow-[#ba001c]/30 active:scale-95 transition-all duration-200"
              >
                {t.getApp}
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-[72px] overflow-x-hidden">

        {/* ── Hero Section ── */}
        <section className="relative min-h-[85vh] flex items-center">
          {/* Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f0f] via-[#1a0a0e] to-[#0a0a0a]" />
            <img
              src="/images/food_hero.png"
              alt="Food"
              className="absolute inset-0 w-full h-full object-cover opacity-[0.12] mix-blend-luminosity"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80"; }}
            />
          </div>

          {/* Decorative glow */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ba001c]/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#0b50d5]/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-8 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/80 text-xs font-semibold tracking-wide">Now serving your city</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6">
                {t.heroTitle1}
                <br />
                <span className="bg-gradient-to-r from-[#ff5f6d] to-[#ffc371] bg-clip-text text-transparent">{t.heroTitle2}</span>
              </h1>

              <p className="text-white/50 text-lg sm:text-xl max-w-lg mb-10 leading-relaxed font-medium">
                {t.heroDesc}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/app/food"
                  className="group flex items-center gap-3 bg-[#ba001c] hover:bg-[#d0001f] text-white pl-7 pr-5 py-4 rounded-2xl font-bold text-base shadow-xl shadow-[#ba001c]/25 hover:shadow-[#ba001c]/40 active:scale-[0.97] transition-all duration-200"
                >
                  {t.orderFood}
                  <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
                <Link
                  href="/services"
                  className="group flex items-center gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-md text-white border border-white/20 pl-7 pr-5 py-4 rounded-2xl font-bold text-base active:scale-[0.97] transition-all duration-200"
                >
                  {t.bookService}
                  <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Quick Services Grid ── */}
        <section className="relative z-20 -mt-16 max-w-5xl mx-auto px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {quickServices.map((svc) => (
                <Link
                  key={svc.label}
                  href={svc.href}
                  className="group flex flex-col items-center gap-2.5 py-3 rounded-2xl hover:bg-slate-50 transition-colors duration-200"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${svc.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{svc.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600 group-hover:text-[#ba001c] transition-colors">{svc.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features Strip ── */}
        <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "shopping_cart_checkout", label: t.featureCart, sub: "Easy ordering", color: "bg-red-50 text-[#ba001c]" },
              { icon: "bolt", label: t.featureDelivery, sub: "Under 30 mins", color: "bg-amber-50 text-amber-600" },
              { icon: "verified_user", label: t.featurePros, sub: "Background verified", color: "bg-blue-50 text-[#0b50d5]" },
              { icon: "support_agent", label: t.featureSupport, sub: "Always available", color: "bg-green-50 text-green-600" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 group">
                <div className={`${item.color} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm leading-tight">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Popular Near You ── */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800">{t.popularNearYou}</h2>
              <p className="text-slate-400 font-medium mt-1.5">{t.popularDesc}</p>
            </div>
            <Link href="/app/explore" className="text-[#ba001c] font-bold text-sm flex items-center gap-1.5 hover:gap-3 transition-all duration-200">
              {t.viewAll} <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Food Card - Links to Pizza Paradise */}
            <Link href="/app/vendor/r2" className="md:col-span-2 group relative overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] transition-shadow duration-500">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80"
                  alt="Pizza Paradise"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-[#ba001c]/10 text-[#ba001c] text-[10px] font-black px-3 py-1 rounded-full mb-3 inline-block uppercase tracking-wider">{t.trendingFood}</span>
                    <h3 className="text-xl font-bold text-slate-800">Pizza Paradise</h3>
                    <div className="flex items-center gap-2 mt-1.5 text-slate-500 text-sm font-medium">
                      <span className="flex items-center gap-1 text-green-600 font-bold">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        4.9
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>2k+ reviews</span>
                      <span className="text-slate-300">•</span>
                      <span>15-20 mins</span>
                    </div>
                  </div>
                  <span className="bg-[#ba001c] p-3 rounded-xl text-white shadow-lg shadow-[#ba001c]/20">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_shopping_cart</span>
                  </span>
                </div>
              </div>
            </Link>

            {/* Service Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] transition-shadow duration-500">
              <div className="aspect-square overflow-hidden">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  src="/images/service_cleaning.png"
                  alt="Professional cleaner"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80"; }}
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <span className="bg-[#0b50d5]/10 text-[#0b50d5] text-[10px] font-black px-3 py-1 rounded-full mb-3 self-start uppercase tracking-wider">Service Pro</span>
                <h3 className="text-xl font-bold text-slate-800">PureHome Cleaning</h3>
                <div className="mt-auto pt-4 flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-sm">From ₹29/hr</span>
                  <span className="flex items-center gap-1.5 font-bold text-sm text-slate-700">
                    <span className="material-symbols-outlined text-[#0b50d5] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Elite
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Promo Banner ── */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 mb-24">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0f0505] via-[#1a0a0e] to-[#0a0a0a] p-10 md:p-16 flex flex-col md:flex-row items-center gap-10">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#ba001c]/20 to-transparent pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#ba001c]/15 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 flex-1">
              <span className="text-[#ff7670] font-black tracking-widest text-xs uppercase mb-4 block">{t.promoLabel}</span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-none mb-5">
                {t.promoTitle1}<br /><span className="bg-gradient-to-r from-[#ff5f6d] to-[#ffc371] bg-clip-text text-transparent">{t.promoTitle2}</span>
              </h2>
              <p className="text-white/40 text-lg max-w-md mb-8">
                {t.promoDesc1}<span className="text-white font-bold">MIIAM50</span>{t.promoDesc2}
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 bg-[#ba001c] text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl shadow-[#ba001c]/20 hover:shadow-[#ba001c]/40 active:scale-95 transition-all duration-200"
              >
                {t.claimOffer}
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
            <div className="relative z-10 w-full md:w-1/3">
              <div className="bg-white/[0.06] backdrop-blur-xl p-7 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex gap-4 mb-5">
                  <div className="w-11 h-11 bg-gradient-to-br from-[#ba001c] to-[#ff5f6d] rounded-xl flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-white text-lg">confirmation_number</span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Promo Applied</p>
                    <p className="text-white/40 text-xs">Save up to ₹25.00</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#ba001c] to-[#ff5f6d] w-2/3 rounded-full" />
                  </div>
                  <p className="text-white/40 text-xs font-medium">942 people claimed this today</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0a0a0a] w-full py-14 px-6 lg:px-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 max-w-7xl mx-auto">
          <div className="text-2xl font-black text-white tracking-tighter">MIIAM</div>
          <div className="flex flex-wrap gap-8 justify-center">
            <Link href="/terms" className="text-slate-500 text-xs uppercase tracking-widest font-semibold hover:text-white transition-colors duration-200">
              Terms
            </Link>
            <Link href="/privacy" className="text-slate-500 text-xs uppercase tracking-widest font-semibold hover:text-white transition-colors duration-200">
              Privacy
            </Link>
            <Link href="/terms#refund" className="text-slate-500 text-xs uppercase tracking-widest font-semibold hover:text-white transition-colors duration-200">
              Refunds
            </Link>
          </div>
          <div className="text-slate-600 text-xs font-medium">
            {t.footerRights}
          </div>
        </div>
      </footer>
    </>
  );
}