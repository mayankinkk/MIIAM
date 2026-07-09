"use client";

import Link from "next/link";

export default function AboutUsPage() {
  const mission = [
    {
      title: "The Platform",
      content: "MIIAM is an all-in-one app for food delivery and home services. Order from local restaurants, book plumbers, electricians, cleaners - everything you need, in one place.",
      icon: "hub"
    },
    {
      title: "Our Vision",
      content: "To build Assam's most trusted and vibrant hyper-local ecosystem where every craving is satisfied and every home task is handled with professional care.",
      icon: "visibility"
    },
    {
      title: "Community First",
      content: "We believe in empowering local merchants and service providers by giving them the technology to compete in a digital-first economy.",
      icon: "favorite"
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] font-sans selection:bg-[var(--color-primary)]/10">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[var(--color-surface-container-lowest)]/80 backdrop-blur-xl border-b border-[var(--color-primary)]/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black text-[var(--color-primary)] tracking-tighter">
            MIIAM
          </Link>
          <Link href="/" className="text-sm font-bold text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors">
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full text-xs font-black uppercase tracking-widest mb-6">
            Our Story
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-[var(--color-on-surface)] tracking-tighter leading-none mb-4">
            Reimagining the <br />
            <span className="text-[var(--color-primary)]">Hyper-Local Economy.</span>
          </h1>
          <p className="text-2xl md:text-3xl font-black text-[var(--color-primary)] mb-6 tracking-tight">
            Need it? MIIAM it!
          </p>
          <p className="text-xl text-[var(--color-on-surface-variant)] leading-relaxed font-medium">
            MIIAM was born out of a simple observation: the local economy is vibrant, but the technology connecting people to it is often fragmented. We set out to build a unified platform for Appetite and Trust.
          </p>
        </div>
      </section>

      {/* Platform Section */}
      <section className="py-20 bg-white dark:bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {mission.map((item) => (
              <div key={item.title} className="space-y-6">
                <div className="w-14 h-14 bg-[var(--color-primary)] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20">
                  <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                </div>
                <h2 className="text-2xl font-black text-[var(--color-on-surface)]">{item.title}</h2>
                <p className="text-[var(--color-on-surface-variant)] leading-relaxed">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-6">
        <h2 className="text-3xl md:text-4xl font-black text-[var(--color-on-surface)] mb-8 tracking-tight">Ready to join the movement?</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/auth/signup" className="px-10 py-5 bg-[var(--color-primary)] text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-xl shadow-red-900/20">
            Join as a Customer
          </Link>
          <Link href="/careers" className="px-10 py-5 bg-[var(--color-surface-container-lowest)] border-2 border-[var(--color-border-subtle)] text-[var(--color-on-surface)] font-bold rounded-2xl hover:bg-[var(--color-surface-subtle)] transition-all">
            Join the Fleet
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[var(--color-primary)]/10 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-2xl font-black text-[var(--color-primary)] mb-4 tracking-tight">Need it? MIIAM it!</p>
          <div className="flex justify-center gap-6 mb-4">
            <a href="https://instagram.com/miiam.in" target="_blank" rel="noopener noreferrer" className="text-[var(--color-outline-variant)] text-sm hover:text-[var(--color-primary)] transition-colors">Instagram</a>
            <a href="https://facebook.com/Miiamgauripur" target="_blank" rel="noopener noreferrer" className="text-[var(--color-outline-variant)] text-sm hover:text-[var(--color-primary)] transition-colors">Facebook</a>
            <a href="mailto:miiamsupport@gmail.com" className="text-[var(--color-outline-variant)] text-sm hover:text-[var(--color-primary)] transition-colors">Email</a>
          </div>
          <p className="text-[var(--color-outline-variant)] text-sm mb-2">📞 +91 99578 73472 · +91 60000 24164</p>
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/terms" className="text-[var(--color-outline-variant)] text-sm hover:text-[var(--color-primary)] transition-colors">Terms</Link>
            <Link href="/privacy" className="text-[var(--color-outline-variant)] text-sm hover:text-[var(--color-primary)] transition-colors">Privacy</Link>
            <Link href="/refunds" className="text-[var(--color-outline-variant)] text-sm hover:text-[var(--color-primary)] transition-colors">Refund Policy</Link>
          </div>
          <p className="text-[var(--color-outline-variant)] font-bold text-sm">© 2026 MIIAM. Built with ❤️ in Guwahati.</p>
        </div>
      </footer>
    </div>
  );
}
