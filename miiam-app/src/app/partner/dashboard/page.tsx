"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const stats = [
  { label: "Today's Orders", value: "24", icon: "receipt_long", change: "+12%", color: "text-blue-600" },
  { label: "Revenue", value: "₹8,450", icon: "paid", change: "+8%", color: "text-green-600" },
  { label: "Avg Rating", value: "4.6", icon: "star", change: "+0.2", color: "text-amber-500" },
  { label: "Items Sold", value: "86", icon: "inventory_2", change: "+15%", color: "text-purple-600" },
];

const recentOrders = [
  { id: "ORD001", items: 3, total: 345, status: "pending", time: "2 mins ago", customer: "Priya S." },
  { id: "ORD002", items: 5, total: 520, status: "preparing", time: "5 mins ago", customer: "Rahul M." },
  { id: "ORD003", items: 2, total: 180, status: "ready", time: "8 mins ago", customer: "Anita K." },
  { id: "ORD004", items: 4, total: 420, status: "pending", time: "10 mins ago", customer: "Vikram R." },
];

const menuCategories = ["All", "Starters", "Main Course", "Beverages", "Desserts"];

export default function PartnerDashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "analytics">("orders");
  const [orders, setOrders] = useState(recentOrders);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "Main Course", description: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleAccept = (orderId: string) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: "preparing" } : o));
  };

  const handleReject = (orderId: string) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    preparing: "bg-blue-100 text-blue-700",
    ready: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-24">
      {/* Header */}
      <header className="bg-[#ba001c] text-white px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">MIIAM Partner</h1>
            <p className="text-white/70 text-sm">Spice Garden • Active</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/partner/profile" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">account_circle</span>
            </Link>
          </div>
        </div>

        {/* Open/Closed Toggle */}
        <div className="flex items-center justify-between bg-white/10 rounded-2xl p-2 mt-4">
          <div className="flex items-center gap-3 px-2">
            <span className={`w-3 h-3 rounded-full ${isOpen ? "bg-green-400" : "bg-slate-400"}`}></span>
            <span className="font-bold">{isOpen ? "Open for Orders" : "Closed"}</span>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative w-14 h-8 rounded-full transition-all ${isOpen ? "bg-green-500" : "bg-slate-400"}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${isOpen ? "left-8" : "left-1"}`}></div>
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="bg-white px-4 py-5 border-b border-slate-100">
        <div className="grid grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <span className={`material-symbols-outlined text-xl ${stat.color}`}>{stat.icon}</span>
              <p className="text-lg font-extrabold text-slate-900 mt-1">{stat.value}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{stat.label}</p>
              <p className="text-[10px] text-green-600 font-bold">{stat.change}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 border-b border-slate-100">
        <div className="flex">
          {([
            { id: "orders", label: "📦 Orders", count: orders.filter(o => o.status === "pending").length },
            { id: "menu", label: "🍽️ Menu", count: 0 },
            { id: "analytics", label: "📊 Analytics", count: 0 },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-sm font-bold border-b-2 flex items-center justify-center gap-2 transition-all ${
                activeTab === tab.id ? "border-[#ba001c] text-[#ba001c]" : "border-transparent text-slate-500"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="bg-[#ba001c] text-white text-[10px] px-2 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="px-4 py-6">
        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-6xl text-slate-300">restaurant</span>
                <p className="text-slate-500 mt-4 font-bold">No orders yet</p>
                <p className="text-slate-400 text-sm">New orders will appear here</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{order.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">{order.time}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[#ba001c]">person</span>
                      <span className="font-semibold text-slate-800">{order.customer}</span>
                    </div>

                    <p className="text-sm text-slate-500 mb-3">{order.items} items</p>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <p className="font-extrabold text-xl text-slate-900">₹{order.total}</p>
                      <div className="flex gap-2">
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleReject(order.id)}
                              className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleAccept(order.id)}
                              className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700"
                            >
                              Accept
                            </button>
                          </>
                        )}
                        {order.status === "preparing" && (
                          <button className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg">
                            Mark Ready
                          </button>
                        )}
                        {order.status === "ready" && (
                          <span className="px-4 py-2 bg-green-100 text-green-700 text-sm font-bold rounded-lg">
                            Awaiting Pickup
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "menu" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Menu Items</h2>
              <button
                onClick={() => setShowAddItem(true)}
                className="px-4 py-2 bg-[#ba001c] text-white text-sm font-bold rounded-lg flex items-center gap-2"
              >
                <span className="material-symbols-outlined">add</span>
                Add Item
              </button>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {menuCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat ? "bg-[#ba001c] text-white" : "bg-white text-slate-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sample Menu Items */}
            {[
              { name: "Butter Chicken", price: 280, category: "Main Course", available: true },
              { name: "Paneer Tikka", price: 220, category: "Starters", available: true },
              { name: "Garlic Naan", price: 40, category: "Main Course", available: true },
              { name: "Masala Chai", price: 30, category: "Beverages", available: false },
              { name: "Gulab Jamun", price: 60, category: "Desserts", available: true },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                    {!item.available && (
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Unavailable
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{item.category}</p>
                  <p className="font-extrabold text-[#ba001c] mt-1">₹{item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200">
                    <span className="material-symbols-outlined text-slate-600 text-sm">edit</span>
                  </button>
                  <button className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-red-100">
                    <span className="material-symbols-outlined text-red-500 text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-[#ba001c] to-[#6b0011] text-white rounded-2xl p-6">
              <p className="text-white/70 text-sm">This Week&apos;s Revenue</p>
              <p className="text-4xl font-extrabold mt-1">₹52,340</p>
              <p className="text-white/70 text-sm mt-2">+18% from last week</p>
            </div>

            <div className="bg-white rounded-2xl p-4">
              <h3 className="font-bold text-slate-800 mb-4">Popular Items</h3>
              {[
                { name: "Butter Chicken", orders: 45, revenue: 12600 },
                { name: "Paneer Tikka", orders: 38, revenue: 8360 },
                { name: "Garlic Naan", orders: 52, revenue: 2080 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.orders} orders</p>
                  </div>
                  <p className="font-extrabold text-green-600">₹{item.revenue}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-4">
              <h3 className="font-bold text-slate-800 mb-4">Customer Ratings</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-slate-900">4.6</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map((n) => (
                      <span key={n} className={`material-symbols-outlined text-lg ${n <= 4 ? "text-amber-500" : "text-slate-300"}`}>star</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">24 reviews</p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5,4,3,2,1].map((n) => (
                    <div key={n} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-4">{n}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-amber-500 rounded-full ${n === 5 ? "w-[60%]" : "w-[30%]"}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-slate-900">Add Menu Item</h2>
              <button onClick={() => setShowAddItem(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Item Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Butter Chicken"
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Price (₹)</label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="e.g., 280"
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Category</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]"
                >
                  <option>Starters</option>
                  <option>Main Course</option>
                  <option>Beverages</option>
                  <option>Desserts</option>
                </select>
              </div>
              <button className="w-full py-4 bg-[#ba001c] text-white font-extrabold rounded-2xl mt-4">
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-around">
        {[
          { icon: "dashboard", label: "Dashboard", active: true },
          { icon: "restaurant", label: "Menu", active: false },
          { icon: "analytics", label: "Analytics", active: false },
          { icon: "person", label: "Profile", active: false },
        ].map((item) => (
          <button
            key={item.label}
            className={`flex flex-col items-center gap-1 py-2 ${item.active ? "text-[#ba001c]" : "text-slate-400"}`}
          >
            <span className="material-symbols-outlined text-xl" style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}>
              {item.icon}
            </span>
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}