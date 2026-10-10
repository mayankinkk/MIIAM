"use client";

import Link from "next/link";

export default function AboutUsPage() {
  const mission = [
    {
      title: "The Platform",
      content:
        "MIIAM is an all-in-one app for food delivery and home services. Order from local restaurants, book plumbers, electricians, cleaners - everything you need, in one place.",
      icon: "hub",
    },
    {
      title: "Our Vision",
      content:
        "To build Assam's most trusted and vibrant hyper-local ecosystem where every craving is satisfied and every home task is handled with professional care.",
      icon: "visibility",
    },
    {
      title: "Community First",
      content:
        "We believe in empowering local merchants and service providers by giving them the technology to compete in a digital-first economy.",
      icon: "favorite",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] font-sans selection:bg-[var(--color-primary)]/10">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-[var(--color-primary)]/10 bg-[var(--color-surface-container-lowest)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter text-[var(--color-accent)]"
          >
            MIIAM
          </Link>
          <Link
            href="/"
            className="text-sm font-bold text-[var(--color-outline)] transition-colors hover:text-[var(--color-accent)]"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 pt-40 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <span className="mb-6 inline-block rounded-full bg-[var(--color-primary)]/10 px-4 py-1.5 text-xs font-black tracking-widest text-[var(--color-accent)] uppercase">
            Our Story
          </span>
          <h1 className="mb-4 text-5xl leading-none font-black tracking-tighter text-[var(--color-on-surface)] md:text-7xl">
            Reimagining the <br />
            <span className="text-[var(--color-accent)]">Hyper-Local Economy.</span>
          </h1>
          <p className="mb-6 text-2xl font-black tracking-tight text-[var(--color-accent)] md:text-3xl">
            Need it? MIIAM it!
          </p>
          <p className="text-xl leading-relaxed font-medium text-[var(--color-on-surface-variant)]">
            MIIAM was born out of a simple observation: the local economy is vibrant, but the
            technology connecting people to it is often fragmented. We set out to build a unified
            platform for Appetite and Trust.
          </p>
        </div>
      </section>

      {/* Platform Section */}
      <section className="bg-white py-20 dark:bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {mission.map((item) => (
              <div key={item.title} className="space-y-6">
                <div className="text-on-primary flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)] shadow-lg shadow-red-900/20">
                  <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                </div>
                <h2 className="text-2xl font-black text-[var(--color-on-surface)]">{item.title}</h2>
                <p className="leading-relaxed text-[var(--color-on-surface-variant)]">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="mb-8 text-3xl font-black tracking-tight text-[var(--color-on-surface)] md:text-4xl">
          Ready to join the movement?
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/auth/signup"
            className="text-on-primary rounded-2xl bg-[var(--color-primary)] px-10 py-5 font-bold shadow-xl shadow-red-900/20 transition-all hover:scale-105"
          >
            Join as a Customer
          </Link>
          <Link
            href="/careers"
            className="rounded-2xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-10 py-5 font-bold text-[var(--color-on-surface)] transition-all hover:bg-[var(--color-surface-subtle)]"
          >
            Join the Fleet
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-primary)]/10 py-12 text-center">
        <div className="mx-auto max-w-4xl px-6">
          <p className="mb-4 text-2xl font-black tracking-tight text-[var(--color-accent)]">
            Need it? MIIAM it!
          </p>
          <div className="mb-4 flex justify-center gap-6">
            <a
              href="https://instagram.com/miiam.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--color-outline-variant)] transition-colors hover:text-[var(--color-accent)]"
            >
              Instagram
            </a>
            <a
              href="https://facebook.com/Miiamgauripur"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--color-outline-variant)] transition-colors hover:text-[var(--color-accent)]"
            >
              Facebook
            </a>
            <a
              href="mailto:miiamsupport@gmail.com"
              className="text-sm text-[var(--color-outline-variant)] transition-colors hover:text-[var(--color-accent)]"
            >
              Email
            </a>
          </div>
          <p className="mb-2 text-sm text-[var(--color-outline-variant)]">
            📞 +91 99578 73472 · +91 60000 24164
          </p>
          <div className="mb-4 flex justify-center gap-6">
            <Link
              href="/terms"
              className="text-sm text-[var(--color-outline-variant)] transition-colors hover:text-[var(--color-accent)]"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-[var(--color-outline-variant)] transition-colors hover:text-[var(--color-accent)]"
            >
              Privacy
            </Link>
            <Link
              href="/refunds"
              className="text-sm text-[var(--color-outline-variant)] transition-colors hover:text-[var(--color-accent)]"
            >
              Refund Policy
            </Link>
          </div>
          <p className="text-sm font-bold text-[var(--color-outline-variant)]">
            © 2026 MIIAM. Built with ❤️ in Gauripur, Dhubri.
          </p>
        </div>
      </footer>
    </div>
  );
}
