"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const sampleOrders = [
  {
    id: "ORD001",
    vendor: "The Burger Alchemist",
    vendorAddress: "123 Food Street, Guwahati",
    customer: "Priya S.",
    customerAddress: "456 Main Road, Bamunimaidan",
    distance: 2.5,
    earnings: 45,
    items: 3,
    time: "12 mins away",
    priority: "high",
  },
  {
    id: "ORD002",
    vendor: "Spice Garden",
    vendorAddress: "789 Culinary Ave, Guwahati",
    customer: "Rahul M.",
    customerAddress: "321 Residential Lane, Dispur",
    distance: 3.8,
    earnings: 55,
    items: 5,
    time: "18 mins away",
    priority: "normal",
  },
];

const stats = [
  { label: "Today's Earnings", value: "₹340", icon: "paid", color: "text-green-600" },
  { label: "Deliveries", value: "12", icon: "inventory_2", color: "text-blue-600" },
  { label: "This Week", value: "₹2,450", icon: "calendar_today", color: "text-purple-600" },
  { label: "Rating", value: "4.8", icon: "star", color: "text-amber-500" },
];

export default function RiderDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "history" | "earnings">("orders");
  const [pendingOrders, setPendingOrders] = useState(sampleOrders);
  const [selectedOrder, setSelectedOrder] = useState<typeof sampleOrders[0] | null>(null);
  const [currentOrder, setCurrentOrder] = useState<typeof sampleOrders[0] | null>(null);

  const handleAccept = (order: typeof sampleOrders[0]) => {
    setPendingOrders(pendingOrders.filter(o => o.id !== order.id));
    setCurrentOrder(order);
    setSelectedOrder(null);
  };

  const handleDecline = (orderId: string) => {
    setPendingOrders(pendingOrders.filter(o => o.id !== orderId));
  };

  const handleComplete = () => {
    if (currentOrder) {
      setCurrentOrder(null);
      alert("Order marked as delivered! ₹" + currentOrder.earnings + " added to your wallet.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-24">
      {/* Header */}
      <header className="bg-[#ba001c] text-white px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-extrabold">MIIAM Rider</h1>
            <p className="text-white/70 text-sm">Welcome back, Rajesh</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/rider/profile" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">account_circle</span>
            </Link>
          </div>
        </div>

        {/* Online/Offline Toggle */}
        <div className="flex items-center justify-between bg-white/10 rounded-2xl p-2">
          <div className="flex items-center gap-3 px-2">
            <span className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-400 animate-pulse" : "bg-slate-400"}`}></span>
            <span className="font-bold">{isOnline ? "Online" : "Offline"}</span>
          </div>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`relative w-14 h-8 rounded-full transition-all ${
              isOnline ? "bg-green-500" : "bg-slate-400"
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
              isOnline ? "left-8" : "left-1"
            }`}></div>
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="bg-white px-4 py-6 border-b border-slate-100">
        <div className="grid grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <span className={`material-symbols-outlined text-xl ${stat.color}`}>{stat.icon}</span>
              <p className="text-lg font-extrabold text-slate-900 mt-1">{stat.value}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Current Order */}
      {currentOrder && (
        <div className="bg-gradient-to-r from-[#ba001c] to-[#6b0011] text-white px-4 py-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined">delivery_dining</span>
            <span className="font-bold text-sm">CURRENT DELIVERY</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-extrabold text-lg">{currentOrder.vendor}</p>
                <p className="text-white/70 text-sm">{currentOrder.id} • {currentOrder.items} items</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-xl">₹{currentOrder.earnings}</p>
                <p className="text-white/70 text-xs">Earnings</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white/70">store</span>
                <span>{currentOrder.vendorAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white/70">home</span>
                <span>{currentOrder.customerAddress}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="flex-1 bg-white/20 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">call</span>
                Call Customer
              </button>
              <button className="flex-1 bg-white text-[#ba001c] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">navigation</span>
                Navigate
              </button>
            </div>
            <button
              onClick={handleComplete}
              className="w-full mt-3 bg-green-500 py-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check_circle</span>
              Mark as Delivered
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!currentOrder && (
        <div className="bg-white px-4 border-b border-slate-100">
          <div className="flex">
            {([
              { id: "orders", label: "📦 Orders", count: pendingOrders.length },
              { id: "history", label: "📋 History", count: 0 },
              { id: "earnings", label: "💰 Earnings", count: 0 },
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
      )}

      {/* Content */}
      <main className="px-4 py-6">
        {activeTab === "orders" && !currentOrder && (
          <div>
            {pendingOrders.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-6xl text-slate-300">local_shipping</span>
                <p className="text-slate-500 mt-4 font-bold">No orders available</p>
                <p className="text-slate-400 text-sm">New orders will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-slate-800">Available Orders</h2>
                  <span className="text-xs text-slate-500">{pendingOrders.length} orders nearby</span>
                </div>
                {pendingOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#ba001c]/10 text-[#ba001c] text-xs font-bold px-2 py-1 rounded-full">
                            {order.id}
                          </span>
                          {order.priority === "high" && (
                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                              ⚡ Rush
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-xl text-[#ba001c]">₹{order.earnings}</p>
                          <p className="text-[10px] text-slate-500">Earnings</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="material-symbols-outlined text-[#ba001c]">store</span>
                          <span className="font-semibold">{order.vendor}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          <span>{order.vendorAddress}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <span className="material-symbols-outlined text-sm">home</span>
                          <span>Deliver to: {order.customer}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg">
                          <span className="material-symbols-outlined text-slate-600">route</span>
                          <span className="font-semibold text-slate-700">{order.distance} km</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg">
                          <span className="material-symbols-outlined text-slate-600">schedule</span>
                          <span className="font-semibold text-slate-700">{order.time}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg">
                          <span className="material-symbols-outlined text-slate-600">inventory_2</span>
                          <span className="font-semibold text-slate-700">{order.items} items</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 flex">
                      <button
                        onClick={() => handleDecline(order.id)}
                        className="flex-1 py-4 text-slate-500 font-bold text-sm border-r border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAccept(order)}
                        className="flex-1 py-4 bg-[#ba001c] text-white font-bold text-sm hover:bg-[#a40017] transition-colors"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-6xl text-slate-300">history</span>
            <p className="text-slate-500 mt-4 font-bold">Delivery history</p>
            <p className="text-slate-400 text-sm">Your completed deliveries will appear here</p>
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6">
              <p className="text-white/70 text-sm">Available Balance</p>
              <p className="text-4xl font-extrabold mt-1">₹340</p>
              <button className="mt-4 bg-white/20 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/30 transition-colors">
                Withdraw to Bank
              </button>
            </div>

            <div className="bg-white rounded-2xl p-4">
              <h3 className="font-bold text-slate-800 mb-4">This Week</h3>
              <div className="space-y-3">
                {[
                  { day: "Today", amount: 340, orders: 12 },
                  { day: "Yesterday", amount: 420, orders: 15 },
                  { day: "Monday", amount: 280, orders: 10 },
                  { day: "Sunday", amount: 550, orders: 18 },
                  { day: "Saturday", amount: 480, orders: 16 },
                ].map((day) => (
                  <div key={day.day} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="font-semibold text-slate-800">{day.day}</p>
                      <p className="text-xs text-slate-500">{day.orders} deliveries</p>
                    </div>
                    <p className="font-extrabold text-green-600">+₹{day.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-around">
        {[
          { icon: "home", label: "Home", active: true },
          { icon: "local_shipping", label: "Orders", active: false },
          { icon: "wallet", label: "Wallet", active: false },
          { icon: "person", label: "Profile", active: false },
        ].map((item) => (
          <button
            key={item.label}
            className={`flex flex-col items-center gap-1 py-2 ${
              item.active ? "text-[#ba001c]" : "text-slate-400"
            }`}
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