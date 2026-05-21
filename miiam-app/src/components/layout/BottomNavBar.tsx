"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/store/cartStore";

const navItems = [
  { href: "/app/home", icon: "home", label: "Home" },
  { href: "/app/food", icon: "restaurant", label: "Food" },
  { href: "/services", icon: "handyman", label: "Services" },
  { href: "/app/cart", icon: "shopping_cart", label: "Cart" },
  { href: "/app/profile", icon: "person", label: "Profile" },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.totalItems());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0px_-4px_20px_rgba(0,0,0,0.08)] md:hidden border-t border-outline-variant"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex justify-around items-center px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const isCart = item.href === "/app/cart";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-300 ${
                isActive
                  ? "text-primary"
                  : "text-outline hover:text-on-surface-variant"
              }`}
            >
              {isActive && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
              )}
              <div className={`relative transition-transform duration-300 ${isActive ? "scale-100" : "scale-90"}`}>
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>

                {isMounted && isCart && totalItems > 0 && (
                  <span key={totalItems} className="absolute -top-1.5 -right-2 w-4.5 h-4.5 bg-primary rounded-full text-on-primary text-[9px] font-black flex items-center justify-center shadow-md border-2 border-surface-container-lowest animate-badge-bounce">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </div>

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
