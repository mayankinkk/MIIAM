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
      { name: "Reviews", href: "/admin/reviews", icon: "star" },
      { name: "Verifications", href: "/admin/vendors/verification", icon: "verified" },
      { name: "Store Items", href: "/admin/store", icon: "storefront" },
    ],
  },
  {
    title: "Home Services",
    items: [
      { name: "All Services", href: "/admin/services", icon: "handyman" },
      { name: "AC Repair", href: "/admin/services/ac", icon: "ac_unit" },
      { name: "Plumbing", href: "/admin/services/plumbing", icon: "plumbing" },
      { name: "Electrical", href: "/admin/services/electrical", icon: "electrical_services" },
      { name: "Cleaning", href: "/admin/services/cleaning", icon: "cleaning_services" },
      { name: "Appliance", href: "/admin/services/appliance", icon: "kitchen" },
      { name: "Pest Control", href: "/admin/services/pest", icon: "bug_report" },
    ],
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
    <aside className={`${collapsed ? "w-[72px]" : "w-64"} bg-surface-container-lowest border-r border-outline/10 fixed h-full z-20 flex flex-col hidden md:flex shadow-2xl shadow-red-900/5 overflow-y-auto custom-scrollbar transition-all duration-300`}>
      {/* Header */}
      <div className={`${collapsed ? "px-3 py-4" : "px-6 py-6"} border-b border-outline/5 flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black shrink-0">M</div>
        {!collapsed && (
          <Link href="/admin" className="text-xl font-black tracking-tighter text-primary">
            MIIAM <span className="text-outline-variant text-xs tracking-normal">Staff</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`${collapsed ? "mt-3" : "ml-auto"} p-1 rounded-lg hover:bg-surface-container-high transition-colors`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="material-symbols-outlined text-sm text-on-surface-variant">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {menuGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="text-[10px] font-black text-outline-variant uppercase tracking-[2px] px-4 py-3 mt-4 first:mt-0">
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
                  className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-4"} py-3 rounded-xl font-bold transition-all duration-200 group ${
                    isActive
                      ? "bg-primary text-on-primary shadow-lg shadow-red-900/20"
                      : "text-on-surface-variant hover:bg-surface-subtle"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] shrink-0 ${isActive ? "" : "group-hover:text-primary"}`}
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
      <div className={`${collapsed ? "p-2" : "p-4"} border-t border-outline/5`}>
        <SignOutButton collapsed={collapsed} />
      </div>
    </aside>
  );
}
