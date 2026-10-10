"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/app/food", icon: "restaurant", label: "Food" },
  { href: "/services", icon: "handyman", label: "Services" },
  { href: "/app/cart", icon: "shopping_cart", label: "Cart" },
  { href: "/app/orders", icon: "receipt_long", label: "Orders" },
];

export default function LandingBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Landing navigation"
      className="fixed right-0 bottom-0 left-0 z-50 border-t border-[var(--color-border-subtle)]/10 bg-[var(--color-surface-container-lowest)]/95 shadow-[0px_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-all duration-200 active:scale-95 ${
                isActive
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-accent)]"
              }`}
            >
              {isActive && (
                <span className="absolute -top-1.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-[var(--color-primary)]" />
              )}
              <span
                className="material-symbols-outlined text-[22px]"
                style={{
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {item.icon}
              </span>
              <span
                className={`text-[10px] font-bold whitespace-nowrap ${isActive ? "opacity-100" : "opacity-60"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
