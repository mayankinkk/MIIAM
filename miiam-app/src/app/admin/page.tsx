"use client";

import { useRouter } from "next/navigation";

const dashboards = [
  {
    id: "foods",
    title: "Foods",
    description: "View restaurant orders, partner analytics, and food delivery metrics",
    icon: "restaurant",
    color: "bg-[#ba001c]/10 text-[#ba001c]",
    hoverColor: "group-hover:bg-[#ba001c] group-hover:text-white",
    route: "/admin/foods"
  },
  {
    id: "grocery",
    title: "Grocery",
    description: "Manage grocery orders, delivery tracking, and inventory",
    icon: "shopping_basket",
    color: "bg-green-50 text-green-600",
    hoverColor: "group-hover:bg-green-600 group-hover:text-white",
    route: "/admin/grocery"
  },
  {
    id: "pharmacy",
    title: "Pharmacy",
    description: "Manage medicine orders, prescriptions, and pharmacy partners",
    icon: "medication",
    color: "bg-purple-50 text-purple-600",
    hoverColor: "group-hover:bg-purple-600 group-hover:text-white",
    route: "/admin/pharmacy"
  },
  {
    id: "flowers",
    title: "Flowers & Gifts",
    description: "Manage flower deliveries, custom arrangements, and gift orders",
    icon: "local_florist",
    color: "bg-rose-50 text-rose-600",
    hoverColor: "group-hover:bg-rose-600 group-hover:text-white",
    route: "/admin/flowers"
  },
  {
    id: "services",
    title: "Services",
    description: "View service bookings, provider analytics, and service metrics",
    icon: "home_repair_service",
    color: "bg-blue-50 text-blue-600",
    hoverColor: "group-hover:bg-blue-600 group-hover:text-white",
    route: "/admin/services"
  },
];

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <div className="px-8 py-12">
      <h1 className="text-3xl font-black text-slate-800 mb-8">Select Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
        {dashboards.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.route)}
            className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm hover:border-[#ba001c] hover:shadow-lg transition-all text-left group"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${item.color} ${item.hoverColor} transition-all`}>
              <span className="material-symbols-outlined text-3xl">{item.icon}</span>
            </div>
            <h2 className="text-lg font-black text-slate-800 mb-2">{item.title}</h2>
            <p className="text-slate-400 text-sm">{item.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}