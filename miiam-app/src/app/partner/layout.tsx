"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getVendorForUser } from "@/lib/vendor";
import { PRINTING_VENDOR_ID } from "@/lib/constants";

const navLinks = [
  { href: "/partner/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/partner/pos", label: "Live POS", icon: "point_of_sale" },
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
  const [vendor, setVendor] = useState<{ shop_name: string; status: string; owner_name: string; type?: string; id?: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    getVendorForUser().then(setVendor);
  }, []);

  useEffect(() => {
    if (pathname === "/partner" || pathname === "/partner/register") return;

    if (vendor?.id === PRINTING_VENDOR_ID) {
      router.push("/denied?from=partner");
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: { user: { id: string; email?: string } } | null } }) => {
      if (!session) router.push("/auth/login?redirect=" + pathname);
    });
  }, [router, supabase, pathname, vendor]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const initials = vendor?.shop_name
    ? vendor.shop_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "VD";

  const isPublicPage = pathname === "/partner" || pathname === "/partner/register";

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--color-surface-container-lowest)] border-r border-[var(--color-border-subtle)] fixed h-full z-20 flex-col hidden md:flex">
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center justify-center">
          <Link href="/partner/dashboard" className="text-2xl font-extrabold tracking-tighter text-[var(--color-primary)]">
            MIIAM <span className="text-[var(--color-on-surface)] text-sm tracking-normal ml-1">Partner</span>
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
                    ? "bg-[var(--color-surface-container)] text-[var(--color-primary)] font-bold"
                    : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-subtle)]"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--color-border-subtle)]">
          <div className="bg-[var(--color-surface-subtle)] p-4 rounded-xl flex items-center gap-3 mb-4 border border-[var(--color-border-subtle)]">
            <div className="w-10 h-10 bg-[var(--color-primary)] rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">{vendor?.shop_name || "Your Store"}</p>
              <p className="text-xs font-bold flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full animate-pulse ${vendor?.status === "active" ? "bg-green-500" : "bg-slate-400"}`}></span>
                <span className={vendor?.status === "active" ? "text-green-600" : "text-[var(--color-outline-variant)]"}>
                  {vendor?.status === "active" ? "Online" : vendor?.status || "Loading..."}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2 text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors text-sm font-medium w-full"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative">
        <header className="md:hidden bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-border-subtle)] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <Link href="/partner/dashboard" className="text-xl font-extrabold tracking-tighter text-[var(--color-primary)]">
            MIIAM <span className="text-[var(--color-on-surface)] text-xs tracking-normal ml-1">Partner</span>
          </Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-[var(--color-on-surface)] p-1" aria-label="Toggle menu">
            <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
          </button>
        </header>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-border-subtle)] px-4 py-2 relative z-20">
            <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-[var(--color-surface-subtle)] rounded-xl">
              <div className="w-8 h-8 bg-[var(--color-primary)] rounded-full text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">{vendor?.shop_name || "Your Store"}</p>
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
                      ? "bg-[var(--color-surface-container)] text-[var(--color-primary)] font-bold"
                      : "text-[var(--color-on-surface-variant)]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors text-sm font-medium w-full mt-2 border-t border-[var(--color-border-subtle)] pt-4"
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
