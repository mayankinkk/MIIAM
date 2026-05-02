"use client";

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl shadow-[0px_-4px_20px_rgba(0,0,0,0.08)] md:hidden border-t border-slate-100">
      <div className="flex justify-around items-center px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const isCart = item.href === "/app/cart";
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 relative min-w-[60px] ${
                isActive
                  ? "text-[#ba001c]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className={`relative transition-transform ${isActive ? "scale-110" : ""}`}>
                <span 
                  className="material-symbols-outlined text-[24px]" 
                  style={{ 
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0"
                  }}
                >
                  {item.icon}
                </span>
                
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#ba001c] rounded-full" />
                )}
                
                {/* Cart badge */}
                {isCart && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ba001c] rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow-md">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </div>
              
              <span className={`text-[11px] font-semibold mt-1 ${isActive ? "text-[#ba001c]" : "text-slate-500"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}