"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const sampleOrders = [
  {
    id: "ORD001",
    vendor: "Burger Prime",
    vendorAddress: "The Highstreet Mall, Ground Floor, Zone A",
    customer: "Priya S.",
    customerAddress: "Apartment 402, Block B, Silver Oaks Society",
    distance: 1.2,
    distance2: 3.0,
    totalDistance: 4.2,
    earnings: 120,
    items: 3,
    time: "4 mins",
    time2: "12 mins",
    estCompletion: 22,
    priority: "high",
  },
];

const stats = [
  { label: "Today's Earnings", value: "₹340", icon: "paid", color: "text-green-600" },
  { label: "Deliveries", value: "12", icon: "inventory_2", color: "text-blue-600" },
  { label: "This Week", value: "₹2,450", icon: "calendar_today", color: "text-purple-600" },
  { label: "Rating", value: "4.8", icon: "star", color: "text-amber-500" },
];

const navItems = [
  { icon: "home", label: "Home", active: true, href: "/rider/dashboard" },
  { icon: "local_shipping", label: "Orders", active: false, href: "/rider/orders" },
  { icon: "explore", label: "Navigate", active: false, href: "/rider/dashboard" },
  { icon: "payments", label: "Wallet", active: false, href: "/rider/wallet" },
  { icon: "person", label: "Account", active: false, href: "/rider/account" },
];

