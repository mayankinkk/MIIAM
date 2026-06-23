"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/app/food", icon: "restaurant", label: "Food" },
  { href: "/services", icon: "handyman", label: "Services" },
  { href: "/app/cart", icon: "shopping_cart", label: "Cart" },
  { href: "/onboarding", icon: "person", label: "Sign In" },
];

export default function LandingBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Landing navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden
        bg-[var(--color-surface-container-lowest)]/95 backdrop-blur-xl
        shadow-[0px_-4px_20px_rgba(0,0,0,0.08)]
        border-t border-[var(--color-border-subtle)]/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex justify-around items-center px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]"
              }`}
            >
              {isActive && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-[var(--color-primary)] rounded-full" />
              )}
              <span
                className="material-symbols-outlined text-[22px]"
                style={{
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {item.icon}
              </span>
              <span className={`text-[10px] font-bold whitespace-nowrap ${isActive ? "opacity-100" : "opacity-60"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
