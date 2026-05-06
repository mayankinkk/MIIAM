"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Order {
  id: string;
  vendor: string;
  vendorAddress: string;
  vendorPhone: string;
  customer: string;
  customerPhone: string;
  customerAddress: string;
  landmark: string;
  distance: number;
  distance2: number;
  totalDistance: number;
  earnings: number;
  items: number;
  itemsList: string[];
  time: string;
  time2: string;
  estCompletion: number;
  priority: "high" | "normal";
  peakMultiplier: number;
  specialInstructions: string;
  otp: string;
  type: "food" | "grocery" | "multi_stop";
  stops?: {
    name: string;
    address: string;
    landmark: string;
    distance: number;
    time: string;
    otp: string;
  }[];
}

const sampleOrders: Order[] = [
  {
    id: "ORD001",
    vendor: "Burger Prime",
    vendorAddress: "The Highstreet Mall, Ground Floor, Zone A",
    vendorPhone: "+91 98765 43210",
    customer: "Priya S.",
    customerPhone: "+91 91234 56789",
    customerAddress: "Apartment 402, Block B, Silver Oaks Society",
    landmark: "Near Metro Station, Gate No. 3",
    distance: 1.2,
    distance2: 3.0,
    totalDistance: 4.2,
    earnings: 120,
    items: 3,
    itemsList: ["Chicken Burger x2", "Fries (L) x1", "Cold Drink x1"],
    time: "4 mins",
    time2: "12 mins",
    estCompletion: 22,
    priority: "high",
    peakMultiplier: 1.5,
    specialInstructions: "Please ring the doorbell twice. Leave at security desk if no response.",
    otp: "4829",
    type: "food",
  },
  {
    id: "ORD003",
    vendor: "Blinkit Express",
    vendorAddress: "Warehouse - Sector 18, Block A",
    vendorPhone: "+91 98765 00000",
    customer: "Multi-Stop Delivery",
    customerPhone: "+91 90000 00000",
    customerAddress: "",
    landmark: "Multiple locations",
    distance: 0.5,
    distance2: 0,
    totalDistance: 6.5,
    earnings: 180,
    items: 8,
    itemsList: ["Milk x2", "Bread x1", "Eggs x1", "Butter x1", "Chips x2", "Chocolate x1"],
    time: "2 mins",
    time2: "25 mins",
    estCompletion: 35,
    priority: "normal",
    peakMultiplier: 1.3,
    specialInstructions: "3 deliveries in this batch",
    otp: "0",
    type: "multi_stop",
    stops: [
      { name: "Rahul S.", address: "Tower A, Flat 101, Skyline Apartments", landmark: "Near main gate", distance: 2.0, time: "8 mins", otp: "1234" },
      { name: "Ankit M.", address: "Tower B, Flat 205, Skyline Apartments", landmark: "Parking side", distance: 2.5, time: "12 mins", otp: "5678" },
      { name: "Sneha P.", address: "Tower C, Flat 302, Skyline Apartments", landmark: "Reception", distance: 2.0, time: "18 mins", otp: "9012" },
    ],
  },
  {
    id: "ORD002",
    vendor: "Pizza Hut",
    vendorAddress: "City Center, 2nd Floor, Food Court",
    vendorPhone: "+91 98765 11111",
    customer: "Amit K.",
    customerPhone: "+91 99887 76655",
    customerAddress: "Flat 201, Green Valley Apartments",
    landmark: "Opposite Petrol Pump",
    distance: 2.5,
    distance2: 1.8,
    totalDistance: 4.3,
    earnings: 85,
    items: 2,
    itemsList: ["Large Pepperoni Pizza x1", "Garlic Bread x1"],
    time: "8 mins",
    time2: "6 mins",
    estCompletion: 18,
    priority: "normal",
    peakMultiplier: 1.2,
    specialInstructions: "",
    otp: "2156",
    type: "food",
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
  { icon: "explore", label: "Navigate", active: false, href: "https://maps.google.com" },
  { icon: "payments", label: "Wallet", active: false, href: "/rider/wallet" },
  { icon: "person", label: "Account", active: false, href: "/rider/account" },
];

function calculateEarnings(distance: number, baseFare: number = 40, perKm: number = 8, peakMultiplier: number = 1): number {
  return Math.round((baseFare + (distance * perKm)) * peakMultiplier);
}

export default function RiderDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [countdown, setCountdown] = useState(52);
  const [pendingOrders, setPendingOrders] = useState(sampleOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [showNewOrderAlert, setShowNewOrderAlert] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [otpInput, setOtpInput] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{from: string; text: string; time: string}[]>([
    { from: "system", text: "Order confirmed. Please proceed to pickup.", time: "10:30 AM" },
  ]);
  const [deliveryStep, setDeliveryStep] = useState<"shopping" | "picking_up" | "picked" | "delivering" | "arrived">("shopping");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (selectedOrder && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && selectedOrder) {
      autoDecline();
    }
  }, [countdown, selectedOrder]);

  useEffect(() => {
    if (pendingOrders.length > 0 && isOnline && !showNewOrderAlert) {
      setShowNewOrderAlert(true);
      playNotificationSound();
    }
  }, [pendingOrders, isOnline]);

  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 500]);
    }
  };

  const dismissNewOrderAlert = () => {
    setShowNewOrderAlert(false);
  };

  const autoDecline = () => {
    if (selectedOrder) {
      handleDecline(selectedOrder.id);
    }
  };

  const handleAccept = (order: Order) => {
    setPendingOrders(pendingOrders.filter(o => o.id !== order.id));
    setCurrentOrder(order);
    setSelectedOrder(null);
    if (order.type === "multi_stop") {
      setDeliveryStep("picking_up");
    } else {
      setDeliveryStep("shopping"); // For shopping orders, start with shopping mode
    }
  };

  const handleDecline = (orderId: string) => {
    setPendingOrders(pendingOrders.filter(o => o.id !== orderId));
    setSelectedOrder(null);
    setShowSkipModal(false);
    setCountdown(52);
  };

  const handleSkip = () => {
    setShowSkipModal(true);
  };

  const handleCallCustomer = () => {
    setShowCallModal(true);
  };

  const handleStartChat = () => {
    setShowChatModal(true);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setChatHistory([...chatHistory, { from: "you", text: chatMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setChatMessage("");
      setTimeout(() => {
        setChatHistory(prev => [...prev, { from: "system", text: "Message delivered to customer", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }, 1000);
    }
  };

  const handleOtpSubmit = () => {
    if (otpInput === currentOrder?.otp) {
      setShowOtpModal(false);
      setShowPhotoModal(true);
    } else {
      alert("Invalid OTP! Please try again.");
    }
  };

  const handlePhotoProof = () => {
    setShowPhotoModal(false);
    handleComplete();
  };

  const handleComplete = () => {
    if (currentOrder) {
      const finalEarnings = calculateEarnings(currentOrder.totalDistance, 40, 8, currentOrder.peakMultiplier);
      alert(`Order delivered successfully! ₹${finalEarnings} added to your wallet.`);
      setCurrentOrder(null);
    }
  };

  const handlePickedUp = () => {
    setDeliveryStep("delivering");
  };

  const handleArrived = () => {
    if (currentOrder?.type === "multi_stop" && currentOrder.stops && currentStopIndex < currentOrder.stops.length - 1) {
      setCurrentStopIndex(currentStopIndex + 1);
      alert(`Stop ${currentStopIndex + 1} delivered! Moving to stop ${currentStopIndex + 2}...`);
    } else {
      setDeliveryStep("arrived");
      setShowOtpModal(true);
    }
  };

  const calculatePeakEarnings = (order: Order) => {
    const base = calculateEarnings(order.totalDistance);
    return Math.round(base * order.peakMultiplier);
  };

  const isPeakHour = () => {
    const hour = new Date().getHours();
    return (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 21);
  };

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface overflow-hidden">
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQoKJZPl" preload="auto" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 py-3 bg-white/90 backdrop-blur-lg border-b border-white/20 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black italic tracking-tighter text-primary">MIIAM</span>
          <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">RIDER</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setIsOnline(!isOnline);
              alert(isOnline ? "You're now OFFLINE. You won't receive new orders." : "You're now ONLINE. Ready to receive orders!");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${isOnline ? "bg-green-100 border-green-300" : "bg-slate-100 border-slate-300"}`}
          >
            <span className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500" : "bg-slate-400"}`}></span>
            <span className={`font-bold text-xs ${isOnline ? "text-green-700" : "text-slate-500"}`}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </button>
          <Link href="/rider/notifications" className="relative p-2">
            <span className="material-symbols-outlined text-slate-600">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Link>
          <Link href="/rider/login" className="p-2">
            <span className="material-symbols-outlined text-slate-600">power_settings_new</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative h-screen w-full pt-16">
        {/* Map Background with Heatmap */}
        <div className="absolute inset-0 z-0">
          <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida/ADBb0uiugKcaP2DL9C13e9wDrnek068tIUinJpk04MptyP_MOu7svL-593yK1hDkx7C-MEYEAVoLGe0Q7M--cy1ugPRBsxWIfKaL1S65tI9nJ0kyAE8FKFAUKFyIO3C8mEQvhxjr0v4OZFbepXRxllGTFhhLIJYU3kDCSqCtADWnDZf8Wyx4D6oHuIuXdwmuWMxkyLXy4dft3qR_NeL02fo9_hY8PA4bE55HpKruqId6cpcR48qKrFGQcaInouZkak8LVbYDQt4VBbC8nA" alt="Map" />
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* Heatmap dots for high demand areas */}
          <div className="absolute top-[30%] left-[60%] w-20 h-20 bg-orange-500/30 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-[50%] left-[30%] w-16 h-16 bg-orange-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-[70%] left-[70%] w-24 h-24 bg-orange-500/25 rounded-full blur-xl animate-pulse"></div>
          
          {/* Pickup Marker */}
          {currentOrder && (
            <div className="absolute top-[35%] left-[45%] -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-25"></div>
                <div className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-primary">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded-lg shadow border text-[10px] font-bold">
                  {currentOrder.vendor}
                </div>
              </div>
            </div>
          )}
          
          {/* Delivery Marker */}
          {currentOrder && deliveryStep === "delivering" && (
            <div className="absolute top-[55%] left-[65%] -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-secondary animate-ping opacity-25"></div>
                <div className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-secondary">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded-lg shadow border text-[10px] font-bold">
                  {currentOrder.customer}
                </div>
              </div>
            </div>
          )}
          
          {/* Rider Marker */}
          <div className="absolute top-[65%] left-[55%] -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center shadow-xl border-2 border-white">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>moped</span>
              </div>
            </div>
          </div>
        </div>

        {/* Incoming Order Overlay */}
        {!currentOrder && pendingOrders.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-end justify-center pb-24 px-4">
            <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white flex flex-col max-h-[80vh]">
              <div className="bg-gradient-to-r from-[#0b50d5] to-[#0044bf] p-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="20" cy="20" fill="transparent" r="18" stroke="rgba(255,255,255,0.3)" strokeWidth="3"></circle>
                      <circle cx="20" cy="20" fill="transparent" r="18" stroke="white" strokeWidth="3" strokeDasharray={`${(52 - countdown) / 52 * 113} 113`}></circle>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-bold text-xs">{countdown}</span>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-80">NEW ORDER</p>
                    <h2 className="font-bold text-lg">{pendingOrders[0].id}</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] opacity-80">EARNINGS</p>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-black">₹{calculatePeakEarnings(pendingOrders[0])}</span>
                    {pendingOrders[0].peakMultiplier > 1 && (
                      <span className="bg-yellow-400 text-[#0b50d5] text-[10px] font-bold px-1.5 rounded">+{(pendingOrders[0].peakMultiplier - 1) * 100}%</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1">
                <div className="flex gap-2 mb-4 flex-wrap">
                  {pendingOrders[0].type === "multi_stop" ? (
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                      {pendingOrders[0].stops?.length} STOPS
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-[10px] font-bold">
                      FOOD DELIVERY
                    </span>
                  )}
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-[10px] font-bold">
                    {pendingOrders[0].items} ITEMS
                  </span>
                  {pendingOrders[0].priority === "high" && (
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                      HIGH PRIORITY
                    </span>
                  )}
                  {isPeakHour() && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-[10px] font-bold">
                      PEAK HOUR
                    </span>
                  )}
                </div>

                {/* Multi-Stop Info */}
                {pendingOrders[0].type === "multi_stop" && pendingOrders[0].stops && (
                  <div className="bg-purple-50 p-3 rounded-xl mb-4 border border-purple-100">
                    <p className="text-[10px] text-purple-600 font-bold mb-2">📦 MULTI-STOP BATCH DELIVERY</p>
                    <div className="space-y-2">
                      {pendingOrders[0].stops.map((stop, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold text-[8px]">{i + 1}</span>
                            <span className="text-slate-600">{stop.name}</span>
                          </div>
                          <span className="text-purple-600 font-bold">{stop.distance} km</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-purple-500 mt-2">Complete all deliveries to earn ₹{pendingOrders[0].earnings}</p>
                  </div>
                )}

                {/* Fare Calculator */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl mb-4 border border-green-100">
                  <p className="text-[10px] text-green-600 font-bold mb-2">EARNINGS BREAKDOWN</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Base Fare</span>
                      <span className="font-bold">₹40</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Distance ({pendingOrders[0].totalDistance} km)</span>
                      <span className="font-bold">₹{pendingOrders[0].totalDistance * 8}</span>
                    </div>
                    {pendingOrders[0].peakMultiplier > 1 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Peak Bonus</span>
                          <span className="font-bold text-green-600">+₹{Math.round(40 + pendingOrders[0].totalDistance * 8) * (pendingOrders[0].peakMultiplier - 1)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1 mt-1">
                          <span className="font-bold">Total</span>
                          <span className="font-black text-green-600">₹{calculatePeakEarnings(pendingOrders[0])}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4 relative">
                  <div className="absolute left-[10px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-slate-300"></div>
                  
                  <div className="flex items-start gap-3">
                    <div className="z-10 bg-[#0b50d5] w-5 h-5 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-xs">restaurant</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] text-[#0b50d5] font-bold">PICKUP</p>
                      <p className="font-bold text-sm">{pendingOrders[0].vendor}</p>
                      <p className="text-[10px] text-slate-500">{pendingOrders[0].vendorAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{pendingOrders[0].distance} km</p>
                      <p className="text-[9px] text-slate-400">{pendingOrders[0].time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="z-10 bg-[#4d212a] w-5 h-5 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-xs">home</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] text-[#4d212a] font-bold">DROP</p>
                      <p className="font-bold text-sm">{pendingOrders[0].customer}</p>
                      <p className="text-[10px] text-slate-500">{pendingOrders[0].customerAddress}</p>
                      <p className="text-[9px] text-slate-400 mt-1">📍 {pendingOrders[0].landmark}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{pendingOrders[0].distance2} km</p>
                      <p className="text-[9px] text-slate-400">{pendingOrders[0].time2}</p>
                    </div>
                  </div>
                </div>

                {pendingOrders[0].specialInstructions && (
                  <div className="mt-4 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <p className="text-[9px] text-amber-700 font-bold mb-1">📝 SPECIAL INSTRUCTIONS</p>
                    <p className="text-xs text-amber-800">{pendingOrders[0].specialInstructions}</p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                  <div>
                    <p className="text-[9px] text-slate-400">TOTAL DISTANCE</p>
                    <p className="font-bold">{pendingOrders[0].totalDistance} km</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400">EST. TIME</p>
                    <p className="font-bold">{pendingOrders[0].estCompletion} min</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t bg-slate-50 flex gap-3">
                <button 
                  onClick={handleSkip}
                  className="flex-1 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl text-sm"
                >
                  Skip (Snooze 30s)
                </button>
                <button 
                  onClick={() => handleAccept(pendingOrders[0])}
                  className="flex-[2] py-3 bg-[#0b50d5] text-white font-black rounded-xl text-sm shadow-lg"
                >
                  ACCEPT ORDER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Delivery View */}
        {currentOrder && (
          <div className="absolute inset-0 z-10 flex items-end justify-center pb-24 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className={`p-4 text-white ${deliveryStep === "shopping" ? "bg-purple-600" : deliveryStep === "picking_up" ? "bg-[#0b50d5]" : deliveryStep === "delivering" ? "bg-[#4d212a]" : "bg-green-600"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {deliveryStep === "picking_up" ? "restaurant" : deliveryStep === "delivering" ? "local_shipping" : "location_on"}
                    </span>
                    <span className="font-bold text-sm uppercase">
                      {currentOrder.type === "multi_stop" 
                        ? deliveryStep === "picking_up" ? "Pick Up" : deliveryStep === "delivering" ? `Stop ${currentStopIndex + 1}/${currentOrder.stops?.length}` : "Complete"
                        : deliveryStep === "shopping" ? "Shop Items" : deliveryStep === "picking_up" ? "Pick Up" : deliveryStep === "delivering" ? "Delivering" : "Arrived"
                      }
                    </span>
                    {currentOrder.type === "multi_stop" && (
                      <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">BATCH</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">₹{calculatePeakEarnings(currentOrder)}</p>
                  </div>
                </div>

                {/* Multi-Stop Progress Bar */}
                {currentOrder.type === "multi_stop" && currentOrder.stops && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[9px] mb-1">
                      <span className="opacity-70">Progress</span>
                      <span>{currentStopIndex + 1}/{currentOrder.stops.length} Stops</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all"
                        style={{ width: `${((currentStopIndex + 1) / currentOrder.stops.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Progress Steps */}
                <div className="flex items-center justify-between text-[10px]">
                  {currentOrder.type === "multi_stop" ? (
                    <>
                      <div className={`flex flex-col items-center ${deliveryStep === "picking_up" ? "text-white" : "text-white/50"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${deliveryStep === "picking_up" ? "bg-white text-[#0b50d5]" : "bg-white/30"}`}>1</div>
                        <span>Pickup</span>
                      </div>
                      <div className="flex-1 h-0.5 bg-white/30 mx-2"><div className={`h-full bg-white ${deliveryStep !== "picking_up" ? "w-full" : "w-0"}`}></div></div>
                      <div className={`flex flex-col items-center ${deliveryStep === "delivering" || deliveryStep === "arrived" ? "text-white" : "text-white/50"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${deliveryStep === "delivering" || deliveryStep === "arrived" ? "bg-white text-[#4d212a]" : "bg-white/30"}`}>2</div>
                        <span>Deliveries</span>
                      </div>
                      <div className="flex-1 h-0.5 bg-white/30 mx-2"><div className={`h-full bg-white ${deliveryStep === "arrived" ? "w-full" : "w-0"}`}></div></div>
                      <div className={`flex flex-col items-center ${deliveryStep === "arrived" ? "text-white" : "text-white/50"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${deliveryStep === "arrived" ? "bg-white text-green-600" : "bg-white/30"}`}>3</div>
                        <span>Complete</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`flex flex-col items-center ${deliveryStep === "shopping" ? "text-white" : "text-white/50"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${deliveryStep === "shopping" ? "bg-white text-purple-600" : "bg-white/30"}`}>1</div>
                        <span>Shop</span>
                      </div>
                      <div className="flex-1 h-0.5 bg-white/30 mx-2"><div className={`h-full bg-white ${["picking_up", "delivering", "arrived"].includes(deliveryStep) ? "w-full" : "w-0"}`}></div></div>
                      <div className={`flex flex-col items-center ${deliveryStep === "picking_up" || deliveryStep === "delivering" || deliveryStep === "arrived" ? "text-white" : "text-white/50"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${["picking_up", "delivering", "arrived"].includes(deliveryStep) ? "bg-white text-[#0b50d5]" : "bg-white/30"}`}>2</div>
                        <span>Deliver</span>
                      </div>
                      <div className="flex-1 h-0.5 bg-white/30 mx-2"><div className={`h-full bg-white ${deliveryStep === "arrived" ? "w-full" : "w-0"}`}></div></div>
                      <div className={`flex flex-col items-center ${deliveryStep === "arrived" ? "text-white" : "text-white/50"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${deliveryStep === "arrived" ? "bg-white text-green-600" : "bg-white/30"}`}>3</div>
                        <span>Collect ₹</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4">
                {/* Shopping Step - For grocery/shopping orders */}
                {deliveryStep === "shopping" && currentOrder.type !== "multi_stop" && (
                  <>
                    <div className="mb-4">
                      <p className="text-[10px] text-purple-600 font-bold mb-2">🛒 SHOPPING MODE</p>
                      <p className="text-[10px] text-slate-400">GO TO STORE AND BUY THESE ITEMS</p>
                      <p className="font-bold text-lg mt-2">{currentOrder.vendor}</p>
                      <p className="text-sm text-slate-500">{currentOrder.vendorAddress}</p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-xl mb-4">
                      <p className="text-[10px] text-purple-600 font-bold mb-3">ITEMS TO BUY</p>
                      <div className="space-y-2">
                        {currentOrder.itemsList.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg">
                            <span className="text-sm font-medium text-slate-700">• {item}</span>
                            <button className="text-[10px] px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                              ✓ PICKED
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {currentOrder.specialInstructions && (
                      <div className="bg-amber-50 p-3 rounded-xl mb-4">
                        <p className="text-[10px] text-amber-600 font-bold mb-1">📝 CUSTOMER NOTES</p>
                        <p className="text-sm text-amber-800">{currentOrder.specialInstructions}</p>
                      </div>
                    )}

                    <div className="bg-slate-50 p-3 rounded-xl mb-4">
                      <p className="text-[10px] text-slate-400 mb-2">DELIVER TO</p>
                      <p className="font-bold">{currentOrder.customer}</p>
                      <p className="text-sm text-slate-500">{currentOrder.customerAddress}</p>
                      <p className="text-xs text-slate-400">📍 {currentOrder.landmark}</p>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={handleCallCustomer}
                        className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">call</span>
                        Call Customer
                      </button>
                      <button 
                        onClick={handleStartChat}
                        className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">chat</span>
                        Chat
                      </button>
                    </div>

                    <Link 
                      href="/rider/orders"
                      className="w-full mt-3 py-4 bg-purple-600 text-white font-black rounded-xl flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">inventory_2</span>
                      GO TO SHOPPING LIST
                    </Link>

                    <button 
                      onClick={() => setDeliveryStep("picking_up")}
                      className="w-full mt-3 py-3 bg-green-500 text-white font-bold rounded-xl"
                    >
                      ALL ITEMS COLLECTED ✓
                    </button>
                  </>
                )}

                {deliveryStep === "picking_up" && (
                  <>
                    <div className="mb-4">
                      <p className="text-[10px] text-slate-400">PICKUP FROM</p>
                      <p className="font-bold text-lg">{currentOrder.vendor}</p>
                      <p className="text-sm text-slate-500">{currentOrder.vendorAddress}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl mb-4">
                      <p className="text-[10px] text-slate-400 mb-2">ORDER ITEMS</p>
                      {currentOrder.itemsList.map((item, i) => (
                        <p key={i} className="text-sm text-slate-600">• {item}</p>
                      ))}
                    </div>
                    {currentOrder.type === "multi_stop" && currentOrder.stops && (
                      <div className="bg-purple-50 p-3 rounded-xl mb-4">
                        <p className="text-[10px] text-purple-600 font-bold mb-2">📦 DELIVERY STOPS</p>
                        {currentOrder.stops.map((stop, i) => (
                          <div key={i} className={`flex items-center gap-2 text-sm py-1 ${i === currentStopIndex ? "text-purple-700 font-bold" : i < currentStopIndex ? "text-green-600 line-through" : "text-slate-500"}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${i === currentStopIndex ? "bg-purple-500 text-white" : i < currentStopIndex ? "bg-green-500 text-white" : "bg-slate-200"}`}>
                              {i < currentStopIndex ? "✓" : i + 1}
                            </span>
                            {stop.name}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button 
                        onClick={handleCallCustomer}
                        className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">call</span>
                        Call Vendor
                      </button>
                      <button 
                        onClick={handleStartChat}
                        className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">chat</span>
                        Chat
                      </button>
                    </div>
                    <button 
                      onClick={handlePickedUp}
                      className="w-full mt-3 py-4 bg-green-500 text-white font-black rounded-xl"
                    >
                      {currentOrder.type === "multi_stop" ? `START DELIVERIES (${currentOrder.stops?.length} STOPS)` : "PICKED UP ORDER ✓"}
                    </button>
                  </>
                )}

                {deliveryStep === "delivering" && currentOrder.type === "multi_stop" && currentOrder.stops ? (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[10px] font-bold">
                          STOP {currentStopIndex + 1} OF {currentOrder.stops.length}
                        </span>
                        <span className="text-xs text-slate-400">
                          {currentOrder.stops[currentStopIndex].time}
                        </span>
                      </div>
                      <p className="font-bold text-lg">{currentOrder.stops[currentStopIndex].name}</p>
                      <p className="text-sm text-slate-500">{currentOrder.stops[currentStopIndex].address}</p>
                      <p className="text-xs text-slate-400 mt-1">📍 {currentOrder.stops[currentStopIndex].landmark}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-xl mb-4">
                      <p className="text-[10px] text-purple-600 font-bold mb-1">🔐 DELIVERY OTP</p>
                      <p className="font-black text-2xl tracking-widest">{currentOrder.stops[currentStopIndex].otp}</p>
                      <p className="text-[9px] text-purple-500">Share this OTP with customer</p>
                    </div>
                    
                    {/* Remaining Stops */}
                    <div className="bg-slate-50 p-3 rounded-xl mb-4">
                      <p className="text-[10px] text-slate-400 mb-2">UPCOMING STOPS</p>
                      {currentOrder.stops.slice(currentStopIndex + 1).map((stop, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-500 py-1">
                          <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[10px]">{currentStopIndex + i + 2}</span>
                          {stop.name} - {stop.distance}km
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={handleCallCustomer}
                        className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">call</span>
                        Call Customer
                      </button>
                      <button 
                        onClick={handleStartChat}
                        className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">chat</span>
                        Chat
                      </button>
                    </div>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentOrder.stops[currentStopIndex].address)}`}
                      target="_blank"
                      className="w-full mt-3 py-3 bg-[#0b50d5] text-white font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">navigation</span>
                      Navigate to Stop
                    </a>
                    <button 
                      onClick={handleArrived}
                      className="w-full mt-3 py-4 bg-green-500 text-white font-black rounded-xl"
                    >
                      I'VE ARRIVED 🚩
                    </button>
                  </>
                ) : deliveryStep === "delivering" && (
                  <>
                    <div className="mb-4">
                      <p className="text-[10px] text-slate-400">DELIVER TO</p>
                      <p className="font-bold text-lg">{currentOrder.customer}</p>
                      <p className="text-sm text-slate-500">{currentOrder.customerAddress}</p>
                      <p className="text-xs text-slate-400 mt-1">📍 {currentOrder.landmark}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl mb-4">
                      <p className="text-[10px] text-blue-600 font-bold mb-1">🔐 DELIVERY OTP</p>
                      <p className="font-black text-2xl tracking-widest">{currentOrder.otp}</p>
                      <p className="text-[9px] text-blue-500">Share this OTP with customer</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleCallCustomer}
                        className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">call</span>
                        Call Customer
                      </button>
                      <button 
                        onClick={handleStartChat}
                        className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">chat</span>
                        Chat
                      </button>
                    </div>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentOrder.customerAddress)}`}
                      target="_blank"
                      className="w-full mt-3 py-3 bg-[#0b50d5] text-white font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">navigation</span>
                      Navigate
                    </a>
                    <button 
                      onClick={handleArrived}
                      className="w-full mt-3 py-4 bg-green-500 text-white font-black rounded-xl"
                    >
                      I'VE ARRIVED 🚩
                    </button>
                  </>
                )}

                {deliveryStep === "arrived" && (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-green-600 text-5xl">location_on</span>
                    </div>
                    <p className="font-bold text-xl mb-2">You've Arrived!</p>
                    <p className="text-sm text-slate-500 mb-4">Ask customer for OTP to complete delivery</p>
                    <button 
                      onClick={() => setShowOtpModal(true)}
                      className="w-full py-4 bg-green-500 text-white font-black rounded-xl"
                    >
                      VERIFY OTP & COMPLETE
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Map Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
          <button className="w-10 h-10 bg-white rounded-lg shadow flex items-center justify-center">
            <span className="material-symbols-outlined">add</span>
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow flex items-center justify-center">
            <span className="material-symbols-outlined">remove</span>
          </button>
          <button className="w-10 h-10 bg-[#0b50d5] text-white rounded-lg shadow flex items-center justify-center mt-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="fixed top-20 left-4 z-20">
          <div className="bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg">
            <p className="text-[10px] text-slate-400">TODAY'S EARNINGS</p>
            <p className="font-black text-xl text-green-600">₹340</p>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-2 pb-6 pt-3 bg-white/95 backdrop-blur shadow-lg">
        {navItems.map((item) => (
          item.label === "Navigate" ? (
            <a 
              key={item.label}
              href="https://maps.google.com"
              className="flex flex-col items-center justify-center bg-[#0b50d5] text-white rounded-full w-12 h-12 -mt-8 shadow-lg"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </a>
          ) : (
            <Link 
              href={item.href}
              key={item.label}
              className={`flex flex-col items-center justify-center p-2 ${item.active ? "text-[#0b50d5]" : "text-slate-400"}`}
            >
              <span className="material-symbols-outlined" style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
              <span className="text-[9px] font-bold mt-1">{item.label}</span>
            </Link>
          )
        ))}
      </nav>

      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Call</h3>
              <button onClick={() => setShowCallModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-[#0b50d5]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[#0b50d5] text-3xl">person</span>
              </div>
              <p className="font-bold mb-1">{currentOrder?.vendor || "Vendor"}</p>
              <p className="text-sm text-slate-500">{currentOrder?.vendorPhone || currentOrder?.customerPhone}</p>
            </div>
            <a 
              href={`tel:${currentOrder?.vendorPhone || currentOrder?.customerPhone}`}
              className="w-full py-4 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">call</span>
              Call Now
            </a>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full h-[70vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0b50d5]/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#0b50d5]">person</span>
                </div>
                <div>
                  <p className="font-bold">{currentOrder?.customer || "Customer"}</p>
                  <p className="text-[10px] text-green-500">Online</p>
                </div>
              </div>
              <button onClick={() => setShowChatModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "you" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${msg.from === "you" ? "bg-[#0b50d5] text-white" : msg.from === "system" ? "bg-slate-100 text-slate-600 text-xs" : "bg-slate-100"}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-[9px] ${msg.from === "you" ? "text-white/70" : "text-slate-400"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
<div className="flex gap-2">
            <button onClick={() => setShowAlertSettings(true)} className="relative p-2">
              <span className="material-symbols-outlined text-slate-600">
                {soundEnabled && vibrationEnabled ? "notifications_active" : soundEnabled ? "volume_up" : vibrationEnabled ? "vibration" : "notifications_off"}
              </span>
            </button>
            <Link href="/rider/notifications" className="relative p-2">
              <span className="material-symbols-outlined text-slate-600">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>
            <Link href="/rider/login" className="p-2">
              <span className="material-symbols-outlined text-slate-600">power_settings_new</span>
            </Link>
          </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-xl text-center mb-4">Verify OTP</h3>
            <p className="text-sm text-slate-500 text-center mb-6">Ask customer for their delivery OTP</p>
            <input 
              type="text"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              maxLength={4}
              placeholder="Enter 4-digit OTP"
              className="w-full text-center text-2xl font-bold tracking-[1em] border-2 border-slate-200 rounded-xl p-4 mb-4 focus:outline-none focus:border-[#0b50d5]"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleOtpSubmit}
                className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Proof Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-xl text-center mb-4">Delivery Proof</h3>
            <p className="text-sm text-slate-500 text-center mb-6">Take a photo of the delivered items</p>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-300">add_a_photo</span>
              <p className="text-sm text-slate-400 mt-2">Tap to capture photo</p>
            </div>
            <button 
              onClick={handlePhotoProof}
              className="w-full py-4 bg-green-500 text-white font-bold rounded-xl"
            >
              CONFIRM DELIVERY
            </button>
          </div>
        </div>
      )}

      {/* Skip Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-xl text-center mb-2">Skip Order?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">This order will be snoozed for 30 seconds</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowSkipModal(false)}
                className="flex-1 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDecline(pendingOrders[0]?.id || "")}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Settings Modal */}
      {showAlertSettings && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl">Alert Settings</h3>
              <button onClick={() => setShowAlertSettings(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0b50d5]">volume_up</span>
                  <div>
                    <p className="font-bold">Sound Alert</p>
                    <p className="text-xs text-slate-500">Play sound for new orders</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-12 h-6 rounded-full transition-all ${soundEnabled ? "bg-green-500" : "bg-slate-300"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-all ${soundEnabled ? "translate-x-6" : "translate-x-0.5"}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0b50d5]">vibration</span>
                  <div>
                    <p className="font-bold">Vibration</p>
                    <p className="text-xs text-slate-500">Vibrate for new orders</p>
                  </div>
                </div>
                <button 
                  onClick={() => setVibrationEnabled(!vibrationEnabled)}
                  className={`w-12 h-6 rounded-full transition-all ${vibrationEnabled ? "bg-green-500" : "bg-slate-300"}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-all ${vibrationEnabled ? "translate-x-6" : "translate-x-0.5"}`}></div>
                </button>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-sm">info</span>
                  <p className="text-xs text-blue-700">
                    Alerts are triggered when you're online and a new order arrives within your zone.
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowAlertSettings(false)}
              className="w-full mt-4 py-3 bg-[#0b50d5] text-white font-bold rounded-xl"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* New Order Alert Banner */}
      {showNewOrderAlert && pendingOrders.length > 0 && !currentOrder && (
        <div className="fixed top-16 left-0 right-0 z-[90] bg-gradient-to-r from-[#0b50d5] to-[#0044bf] text-white p-3 flex items-center justify-between shadow-lg animate-slide-down">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined animate-bounce">local_shipping</span>
            <div>
              <p className="font-bold text-sm">New Order Available!</p>
              <p className="text-xs opacity-80">{pendingOrders[0].type === "multi_stop" ? `${pendingOrders[0].stops?.length} stops` : pendingOrders[0].items} items • ₹{calculatePeakEarnings(pendingOrders[0])}</p>
            </div>
          </div>
          <button 
            onClick={dismissNewOrderAlert}
            className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold"
          >
            View
          </button>
        </div>
      )}
    </div>
  );
}