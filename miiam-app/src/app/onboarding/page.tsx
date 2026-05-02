import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Welcome to MIIAM",
  description: "Your premium dual-engine concierge for food and services.",
};

export default function OnboardingPage() {
  return (
    <div className="bg-[#fff4f4] text-[#4d212a] min-h-screen">
      {/* Background Kinetic Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#ff7670]/20 rounded-full blur-[100px]" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#c4d0ff]/20 rounded-full blur-[100px]" />

      {/* Step 1: Welcome */}
      <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Floating Debris */}
        <div className="absolute top-20 right-10 text-5xl transform rotate-12 select-none" style={{ filter: "drop-shadow(0 10px 15px rgba(77,33,42,0.1))" }}>🍕</div>
        <div className="absolute top-1/2 left-4 text-4xl transform -rotate-12 select-none" style={{ filter: "drop-shadow(0 10px 15px rgba(77,33,42,0.1))" }}>📦</div>
        <div className="absolute bottom-40 right-20 text-6xl transform rotate-6 select-none" style={{ filter: "drop-shadow(0 10px 15px rgba(77,33,42,0.1))" }}>✨</div>

        <div className="max-w-4xl w-full z-10">
          {/* Brand */}
          <div className="flex justify-center mb-12">
            <span className="text-5xl font-extrabold tracking-tighter text-[#ba001c]">MIIAM</span>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
            <div className="md:col-span-8 bg-white rounded-lg p-10 shadow-[0px_20px_40px_rgba(77,33,42,0.06)] flex flex-col justify-between min-h-[400px]">
              <div>
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-6 leading-none">
                  Taste the <span className="text-[#ba001c]">Vibrant</span> Side of Life.
                </h1>
                <p className="text-[#814c55] max-w-md">
                  MIIAM is your premium dual-engine concierge. We bridge the gap between world-class culinary experiences and professional urban services.
                </p>
              </div>
              <div className="flex items-center gap-4 mt-8">
                <div className="w-12 h-12 rounded-full bg-[#ba001c] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">restaurant</span>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#0b50d5] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">handyman</span>
                </div>
                <span className="font-bold text-[#814c55]">Food &amp; Services, Reimagined.</span>
              </div>
            </div>
            <div className="md:col-span-4 rounded-lg overflow-hidden relative min-h-[400px]">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_eGuofEdBeeLV9hUZfIDuiZus9YUpGGblWZHG_Lv038k38xJ7Rv2t6XiifgkgOYs4N6KvE-BZg4bFNZyT4Gcf16rleAjp4S1IEKFSaSIUzpK24GG-HdU_LwqgHZYMtDD6foWu1yk-LPP_e1IfE1jg53Zb-Yidt97otbl-EVVf4YU2jncjwS1z7ywkVZoZgRd91OGCTnabtaIPdkI-nc23qq8indQ62JTlMXOGKb_CyxZ_0lQPd4pbZFfCMHWSeJG3-mNlG55HA7Q"
                alt="Gourmet sushi platter"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#ba001c]/60 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <span className="text-xs uppercase tracking-widest font-bold opacity-80">Now Trending</span>
                <p className="text-xl font-bold">Artisan Kitchens</p>
              </div>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 mb-10">
            <div className="w-8 h-2 bg-[#ba001c] rounded-full" />
            <div className="w-2 h-2 bg-[#ffd2d7] rounded-full" />
            <div className="w-2 h-2 bg-[#ffd2d7] rounded-full" />
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/auth/signup"
              className="w-full md:w-80 text-center bento-gradient-red text-white font-bold py-5 rounded-xl shadow-lg shadow-[#ba001c]/20 transform transition-transform active:scale-95 text-lg"
            >
              Get Started
            </Link>
            <Link href="/auth/login" className="text-[#814c55] font-semibold text-sm hover:text-[#ba001c] transition-colors">
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Step 2: What is MIIAM */}
      <section className="min-h-screen bg-[#ffe1e4] flex flex-col items-center justify-center px-6 py-20 relative">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#4d212a] mb-4">One App, Two Worlds.</h2>
            <p className="text-[#814c55] text-lg">Swipe between Appetite and Trust.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white rounded-lg p-12 relative overflow-hidden group shadow-[0px_20px_40px_rgba(77,33,42,0.04)]">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ba001c]/10 rounded-full transform group-hover:scale-150 transition-transform duration-700" />
              <div className="mb-8 w-20 h-20 rounded-full bg-[#ffd2d7] flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-[#ba001c]" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant_menu</span>
              </div>
              <h3 className="text-3xl font-bold mb-6">Epicurean Desires</h3>
              <p className="text-[#814c55] leading-relaxed mb-8">
                From street-side gems to Michelin-starred kitchens. We don't just deliver food; we deliver the moment.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-[#ba001c]/10 text-[#ba001c] rounded-full text-xs font-bold uppercase tracking-wider">Fast Delivery</span>
                <span className="px-4 py-2 bg-[#ba001c]/10 text-[#ba001c] rounded-full text-xs font-bold uppercase tracking-wider">Exclusive Chefs</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-12 relative overflow-hidden group shadow-[0px_20px_40px_rgba(77,33,42,0.04)]">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#0b50d5]/10 rounded-full transform group-hover:scale-150 transition-transform duration-700" />
              <div className="mb-8 w-20 h-20 rounded-full bg-[#ffd2d7] flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-[#0b50d5]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              </div>
              <h3 className="text-3xl font-bold mb-6">Lifestyle Utility</h3>
              <p className="text-[#814c55] leading-relaxed mb-8">
                Vetted professionals for your every need. Home maintenance, wellness, or logistics.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-[#0b50d5]/10 text-[#0b50d5] rounded-full text-xs font-bold uppercase tracking-wider">Certified Pros</span>
                <span className="px-4 py-2 bg-[#0b50d5]/10 text-[#0b50d5] rounded-full text-xs font-bold uppercase tracking-wider">Secure Escrow</span>
              </div>
            </div>
          </div>
          <div className="mt-16 flex justify-center">
            <Link href="/auth/signup" className="px-12 py-5 bg-[#4d212a] text-white rounded-xl font-bold text-lg hover:bg-[#ba001c] transition-colors">
              Explore Ecosystem
            </Link>
          </div>
        </div>
      </section>

      {/* Step 3: Location */}
      <section className="min-h-screen flex items-center justify-center px-6 relative">
        <div className="max-w-xl w-full text-center">
          <div className="glass-card rounded-lg p-2 mb-12 shadow-2xl relative">
            <div className="h-80 w-full rounded-lg overflow-hidden relative">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAN1xfJwpdw2bj7H_TfKXirk6ngjY55cxxz3kiMpV5TlLyEpclKB-8Qk4HHR9l3g-blikPhN1f-ewc5O8wx354nNJU5QWj8B6v5i1Nfxa6Z0W2vAZW1UjmTRSkoa6wra81VbQLHC5MyxFmXBnZURM8H2b80AiCH48-b-Pi-TNOhqrxvffzy3ZUDaMv4En7_m96mN3aIVdF3rPrG2HobmHzJTO4ssSqAubCSqZK9jO0KTsvOtxqlf7TEIsGvBNtFcnC7C3H_cHM9Xng"
                alt="City map"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#ba001c]/10 to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-16 h-16 bg-[#ba001c]/20 rounded-full animate-ping absolute -top-4 -left-4" />
                <div className="bg-[#ba001c] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-xl relative z-10">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight mb-6">Nearby Experiences.</h2>
          <p className="text-[#814c55] text-lg leading-relaxed mb-10 max-w-md mx-auto">
            MIIAM uses your location to connect you with the best merchants and service providers in your immediate neighborhood.
          </p>
          <div className="space-y-4">
            <Link
              href="/auth/signup"
              className="w-full bento-gradient-blue text-white font-bold py-5 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-[#0b50d5]/20 transform transition-transform active:scale-95 text-lg"
            >
              <span className="material-symbols-outlined">near_me</span>
              Use current location
            </Link>
            <Link
              href="/auth/signup"
              className="block w-full py-5 text-[#4d212a] font-bold text-sm uppercase tracking-widest hover:bg-[#ffe1e4] transition-colors rounded-xl"
            >
              Enter manually
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-2 text-[#814c55] text-xs">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span>Your data is encrypted and never shared.</span>
          </div>
        </div>
      </section>
      <div className="pb-20" />
    </div>
  );
}
