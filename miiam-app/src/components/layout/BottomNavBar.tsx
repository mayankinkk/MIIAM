"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/store/cartStore";
import { useNotificationStore } from "@/lib/store/notificationStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { motion } from "framer-motion";

export default function BottomNavBar() {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => Array.isArray(s.items) ? s.items.reduce((sum, i) => sum + i.quantity, 0) : 0);
  const unreadCount = useNotificationStore((s) => s.unreadCount());
  const { t } = useTranslation();

  const hideOnRoutes = ["/app/checkout", "/app/cart", "/app/payment", "/app/vendor-failure", "/app/support/chat"];
  if (hideOnRoutes.some((r) => pathname.startsWith(r))) return null;

  const navItems = [
    { href: "/app/home", icon: "home", label: t.common.home },
    { href: "/app/food", icon: "restaurant", label: t.nav.food },
    { href: "/app/services", icon: "handyman", label: t.nav.services },
    { href: "/app/cart", icon: "shopping_cart", label: t.nav.cart },
    { href: "/app/profile", icon: "person", label: t.nav.profile },
  ];

  return (
    <nav aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface border-t-2 border-border-default"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex h-14 items-stretch">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const isCart = item.href === "/app/cart";

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={isActive ? undefined : true}
              aria-current={isActive ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-x-1.5 inset-y-1 rounded-lg bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10 transition-transform duration-200">
                <span
                  className={`material-symbols-outlined text-[22px] transition-colors duration-200 ${isActive ? "text-on-surface" : "text-on-surface-variant"}`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>

                {isCart && totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    suppressHydrationWarning
                    className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-error rounded-full text-white text-[9px] font-black flex items-center justify-center shadow-md border-2 border-surface px-1"
                  >
                    {totalItems > 9 ? "9+" : totalItems}
                  </motion.span>
                )}

                {item.href === "/app/profile" && unreadCount > 0 && (
                  <motion.span
                    key={unreadCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    suppressHydrationWarning
                    className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-error rounded-full text-white text-[9px] font-black flex items-center justify-center shadow-md border-2 border-surface px-1"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </div>

              <span className={`relative z-10 text-[10px] font-bold whitespace-nowrap transition-colors duration-200 ${isActive ? "text-on-surface" : "text-on-surface-variant"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
