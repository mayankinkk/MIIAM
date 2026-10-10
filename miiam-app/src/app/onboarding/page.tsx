import type { Metadata } from "next";
import Link from "next/link";
import BlurImage from "@/components/BlurImage";

export const metadata: Metadata = {
  title: "Welcome to MIIAM",
  description: "Order food, book services - all in one app.",
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)]">
      {/* Background Kinetic Elements */}
      <div className="bg-primary-container/20 absolute -top-24 -left-24 h-96 w-96 rounded-full blur-[100px]" />
      <div className="bg-secondary-container/20 absolute -right-24 -bottom-24 h-96 w-96 rounded-full blur-[100px]" />

      {/* Step 1: Welcome */}
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
        {/* Floating Debris */}
        <div
          className="absolute top-20 right-10 rotate-12 transform text-5xl select-none"
          style={{ filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.1))" }}
        >
          🍕
        </div>
        <div
          className="absolute top-1/2 left-4 -rotate-12 transform text-4xl select-none"
          style={{ filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.1))" }}
        >
          📦
        </div>
        <div
          className="absolute right-20 bottom-40 rotate-6 transform text-6xl select-none"
          style={{ filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.1))" }}
        >
          ✨
        </div>

        <div className="z-10 w-full max-w-4xl">
          {/* Brand */}
          <div className="mb-12 flex justify-center">
            <span className="text-5xl font-extrabold tracking-tighter text-[var(--color-accent)]">
              MIIAM
            </span>
          </div>

          {/* Bento Grid */}
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="flex min-h-[400px] flex-col justify-between rounded-lg bg-[var(--color-surface-container-lowest)] p-10 shadow-[0px_20px_40px_rgba(0,0,0,0.06)] md:col-span-8">
              <div>
                <h1 className="mb-6 text-5xl leading-none font-extrabold tracking-tighter md:text-6xl">
                  Taste the <span className="text-[var(--color-accent)]">Vibrant</span> Side of
                  Life.
                </h1>
                <p className="max-w-md text-[var(--color-on-surface-variant)]">
                  MIIAM brings you the best of food delivery and home services in one app.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <div className="text-on-primary flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]">
                  <span className="material-symbols-outlined">restaurant</span>
                </div>
                <div className="bg-brand-secondary flex h-12 w-12 items-center justify-center rounded-full text-white">
                  <span className="material-symbols-outlined">handyman</span>
                </div>
                <span className="font-bold text-[var(--color-on-surface-variant)]">
                  Food &amp; Services, Reimagined.
                </span>
              </div>
            </div>
            <div className="relative min-h-[400px] overflow-hidden rounded-lg md:col-span-4">
              <BlurImage
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_eGuofEdBeeLV9hUZfIDuiZus9YUpGGblWZHG_Lv038k38xJ7Rv2t6XiifgkgOYs4N6KvE-BZg4bFNZyT4Gcf16rleAjp4S1IEKFSaSIUzpK24GG-HdU_LwqgHZYMtDD6foWu1yk-LPP_e1IfE1jg53Zb-Yidt97otbl-EVVf4YU2jncjwS1z7ywkVZoZgRd91OGCTnabtaIPdkI-nc23qq8indQ62JTlMXOGKb_CyxZ_0lQPd4pbZFfCMHWSeJG3-mNlG55HA7Q"
                alt="Gourmet sushi platter"
                fill
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)]/60 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <span className="text-xs font-bold tracking-widest uppercase opacity-80">
                  Now Trending
                </span>
                <p className="text-xl font-bold">Artisan Kitchens</p>
              </div>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="mb-10 flex justify-center gap-2">
            <div className="h-2 w-8 rounded-full bg-[var(--color-primary)]" />
            <div className="bg-surface-container-highest h-2 w-2 rounded-full" />
            <div className="bg-surface-container-highest h-2 w-2 rounded-full" />
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/app/home"
              className="bento-gradient-red text-on-primary w-full transform rounded-xl py-5 text-center text-lg font-bold shadow-[var(--color-primary)]/20 shadow-lg transition-transform active:scale-95 md:w-80"
            >
              Get Started
            </Link>
          </div>
        </div>
      </main>

      {/* Step 2: What is MIIAM */}
      <section className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--color-surface-container)] px-6 py-20">
        <div className="w-full max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-[var(--color-on-surface)] md:text-5xl">
              One App, Two Worlds.
            </h2>
            <p className="text-lg text-[var(--color-on-surface-variant)]">
              Swipe between Appetite and Trust.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="group relative overflow-hidden rounded-lg bg-[var(--color-surface-container-lowest)] p-12 shadow-[0px_20px_40px_rgba(0,0,0,0.04)]">
              <div className="absolute -top-10 -right-10 h-40 w-40 transform rounded-full bg-[var(--color-primary)]/10 transition-transform duration-700 group-hover:scale-150" />
              <div className="bg-surface-container-highest mb-8 flex h-20 w-20 items-center justify-center rounded-full">
                <span
                  className="material-symbols-outlined text-accent text-4xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  restaurant_menu
                </span>
              </div>
              <h3 className="mb-6 text-3xl font-bold">Food Delivery</h3>
              <p className="mb-8 leading-relaxed text-[var(--color-on-surface-variant)]">
                From local favorites to top restaurants. We don't just deliver food; we deliver the
                moment.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-[var(--color-primary)]/10 px-4 py-2 text-xs font-bold tracking-wider text-[var(--color-accent)] uppercase">
                  Fast Delivery
                </span>
                <span className="rounded-full bg-[var(--color-primary)]/10 px-4 py-2 text-xs font-bold tracking-wider text-[var(--color-accent)] uppercase">
                  Exclusive Chefs
                </span>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-lg bg-[var(--color-surface-container-lowest)] p-12 shadow-[0px_20px_40px_rgba(0,0,0,0.04)]">
              <div className="bg-brand-secondary/10 absolute -top-10 -right-10 h-40 w-40 transform rounded-full transition-transform duration-700 group-hover:scale-150" />
              <div className="bg-surface-container-highest mb-8 flex h-20 w-20 items-center justify-center rounded-full">
                <span
                  className="material-symbols-outlined text-brand-secondary text-4xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified_user
                </span>
              </div>
              <h3 className="mb-6 text-3xl font-bold">Lifestyle Utility</h3>
              <p className="mb-8 leading-relaxed text-[var(--color-on-surface-variant)]">
                Vetted professionals for your every need. Home maintenance, wellness, or logistics.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="bg-brand-secondary/10 text-brand-secondary rounded-full px-4 py-2 text-xs font-bold tracking-wider uppercase">
                  Certified Pros
                </span>
                <span className="bg-brand-secondary/10 text-brand-secondary rounded-full px-4 py-2 text-xs font-bold tracking-wider uppercase">
                  Secure Payment
                </span>
              </div>
            </div>
          </div>
          <div className="mt-16 flex justify-center">
            <Link
              href="/app/home"
              className="text-on-primary rounded-xl bg-[var(--color-on-surface)] px-12 py-5 text-lg font-bold transition-colors hover:bg-[var(--color-primary)]"
            >
              Explore Ecosystem
            </Link>
          </div>
        </div>
      </section>

      {/* Step 3: Location */}
      <section className="relative flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-xl text-center">
          <div className="glass-card relative mb-12 rounded-lg p-2 shadow-2xl">
            <div className="relative h-80 w-full overflow-hidden rounded-lg">
              <BlurImage
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAN1xfJwpdw2bj7H_TfKXirk6ngjY55cxxz3kiMpV5TlLyEpclKB-8Qk4HHR9l3g-blikPhN1f-ewc5O8wx354nNJU5QWj8B6v5i1Nfxa6Z0W2vAZW1UjmTRSkoa6wra81VbQLHC5MyxFmXBnZURM8H2b80AiCH48-b-Pi-TNOhqrxvffzy3ZUDaMv4En7_m96mN3aIVdF3rPrG2HobmHzJTO4ssSqAubCSqZK9jO0KTsvOtxqlf7TEIsGvBNtFcnC7C3H_cHM9Xng"
                alt="City map"
                fill
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)]/10 to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="absolute -top-4 -left-4 h-16 w-16 animate-ping rounded-full bg-[var(--color-primary)]/20" />
                <div className="text-on-primary relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] shadow-xl">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
              </div>
            </div>
          </div>
          <h2 className="mb-6 text-4xl font-extrabold tracking-tight">Nearby Experiences.</h2>
          <p className="mx-auto mb-10 max-w-md text-lg leading-relaxed text-[var(--color-on-surface-variant)]">
            MIIAM uses your location to connect you with the best merchants and service providers in
            your immediate neighborhood.
          </p>
          <div className="space-y-4">
            <Link
              href="/app/home"
              className="bg-secondary shadow-brand-secondary/20 flex w-full transform items-center justify-center gap-3 rounded-xl py-5 text-lg font-bold text-white shadow-lg transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined">near_me</span>
              Use current location
            </Link>
            <Link
              href="/app/home"
              className="block w-full rounded-xl py-5 text-sm font-bold tracking-widest text-[var(--color-on-surface)] uppercase transition-colors hover:bg-[var(--color-surface-container)]"
            >
              Enter manually
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span>Your data is encrypted and never shared.</span>
          </div>
        </div>
      </section>
      <div className="pb-20" />
    </div>
  );
}
