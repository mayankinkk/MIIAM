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
          {/* More Vendor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Link href="/app/vendor/r1" className="group relative overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] transition-shadow duration-500">
              <div className="aspect-[2/1] overflow-hidden">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80"
                  alt="Biryani House"
                />
              </div>
              <div className="p-5 flex justify-between items-center">
                <div>
                  <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Popular</span>
                  <h3 className="text-lg font-bold text-slate-800 mt-2">Biryani House</h3>
                  <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm">
                    <span className="flex items-center gap-1 text-green-600 font-bold">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      4.7
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>25-35 mins</span>
                  </div>
                </div>
                <span className="text-slate-400 font-bold">From ₹180</span>
              </div>
            </Link>

            <Link href="/app/vendor/r3" className="group relative overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] transition-shadow duration-500">
              <div className="aspect-[2/1] overflow-hidden">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  src="https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80"
                  alt="Chinese Corner"
                />
              </div>
              <div className="p-5 flex justify-between items-center">
                <div>
                  <span className="bg-red-100 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">Trending</span>
                  <h3 className="text-lg font-bold text-slate-800 mt-2">Chinese Corner</h3>
                  <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm">
                    <span className="flex items-center gap-1 text-green-600 font-bold">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      4.8
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>20-30 mins</span>
                  </div>
                </div>
                <span className="text-slate-400 font-bold">From ₹160</span>
              </div>
            </Link>
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
            <Link href="/partner" className="text-[#ba001c] text-xs uppercase tracking-widest font-black border-l-0 md:border-l border-slate-800 pl-0 md:pl-8 hover:text-white transition-colors duration-200">
              Partner Portal
            </Link>
            <Link href="/admin" className="text-slate-500 text-xs uppercase tracking-widest font-bold hover:text-white transition-colors duration-200">
              Admin Dashboard
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