export default function RiderDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [countdown, setCountdown] = useState(52);
  const [pendingOrders, setPendingOrders] = useState(sampleOrders);
  const [selectedOrder, setSelectedOrder] = useState<typeof sampleOrders[0] | null>(null);
  const [currentOrder, setCurrentOrder] = useState<typeof sampleOrders[0] | null>(null);

  useEffect(() => {
    if (selectedOrder && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, selectedOrder]);

  const handleAccept = (order: typeof sampleOrders[0]) => {
    setPendingOrders(pendingOrders.filter(o => o.id !== order.id));
    setCurrentOrder(order);
    setSelectedOrder(null);
  };

  const handleDecline = (orderId: string) => {
    setPendingOrders(pendingOrders.filter(o => o.id !== orderId));
    setSelectedOrder(null);
    setCountdown(52);
  };

  const handleComplete = () => {
    if (currentOrder) {
      setCurrentOrder(null);
      alert("Order marked as delivered! ₹" + currentOrder.earnings + " added to your wallet.");
    }
  };

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-[0_20px_40px_rgba(77,33,42,0.06)]">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black italic tracking-tighter text-primary font-display-hero">MIIAM RIDER</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center bg-surface-container-high px-4 py-2 rounded-full border border-outline-variant">
            <span className="font-label-caps text-label-caps text-on-surface-variant mr-3">ONLINE</span>
            <button 
              onClick={() => setIsOnline(!isOnline)}
              className="w-12 h-6 bg-primary-container rounded-full relative transition-all active:scale-95"
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isOnline ? "right-1" : "left-1"}`}></div>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container">
              <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida/ADBb0ugQxMYonoLLwgxpgaKFhG2q5USX6oMQI1vSInCg6OdWjIyzXnjJZCNnBMMxyvDjnzBUxX8yX_kd1deGO-qzSKMG_AvgniNvLJfEoIJ0lIwEUs7BnLtBoTChwFq3JFs4JyjqXwB-SCo-yI8bKzVm6CH1xBmivkC05agaTSrM4SRKNtBfe-Bd01Ov5e0F6KegEFnN9o3cstDGAnkp7XGLZ7Q151lbHlWZL3S1lIINX4atJelp7H04eLU4h1g" alt="Rider" />
            </div>
            <div className="hidden md:block">
              <p className="font-label-caps text-[10px] text-primary">GOLD TIER</p>
              <p className="font-headline-md text-sm leading-none">Rider #8821</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-slate-500 hover:opacity-80 transition-opacity active:scale-95">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <Link href="/rider/login" className="p-2 text-slate-500 hover:opacity-80 transition-opacity active:scale-95">
              <span className="material-symbols-outlined">power_settings_new</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative h-screen w-full pt-20">
        {/* Map Background */}
        <div className="absolute inset-0 z-0">
          <img className="w-full h-full object-cover" data-alt="A high-contrast, stylized digital map of a bustling metropolitan area" src="https://lh3.googleusercontent.com/aida/ADBb0uiugKcaP2DL9C13e9wDrnek068tIUinJpk04MptyP_MOu7svL-593yK1hDkx7C-MEYEAVoLGe0Q7M--cy1ugPRBsxWIfKaL1S65tI9nJ0kyAE8FKFAUKFyIO3C8mEQvhxjr0v4OZFbepXRxllGTFhhLIJYU3kDCSqCtADWnDZf8Wyx4D6oHuIuXdwmuWMxkyLXy4dft3qR_NeL02fo9_hY8PA4bE55HpKruqId6cpcR48qKrFGQcaInouZkak8LVbYDQt4VBbC8nA" alt="Map" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent pointer-events-none"></div>
          
          {/* Pickup Marker */}
          <div className="absolute top-[35%] left-[45%] -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-25"></div>
              <div className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-primary">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-3 py-1 rounded-lg shadow-lg border border-outline-variant">
                <p className="font-label-caps text-[8px] text-primary">PICKUP</p>
                <p className="text-[10px] font-bold">{currentOrder?.vendor || "Burger Prime"}</p>
              </div>
            </div>
          </div>
          
          {/* Rider Marker */}
          <div className="absolute top-[65%] left-[55%] -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center shadow-xl border-2 border-white">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>moped</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Overlay */}
        {!currentOrder && pendingOrders.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-end justify-center pb-24 md:pb-32 px-4 md:px-0">
            <div className="max-w-xl w-full bg-white/85 backdrop-blur-xl rounded-2xl overflow-hidden shadow-[0_32px_64px_rgba(77,33,42,0.12)] border border-white flex flex-col">
              {/* Countdown Header */}
              <div className="bg-primary-container p-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="20" cy="20" fill="transparent" r="18" stroke="rgba(255,255,255,0.2)" strokeWidth="3"></circle>
                      <circle className="countdown-ring" cx="20" cy="20" fill="transparent" r="18" stroke="white" strokeWidth="3"></circle>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-bold text-xs">{countdown}</span>
                  </div>
                  <div>
                    <p className="font-label-caps text-[10px] opacity-80">NEW REQUEST</p>
                    <h2 className="font-headline-md text-lg uppercase tracking-tight">Incoming Order</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-label-caps text-[10px] opacity-80">EARNINGS</p>
                  <h2 className="font-headline-xl text-2xl">₹{pendingOrders[0].earnings}.00</h2>
                </div>
              </div>
              
              {/* Order Details */}
              <div className="p-card-padding">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-2">
                    <span className="bg-surface-container-highest text-on-surface px-3 py-1 rounded-full text-[11px] font-bold">{pendingOrders[0].items} ITEMS</span>
                    <span className="bg-surface-container-highest text-on-surface px-3 py-1 rounded-full text-[11px] font-bold">FOOD DELIVERY</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    <span className="text-xs uppercase tracking-wider">High Priority</span>
                  </div>
                </div>
                
                {/* Journey Path */}
                <div className="space-y-6 relative">
                  <div className="absolute left-[11px] top-6 bottom-6 w-0.5 border-l-2 border-dashed border-outline-variant"></div>
                  
                  <div className="flex items-start gap-4">
                    <div className="z-10 bg-primary-container w-6 h-6 rounded-full flex items-center justify-center mt-1">
                      <span className="material-symbols-outlined text-[14px] text-white">restaurant</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-label-caps text-[10px] text-primary">PICKUP AT</p>
                      <h3 className="font-headline-md text-lg">{pendingOrders[0].vendor}</h3>
                      <p className="text-sm text-on-surface-variant">{pendingOrders[0].vendorAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{pendingOrders[0].distance} km</p>
                      <p className="text-[10px] text-on-surface-variant">{pendingOrders[0].time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="z-10 bg-secondary-container w-6 h-6 rounded-full flex items-center justify-center mt-1">
                      <span className="material-symbols-outlined text-[14px] text-white">home</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-label-caps text-[10px] text-secondary">DROP OFF AT</p>
                      <h3 className="font-headline-md text-lg">{pendingOrders[0].customer}</h3>
                      <p className="text-sm text-on-surface-variant">{pendingOrders[0].customerAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-secondary">{pendingOrders[0].distance2} km</p>
                      <p className="text-[10px] text-on-surface-variant">{pendingOrders[0].time2}</p>
                    </div>
                  </div>
                </div>
                
                {/* Summary Stats */}
                <div className="mt-8 grid grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-label-caps text-[9px] text-on-surface-variant">TOTAL DISTANCE</span>
                    <span className="font-headline-md text-xl">{pendingOrders[0].totalDistance} km</span>
                  </div>
                  <div className="flex flex-col border-l border-outline-variant pl-4">
                    <span className="font-label-caps text-[9px] text-on-surface-variant">EST. COMPLETION</span>
                    <span className="font-headline-md text-xl">{pendingOrders[0].estCompletion} mins</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-8 flex gap-4">
                  <button 
                    onClick={() => handleDecline(pendingOrders[0].id)}
                    className="flex-1 py-5 bg-surface-container-highest text-on-surface-variant font-bold rounded-full transition-all active:scale-95 hover:bg-outline-variant uppercase tracking-widest text-xs"
                  >
                    DECLINE
                  </button>
                  <button 
                    onClick={() => handleAccept(pendingOrders[0])}
                    className="flex-[2] py-5 bg-primary-container text-white font-black rounded-full shadow-lg shadow-primary-container/30 transition-all active:scale-[0.97] hover:opacity-90 uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2"
                  >
                    <span>ACCEPT ORDER</span>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Order View - disabled due to Turbopack issue */}
        {/* {currentOrder && ( */}
          {/* <div className="absolute inset-0 z-10 flex items-end justify-center pb-24 md:pb-32 px-4 md:px-0"> */}
            {/* <div className="max-w-xl w-full bg-gradient-to-r from-primary-container to-primary text-white rounded-2xl overflow-hidden shadow-[0_32px_64px_rgba(77,33,42,0.12)] flex flex-col"> */}
              {/* <div className="p-card-padding"> */}
                {/* <div className="flex items-center gap-2 mb-4"> */}
                  {/* <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>delivery_dining</span> */}
                  {/* <span className="font-label-caps text-[10px] uppercase tracking-widest">CURRENT DELIVERY</span> */}
                {/* </div> */}
                {/*  */}
                {/* <div className="space-y-4"> */}
                  {/* <div className="flex justify-between items-start"> */}
                    {/* <div> */}
                      {/* <p className="font-headline-md text-xl">{currentOrder.vendor}</p> */}
                      {/* <p className="text-white/70 text-sm">{currentOrder.vendorAddress}</p> */}
                    {/* </div> */}
                    {/* <div className="text-right"> */}
                      {/* <p className="font-headline-xl text-2xl">₹{currentOrder.earnings}</p> */}
                      {/* <p className="font-label-caps text-[9px] opacity-70">EARNINGS</p> */}
                    {/* </div> */}
                  {/* </div> */}
                  {/*  */}
                  {/* <div className="bg-white/10 rounded-xl p-4 space-y-3"> */}
                    {/* <div className="flex items-center gap-3"> */}
                      {/* <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"> */}
                        {/* <span className="material-symbols-outlined text-white">restaurant</span> */}
                      {/* </div> */}
                      {/* <div> */}
                        {/* <p className="font-label-caps text-[9px] opacity-70">PICKUP</p> */}
                        {/* <p className="font-bold">{currentOrder.vendor}</p> */}
                      {/* </div> */}
                    {/* </div> */}
                    {/* <div className="flex items-center gap-3"> */}
                      {/* <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"> */}
                        {/* <span className="material-symbols-outlined text-white">home</span> */}
                      {/* </div> */}
                      {/* <div> */}
                        {/* <p className="font-label-caps text-[9px] opacity-70">DROP OFF</p> */}
                        {/* <p className="font-bold">{currentOrder.customer}</p> */}
                      {/* </div> */}
                    {/* </div> */}
                  {/* </div> */}
                {/*  */}
                {/* <div className="flex gap-3 mt-6"> */}
                  {/* <button className="flex-1 bg-white/20 py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"> */}
                    {/* <span className="material-symbols-outlined">call</span> */}
                    {/* Call */}
                  {/* </button> */}
                  {/* <button className="flex-1 bg-white text-primary py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"> */}
                    {/* <span className="material-symbols-outlined">navigation</span> */}
                    {/* Navigate */}
                  {/* </button> */}
                {/* </div> */}
                {/*  */}
                {/* <button */}
                  {/* onClick={handleComplete} */}
                  {/* className="w-full mt-4 bg-green-500 py-4 rounded-full font-black text-sm flex items-center justify-center gap-2 uppercase tracking-widest transition-all active:scale-95" */}
                {/* > */}
                  {/* <span className="material-symbols-outlined">check_circle</span> */}
                  {/* Mark as Delivered */}
                {/* </button> */}
              {/* </div> */}
            {/* </div> */}
          {/* </div> */}
        {/* )} */}

        {/* Map Controls */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
          <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-on-surface active:scale-90 transition-all">
            <span className="material-symbols-outlined">add</span>
          </button>
          <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-on-surface active:scale-90 transition-all">
            <span className="material-symbols-outlined">remove</span>
          </button>
          <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-primary active:scale-90 transition-all mt-4">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
          </button>
        </div>
      </main>

      {/* Daily Goal Widget */}
      <div className="fixed top-24 left-6 z-20 hidden lg:block">
        <div className="bg-white/85 backdrop-blur-xl p-4 rounded-lg w-64 shadow-xl border border-white/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
            </div>
            <div>
              <p className="font-label-caps text-[9px] text-primary">DAILY GOAL</p>
              <p className="font-bold text-sm">8/12 Orders</p>
            </div>
          </div>
          <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div className="w-2/3 h-full bg-primary-container rounded-full"></div>
          </div>
          <p className="mt-2 text-[10px] text-on-surface-variant font-medium">Earn ₹250 bonus for 4 more orders</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-8 bg-white/90 backdrop-blur-2xl">
        {navItems.map((item) => (
          item.href === "/rider/dashboard" && item.label === "Navigate" ? (
            <div key={item.label} className="flex flex-col items-center justify-center bg-primary-container text-white rounded-full w-14 h-14 -mt-6 shadow-lg shadow-primary-container/40 active:scale-90 transition-all duration-200">
              <span className="material-symbols-outlined" data-icon="explore">explore</span>
            </div>
          ) : (
            <Link 
              href={item.href}
              key={item.label}
              className={`flex flex-col items-center justify-center p-2 ${item.active ? "text-primary" : "text-slate-400"} hover:text-primary transition-colors active:scale-90 transition-all duration-200`}
            >
              <span className="material-symbols-outlined" data-icon={item.icon} style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
              <span className="font-['Plus_Jakarta_Sans'] text-[10px] font-extrabold uppercase tracking-widest mt-1">{item.label}</span>
            </Link>
          )
        ))}
      </nav>
    </div>
  );
}