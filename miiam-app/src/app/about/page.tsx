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
    <div className="min-h-screen bg-[#fff4f4] font-sans selection:bg-[#ba001c]/10">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-[#ba001c]/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black text-[#ba001c] tracking-tighter">
            MIIAM
          </Link>
          <Link href="/" className="text-sm font-bold text-slate-500 hover:text-[#ba001c] transition-colors">
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-[#ba001c]/10 text-[#ba001c] rounded-full text-xs font-black uppercase tracking-widest mb-6">
            Our Story
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-8">
            Reimagining the <br />
            <span className="text-[#ba001c]">Hyper-Local Economy.</span>
          </h1>
          <p className="text-xl text-[#814c55] leading-relaxed font-medium">
            MIIAM was born out of a simple observation: the local economy is vibrant, but the technology connecting people to it is often fragmented. We set out to build a unified platform for Appetite and Trust.
          </p>
        </div>
      </section>

      {/* Platform Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {mission.map((item) => (
              <div key={item.title} className="space-y-6">
                <div className="w-14 h-14 bg-[#ba001c] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20">
                  <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900">{item.title}</h2>
                <p className="text-[#814c55] leading-relaxed">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-6">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 tracking-tight">Ready to join the movement?</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/auth/signup" className="px-10 py-5 bg-[#ba001c] text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-xl shadow-red-900/20">
            Join as a Customer
          </Link>
          <Link href="/careers" className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all">
            Join the Fleet
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#ba001c]/10 text-center">
        <p className="text-slate-400 font-bold text-sm">© 2026 MIIAM. Built with ❤️ in Guwahati.</p>
      </footer>
    </div>
  );
}
