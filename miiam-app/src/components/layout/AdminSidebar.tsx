"use client";

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
      { name: "Verifications", href: "/admin/vendors/verification", icon: "verified" },
    ],
  },
  {
    title: "Home Services",
    items: [
      { name: "All Services", href: "/admin/services", icon: "handyman" },
      { name: "Beauty & Wellness", href: "/admin/services/beauty", icon: "spa" },
      { name: "AC Repair", href: "/admin/services/ac", icon: "ac_unit" },
      { name: "Plumbing", href: "/admin/services/plumbing", icon: "plumbing" },
      { name: "Electrical", href: "/admin/services/electrical", icon: "electrical_services" },
      { name: "Cleaning", href: "/admin/services/cleaning", icon: "cleaning_services" },
      { name: "Appliance", href: "/admin/services/appliance", icon: "kitchen" },
      { name: "Pest Control", href: "/admin/services/pest", icon: "bug_report" },
    ],
  },
  {
    title: "Pharmacy",
    items: [
      { name: "Pharmacy Orders", href: "/admin/pharmacy", icon: "medication" },
      { name: "Prescriptions", href: "/admin/pharmacy?tab=prescriptions", icon: "prescriptions" },
      { name: "Partners", href: "/admin/pharmacy?tab=partners", icon: "local_pharmacy" },
    ],
  },
  {
    title: "Grocery",
    items: [
      { name: "Grocery Orders", href: "/admin/grocery", icon: "shopping_cart" },
      { name: "Partners", href: "/admin/grocery?tab=partners", icon: "storefront" },
      { name: "Inventory", href: "/admin/grocery?tab=inventory", icon: "inventory_2" },
    ],
  },
  {
    title: "Flowers & Gifts",
    items: [
      { name: "Flower Orders", href: "/admin/flowers", icon: "local_florist" },
      { name: "Custom Arrangements", href: "/admin/flowers?tab=arrangements", icon: "eco" },
      { name: "Partners", href: "/admin/flowers?tab=partners", icon: "storefront" },
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
    ],
  },
  {
    title: "Content",
    items: [
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
      { name: "Settings", href: "/admin/settings", icon: "settings" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Combine pathname and search params for exact matching
  const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  return (
    <aside className="w-64 bg-white border-r border-[#ba001c]/10 fixed h-full z-20 flex flex-col hidden md:flex shadow-2xl shadow-red-900/5 overflow-y-auto custom-scrollbar">
      <div className="p-6 border-b border-slate-50 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#ba001c] rounded-lg flex items-center justify-center text-white font-black">M</div>
        <Link href="/admin" className="text-xl font-black tracking-tighter text-[#ba001c]">
          MIIAM <span className="text-slate-400 text-xs tracking-normal">Staff</span>
        </Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] px-4 py-3 mt-4 first:mt-0">
              {group.title}
            </p>
            {group.items.map((item) => {
              const isActive = fullPath === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 group ${
                    isActive
                      ? "bg-[#ba001c] text-white shadow-lg shadow-red-900/20"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isActive ? "" : "group-hover:text-[#ba001c]"
                    }`}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-50">
        <SignOutButton />
      </div>
    </aside>
  );
}
