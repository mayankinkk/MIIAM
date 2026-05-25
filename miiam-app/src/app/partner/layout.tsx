"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getVendorForUser } from "@/lib/vendor";

const navLinks = [
  { href: "/partner/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/partner", label: "Live POS", icon: "point_of_sale" },
  { href: "/partner/kot", label: "KOT", icon: "receipt" },
  { href: "/partner/orders", label: "Orders", icon: "receipt_long" },
  { href: "/partner/menu", label: "Menu & Inventory", icon: "restaurant_menu" },
  { href: "/partner/analytics", label: "Analytics", icon: "analytics" },
  { href: "/partner/reviews", label: "Reviews", icon: "reviews" },
  { href: "/partner/chat", label: "Chat Support", icon: "chat" },
  { href: "/partner/wallet", label: "Wallet & Payouts", icon: "account_balance_wallet" },
  { href: "/partner/promotions", label: "Promotions", icon: "local_offer" },
  { href: "/partner/profile", label: "Store Settings", icon: "store" },
];

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [vendor, setVendor] = useState<{ shop_name: string; status: string; owner_name: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    getVendorForUser().then(setVendor);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/auth/login?redirect=/partner");
    });
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const initials = vendor?.shop_name
    ? vendor.shop_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "VD";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-20 flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100 flex items-center justify-center">
          <Link href="/partner" className="text-2xl font-extrabold tracking-tighter text-[#ba001c]">
            MIIAM <span className="text-slate-800 text-sm tracking-normal ml-1">Partner</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/partner" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive
                    ? "bg-[#ffe1e4] text-[#ba001c] font-bold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3 mb-4 border border-slate-200">
            <div className="w-10 h-10 bg-[#ba001c] rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{vendor?.shop_name || "Your Store"}</p>
              <p className="text-xs font-bold flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full animate-pulse ${vendor?.status === "active" ? "bg-green-500" : "bg-slate-400"}`}></span>
                <span className={vendor?.status === "active" ? "text-green-600" : "text-slate-400"}>
                  {vendor?.status === "active" ? "Online" : vendor?.status || "Loading..."}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium w-full"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative">
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <Link href="/partner" className="text-xl font-extrabold tracking-tighter text-[#ba001c]">
            MIIAM <span className="text-slate-800 text-xs tracking-normal ml-1">Partner</span>
          </Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-800 p-1">
            <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 relative z-20">
            <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-50 rounded-xl">
              <div className="w-8 h-8 bg-[#ba001c] rounded-full text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{vendor?.shop_name || "Your Store"}</p>
                <p className="text-xs text-green-600 font-bold">{vendor?.status === "active" ? "Online" : "Loading..."}</p>
              </div>
            </div>
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/partner" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive
                      ? "bg-[#ffe1e4] text-[#ba001c] font-bold"
                      : "text-slate-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium w-full mt-2 border-t border-slate-100 pt-4"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign Out
            </button>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
