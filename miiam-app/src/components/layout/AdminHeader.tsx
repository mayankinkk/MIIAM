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
    .split("/")
    .filter(Boolean)
    .filter((s) => s !== "admin")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));

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
    <header className="fixed top-0 right-0 left-0 z-10 flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)]/80 px-8 py-4 backdrop-blur-md md:left-64">
      <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-outline-variant)]">
        <span>Pages</span>
        <span>/</span>
        <span className="text-[var(--color-on-surface)]">{currentPage}</span>
      </div>
      <div className="flex items-center gap-6">
        <form onSubmit={handleSearch} className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute top-2.5 left-3 text-sm text-[var(--color-outline-variant)]">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Global Search..."
            className="w-64 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] py-2 pr-4 pl-10 text-sm focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
          />
        </form>
        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-container)]">
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
