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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl shadow-[0px_-4px_20px_rgba(0,0,0,0.08)] md:hidden border-t border-slate-100"
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
              className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full transition-all duration-300 ${
                isActive
                  ? "bg-[#ffecee] text-[#ba001c]"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className={`relative transition-transform duration-300 ${isActive ? "scale-100" : "scale-95"}`}>
                <span 
                  className="material-symbols-outlined text-[24px]" 
                  style={{ 
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0"
                  }}
                >
                  {item.icon}
                </span>
                
                {/* Cart badge */}
                {isMounted && isCart && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-5 h-5 bg-[#ba001c] rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-md border-2 border-white">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </div>
              
              {isActive && (
                <span className="text-[13px] font-extrabold animate-fade-in whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}