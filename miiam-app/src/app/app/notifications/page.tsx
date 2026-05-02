"use client";

import { useState } from "react";
import Link from "next/link";

const orderUpdates = [
  {
    id: "1",
    vendor: "Gourmet Burger Kitchen",
    status: "Out for Delivery",
    statusType: "active",
    message: "Your rider is 500m away with your Lunch Special. Prepare for deliciousness!",
    time: "2 mins ago",
    orderId: "MIA-8829",
  },
  {
    id: "2",
    vendor: "Fresh Harvest Grocery",
    status: "Delivered",
    statusType: "delivered",
    message: "Order #MIA-8829 was delivered to your front door. How was everything?",
    time: "1 hour ago",
    orderId: "MIA-8829",
  },
];

const messages = [
  {
    id: "1",
    sender: "Support Concierge",
    avatar: null,
    message: "Hi there! I've successfully updated your delivery preferences for tonight's...",
    time: "10:45 AM",
    online: true,
  },
  {
    id: "2",
    sender: "SuperApp Admin",
    avatar: "SA",
    message: "Welcome to the new MIIAM experience! Discover your personalized dashboard...",
    time: "Yesterday",
    online: false,
  },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "orders" | "offers" | "messages">("all");
  const [unreadCount] = useState(3);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#fff4f4]/80 backdrop-blur-2xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
        <div className="flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/app/explore" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ffe1e4] transition-all">
              <span className="material-symbols-outlined text-[#ba001c]">arrow_back</span>
            </Link>
            <span className="text-2xl font-extrabold tracking-tighter text-[#ba001c]">MIIAM</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/app/favorites" className="hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-[#ba001c]">favorite</span>
            </Link>
            <Link href="/app/notifications" className="relative hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-[#ba001c] font-bold">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#ba001c] rounded-full"></span>
            </Link>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#ff7670]">
              <img alt="Profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpzlsppZO6sfKl2jn0jVnVUt04V-OLD7uUODX8I1dC7qtq-ijzGypfq3_4hRDeTNbNlO-zC70lFdKEs1MaOPEgHQ5QttEc-rudNeDGZr7ShuBIhpXuknKBd_-C7dtBQFWIHuLaI6BsZlCiGZazPBKNX7BoHB7ZhWxIN61QGML3fs9rToOFBmYliT3QcQBVdq9vSmnRQt7S-eFtys0hKGr_p1aN_wn1MV8ye2IcX-neQfzG7wPnrn5PcD1xVdbheRimRuJlI9w-MBE" />
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-8">
        <section>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-[#4d212a]">Inbox</h1>
          <p className="text-[#814c55] font-medium">You have {unreadCount} unread updates waiting for your attention.</p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#ff7670] p-2 rounded-full">
              <span className="material-symbols-outlined text-[#4e0006]">package_2</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Order Updates</h2>
          </div>
          <div className="space-y-6">
            {orderUpdates.map((order) => (
              <div
                key={order.id}
                className={`rounded-xl p-6 shadow-[0px_20px_40px_rgba(77,33,42,0.06)] flex flex-col justify-between ${
                  order.statusType === "active" ? "bg-white" : "bg-[#ffecee]"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      order.statusType === "active"
                        ? "bg-[#c4d0ff] text-[#002c83]"
                        : "text-[#ba001c] font-bold"
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-[#814c55] font-medium">{order.time}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{order.vendor}</h3>
                  <p className="text-[#814c55] text-sm mb-6 leading-relaxed">{order.message}</p>
                </div>
                <Link
                  href={`/app/orders/${order.orderId}`}
                  className={`rounded-xl py-3 px-6 font-bold flex items-center justify-center gap-2 ${
                    order.statusType === "active"
                      ? "bg-[#0b50d5] text-white hover:opacity-90 transition-all"
                      : "bg-white text-[#4d212a] hover:bg-[#ff7670] hover:text-white transition-all"
                  }`}
                >
                  {order.statusType === "active" ? "Track Order" : "Rate Experience"}{" "}
                  <span className="material-symbols-outlined text-sm">{order.statusType === "active" ? "map" : "star"}</span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#ffd709] p-2 rounded-full">
              <span className="material-symbols-outlined text-[#5b4b00]">local_offer</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Exclusive Offers</h2>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-[#ba001c] h-64 flex items-center shadow-xl">
            <div className="absolute inset-0 opacity-40">
              <img
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDudRvKpZpg1uQaglRtPzimvqDxCjZWsggM20R_7MTRiWCwketR4JRdSTA4u2EcOqYNPyVPqfly2xY9TB9TnoeBGg6qIgrz9AKUMvfAZKNf5c0_awsXLovk_LpIkO111fdE4c3-sV7gCsRRf9WhbtKThNuLrLme7vjlU2v7SxFs4zUxNGur8phdquSjZvR8iYOSIMNz6BIT0qNDY1bk1zTfp9KoyF1jolwC1k7VnePl8_wS7laXYwKmnDNhpkBC-dLnwDi1wxH1dEE"
                alt="Mediterranean dishes"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#ba001c] via-[#ba001c]/80 to-transparent"></div>
            <div className="relative z-10 p-8 max-w-md">
              <span className="bg-[#ffd709] text-[#453900] px-4 py-1 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-4 inline-block">
                Flash Deal
              </span>
              <h3 className="text-3xl font-extrabold text-white mb-2 leading-tight">50% OFF your next Healthy Bowl</h3>
              <p className="text-white/80 text-sm mb-6">Valid for the next 4 hours only on selected organic partners.</p>
              <button className="bg-white text-[#ba001c] rounded-xl py-3 px-8 font-extrabold hover:scale-105 transition-transform">
                Claim Offer
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-[#c4d0ff] p-2 rounded-full">
              <span className="material-symbols-outlined text-[#002c83]">chat_bubble</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
          </div>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-white rounded-xl p-5 flex items-center gap-5 hover:bg-[#ffe1e4] transition-colors cursor-pointer shadow-sm"
              >
                <div className="relative">
                  {msg.avatar ? (
                    <div className="w-14 h-14 rounded-full bg-[#c4d0ff] flex items-center justify-center text-[#002c83] font-bold text-xl">
                      {msg.avatar}
                    </div>
                  ) : (
                    <img className="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUa2GV5iOjnyb9zL3MxB6MqtcFuHCs_r6Na028l-wegQzx9Ffz6Sv7PAPY5vRBI_HfHfEH6tIwWVxYc8BN-RUPOC2ykXOGVrwSLnXA7FK0ls3dO21KgCLmjXjILsN_kAhciThpYj9O3vaLrhVXkQ9QeQZcx3BAS-8kDPDg3-Ab_-FQK3nIw9fBIKwrpTS7BdPQjlxneNFceYKbgTEimx-SO3Zm2fHU7VSCbIoH3gHIdrRZQ0kJYXzGMiWAAH-sKAlbLwoyBPzhZe0" />
                  )}
                  {msg.online && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-lg">{msg.sender}</h4>
                    <span className="text-xs text-[#814c55]">{msg.time}</span>
                  </div>
                  <p className="text-[#814c55] text-sm line-clamp-1">"{msg.message}"</p>
                </div>
                <span className="material-symbols-outlined text-[#814c55]">chevron_right</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}