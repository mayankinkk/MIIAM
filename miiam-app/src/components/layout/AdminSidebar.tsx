"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import SignOutButton from "@/components/AdminSignOut";

const menuGroups = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: "dashboard" },
      { name: "Analytics", href: "/admin/analytics", icon: "analytics" },
      { name: "Insights", href: "/admin/analytics/insights", icon: "insights" },
      { name: "Customer Insights", href: "/admin/insights", icon: "group_work" },
      { name: "Users", href: "/admin/users", icon: "group" },
      { name: "Orders", href: "/admin/orders", icon: "receipt_long" },
      { name: "Applications", href: "/admin/applications", icon: "work" },
    ],
  },
  {
    title: "Food Delivery",
    items: [
      { name: "All Restaurants", href: "/admin/vendors", icon: "storefront" },
      { name: "Food Orders", href: "/admin/foods", icon: "restaurant" },
      { name: "Menu Items", href: "/admin/foods/menu-items", icon: "menu_book" },
      { name: "Cuisines", href: "/admin/foods/cuisines", icon: "lunch_dining" },
      { name: "Combos", href: "/admin/combos", icon: "merge" },
      { name: "Reviews", href: "/admin/reviews", icon: "star" },
      { name: "Verifications", href: "/admin/vendors/verification", icon: "verified" },
      { name: "Store Items", href: "/admin/store", icon: "storefront" },
    ],
  },
  {
    title: "Services",
    items: [{ name: "All Services", href: "/admin/services", icon: "handyman" }],
  },
  {
    title: "Fleet",
    items: [
      { name: "Manage Riders", href: "/admin/riders", icon: "two_wheeler" },
      { name: "Add Rider", href: "/admin/riders?add=true", icon: "person_add" },
      { name: "Earnings", href: "/admin/riders/earnings", icon: "account_balance_wallet" },
    ],
  },
  {
    title: "Growth",
    items: [
      { name: "Coupons", href: "/admin/coupons", icon: "confirmation_number" },
      { name: "Promotions", href: "/admin/promotions", icon: "local_offer" },
      { name: "Sponsored Listings", href: "/admin/sponsored-listings", icon: "campaign" },
    ],
  },
  {
    title: "Content",
    items: [
      { name: "Content Manager", href: "/admin/page-assets", icon: "photo_library" },
      { name: "Banners", href: "/admin/banners", icon: "image" },
      { name: "Home Categories", href: "/admin/home-categories", icon: "category" },
      { name: "Menu Categories", href: "/admin/categories", icon: "list" },
      { name: "Blog & Tips", href: "/admin/blog", icon: "article" },
    ],
  },
  {
    title: "Platform",
    items: [
      { name: "Live Chat", href: "/admin/support", icon: "support_agent" },
      { name: "Notifications", href: "/admin/notifications", icon: "notifications" },
      { name: "Reports", href: "/admin/reports", icon: "description" },
      { name: "Audit Logs", href: "/admin/audit", icon: "fact_check" },
      { name: "Service Toggles", href: "/admin/services-settings", icon: "toggle_on" },
      { name: "Feature Flags", href: "/admin/feature-flags", icon: "flag" },
      { name: "Settings", href: "/admin/settings", icon: "settings" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);

  const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  return (
    <aside
      className={`${collapsed ? "w-[72px]" : "w-64"} bg-surface-container-lowest border-outline/10 custom-scrollbar fixed z-20 flex hidden h-full flex-col overflow-y-auto border-r shadow-2xl shadow-red-900/5 transition-all duration-300 md:flex`}
    >
      {/* Header */}
      <div
        className={`${collapsed ? "px-3 py-4" : "px-6 py-6"} border-outline/5 flex items-center border-b ${collapsed ? "justify-center" : "gap-3"}`}
      >
        <div className="bg-primary text-on-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-black">
          M
        </div>
        {!collapsed && (
          <Link href="/admin" className="text-primary text-xl font-black tracking-tighter">
            MIIAM <span className="text-outline-variant text-xs tracking-normal">Staff</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`${collapsed ? "mt-3" : "ml-auto"} hover:bg-surface-container-high rounded-lg p-1 transition-colors`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="material-symbols-outlined text-on-surface-variant text-sm">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {menuGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="text-outline-variant mt-4 px-4 py-3 text-[10px] font-black tracking-[2px] uppercase first:mt-0">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const isActive = fullPath === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-4"} group rounded-xl py-3 font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-on-primary shadow-lg shadow-red-900/20"
                      : "text-on-surface-variant hover:bg-surface-subtle"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined shrink-0 text-[20px] ${isActive ? "" : "group-hover:text-primary"}`}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={`${collapsed ? "p-2" : "p-4"} border-outline/5 border-t`}>
        <SignOutButton collapsed={collapsed} />
      </div>
    </aside>
  );
}
