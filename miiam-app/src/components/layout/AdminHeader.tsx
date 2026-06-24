"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  
  // Format pathname to breadcrumb (e.g., /admin/riders/earnings -> Riders / Earnings)
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .filter(s => s !== 'admin')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1));

  const currentPage = segments.length > 0 ? segments[segments.length - 1] : "Dashboard";

  const searchRoutes: Record<string, string> = {
    dashboard: "/admin",
    analytics: "/admin/analytics",
    users: "/admin/users",
    orders: "/admin/orders",
    restaurants: "/admin/restaurants",
    menu: "/admin/menu-items",
    cuisines: "/admin/foods/cuisines",
    reviews: "/admin/reviews",
    blog: "/admin/blog",
    settings: "/admin/settings",
    reports: "/admin/reports",
    riders: "/admin/riders",
    services: "/admin/services",
    applications: "/admin/applications",
    plumbing: "/admin/services/plumbing",
    electrical: "/admin/services/electrical",
    ac: "/admin/services/ac",
    cleaning: "/admin/services/cleaning",
    pest: "/admin/services/pest",
    appliance: "/admin/services/appliance",
  };

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.toLowerCase().trim();
    if (!q) return;
    for (const [key, path] of Object.entries(searchRoutes)) {
      if (key.includes(q) || path.toLowerCase().includes(q)) {
        router.push(path);
        setQuery("");
        return;
      }
    }
  }

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 bg-[var(--color-surface-container-lowest)]/80 backdrop-blur-md border-b border-[var(--color-border-subtle)] px-8 py-4 flex items-center justify-between z-10">
      <div className="flex items-center gap-2 text-[var(--color-outline-variant)] font-bold text-sm">
        <span>Pages</span>
        <span>/</span>
        <span className="text-[var(--color-on-surface)]">{currentPage}</span>
      </div>
      <div className="flex items-center gap-6">
        <form onSubmit={handleSearch} className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[var(--color-outline-variant)] text-sm">search</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Global Search..."
            className="bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/10 w-64"
          />
        </form>
        <div className="w-10 h-10 rounded-full bg-[var(--color-surface-container)] border border-[var(--color-border-subtle)] overflow-hidden relative">
           <Image 
             src={`https://ui-avatars.com/api/?name=Admin+Staff&background=ba001c&color=fff`} 
             alt="Admin" 
             fill
             className="object-cover"
           />
        </div>
      </div>
    </header>
  );
}
