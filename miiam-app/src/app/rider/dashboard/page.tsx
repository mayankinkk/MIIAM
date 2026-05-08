"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

// Order with timing info
interface OrderWithTiming extends Order {
  expiresAt?: number; // timestamp when order expires
  isSnoozed?: boolean;
  snoozeUntil?: number;
  orderDbId?: string; // actual DB ID for transactions
}

export default function RiderDashboard() {
  const supabase = createClient();
  const [isOnline, setIsOnline] = useState(true);
  const [countdown, setCountdown] = useState(300); // 5 minutes = 300 seconds
  const [pendingOrders, setPendingOrders] = useState<OrderWithTiming[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithTiming | null>(null);
  const [currentOrder, setCurrentOrder] = useState<OrderWithTiming | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [orderTakenByOther, setOrderTakenByOther] = useState(false);
  
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [showNewOrderAlert, setShowNewOrderAlert] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [snoozeMessage, setSnoozeMessage] = useState("");
  
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{from: string; text: string; time: string}[]>([
    { from: "system", text: "Order confirmed. Please proceed to pickup.", time: "10:30 AM" },
  ]);
  const [deliveryStep, setDeliveryStep] = useState<"shopping" | "picking_up" | "picked" | "delivering" | "arrived">("shopping");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Quest & Streak System
  const [dailyQuests, setDailyQuests] = useState([
    { id: 1, title: "Complete 5 Deliveries", current: 3, target: 5, bonus: 100 },
    { id: 2, title: "Earn ₹500 Today", current: 320, target: 500, bonus: 75 },
    { id: 3, title: "3-Star Ratings", current: 5, target: 10, bonus: 50 },
  ]);
  const [streakDays, setStreakDays] = useState(7);
  const [showQuestModal, setShowQuestModal] = useState(false);

  // Live Earnings
  const [todayEarnings, setTodayEarnings] = useState(340);
  const [liveEarnings, setLiveEarnings] = useState(0);

  // Cash Collection
  const [cashCollected, setCashCollected] = useState(180);
  const [cashPending, setCashPending] = useState(120);

  // Cancel Flow
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasons] = useState([
    "Too far from pickup",
    "Too far from delivery",
    "Vehicle breakdown",
    "Customer unreachable",
    "Order unavailable",
    "Other"
  ]);

  // Low Battery
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [showLowBattery, setShowLowBattery] = useState(false);

  // Customer Rating Preview
  const [customerRating] = useState(4.7);

  // Get rider ID on mount
  useEffect(() => {
    async function getRiderId() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: riderData } = await supabase.from("riders").select("id").eq("user_id", user.id).single();
        if (riderData) {
          setRiderId(riderData.id);
        }
      }
    }
    getRiderId();
  }, [supabase]);

  // 5-minute countdown timer
  useEffect(() => {
    if (selectedOrder && countdown > 0) {
      // Check if order is snoozed
      if (selectedOrder.isSnoozed && selectedOrder.snoozeUntil && Date.now() < selectedOrder.snoozeUntil) {
        return; // Don't countdown while snoozed
      }
      
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && selectedOrder) {
      autoDecline();
    }
  }, [countdown, selectedOrder]);

  // Function to handle snooze
  const handleSnooze = async (order: OrderWithTiming) => {
    const snoozeUntil = Date.now() + 30000; // 30 seconds
    
    setPendingOrders(prev => prev.map(o => 
      o.id === order.id 
        ? { ...o, isSnoozed: true, snoozeUntil } 
        : o
    ));
    
    if (selectedOrder?.id === order.id) {
      setSelectedOrder(prev => prev ? { ...prev, isSnoozed: true, snoozeUntil } : null);
    }
    
    setSnoozeMessage("Order snoozed for 30 seconds");
    setTimeout(() => setSnoozeMessage(""), 3000);
    
    // Save snooze to database
    if (order.orderDbId && riderId) {
      try {
        await supabase.rpc('snooze_order_for_rider', {
          p_order_id: order.orderDbId,
          p_rider_id: riderId,
          p_seconds: 30
        });
      } catch (e) {
        console.log("Snooze RPC not available, using local only");
      }
    }
  };

  // Check for snoozed orders periodically and wake them up
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPendingOrders(prev => prev.map(o => {
        if (o.isSnoozed && o.snoozeUntil && now >= o.snoozeUntil) {
          return { ...o, isSnoozed: false, snoozeUntil: undefined };
        }
        return o;
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchRealOrders() {
      if (!isOnline) return;
      
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      // Only fetch orders not assigned to any rider
      const { data: dbOrders } = await supabase
        .from("orders")
        .select("*")
        .is("rider_id", null)
        .in("status", ["pending"])
        .gte("placed_at", yesterday.toISOString())
        .order("placed_at", { ascending: false });
        
      if (!dbOrders || dbOrders.length === 0) {
        setPendingOrders([]);
        return;
      }
      
      // Calculate expiration time (5 minutes from now for new orders)
      const now = Date.now();
      const expirationTime = now + (5 * 60 * 1000); // 5 minutes
      
      const mappedOrders: OrderWithTiming[] = await Promise.all(dbOrders.map(async (dbOrder) => {
        // Fetch related data sequentially
        const [vendorRes, itemsRes] = await Promise.all([
          dbOrder.vendor_id ? supabase.from("vendors").select("*").eq("id", dbOrder.vendor_id).single() : Promise.resolve({ data: null }),
          supabase.from("order_items").select("*").eq("order_id", dbOrder.id)
        ]);
        let itemsList = [];
        let itemsCount = 0;
        
        const items = itemsRes.data || [];
        if (items.length > 0) {
          itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
          const menuItemIds = items.map(i => i.menu_item_id).filter(Boolean);
          if (menuItemIds.length > 0) {
            const { data: menuItems } = await supabase.from("menu_items").select("*").in("id", menuItemIds);
            if (menuItems) {
              itemsList = items.map((item: any) => {
                const menuItem = menuItems.find(mi => mi.id === item.menu_item_id);
                return `${item.quantity}x ${menuItem?.name || "Item"}`;
              });
            }
          }
        }
        
        const seed = parseInt(dbOrder.id.substring(0, 2), 16) || 1;
        const d1 = Number((1 + (seed % 20) / 10).toFixed(1));
        const d2 = Number((1 + ((seed * 3) % 40) / 10).toFixed(1));

        return {
          id: dbOrder.id.substring(0, 8).toUpperCase(),
          orderDbId: dbOrder.id, // Store actual DB ID for transactions
          vendor: vendorRes.data?.shop_name || vendorRes.data?.name || "Restaurant",
          vendorAddress: vendorRes.data?.address || "Restaurant Address",
          vendorPhone: vendorRes.data?.phone || "+91 99999 99999",
          customer: "Customer",
          customerPhone: dbOrder.customer_phone || "+91 88888 88888",
          customerAddress: dbOrder.delivery_address || "Customer Delivery Location",
          landmark: dbOrder.special_instructions || "N/A",
          distance: d1,
          distance2: d2,
          totalDistance: Number((d1 + d2).toFixed(1)),
          earnings: dbOrder.delivery_fee || 40,
          items: itemsCount || 1,
          itemsList: itemsList.length > 0 ? itemsList : ["Items hidden"],
          time: `${Math.round(d1 * 4)} mins`,
          time2: `${Math.round(d2 * 5)} mins`,
          estCompletion: Math.round((d1 + d2) * 5),
          priority: (dbOrder.total_amount > 500) ? "high" : "normal",
          peakMultiplier: 1.0,
          specialInstructions: dbOrder.special_instructions || "",
          otp: Math.floor(1000 + (seed * 7) % 9000).toString(),
          type: "food",
          expiresAt: expirationTime, // 5 minute expiration
          isSnoozed: false,
        } as OrderWithTiming;
      }));
      
      // Filter out orders that are snoozed for this rider
      const now2 = Date.now();
      const filteredOrders = mappedOrders.filter(o => {
        if (o.isSnoozed && o.snoozeUntil && now2 < o.snoozeUntil) {
          return false; // Skip snoozed orders
        }
        return true;
      });
      
      setPendingOrders(filteredOrders);
    }
    
    fetchRealOrders();
    
    const channel = supabase
      .channel('rider-orders-dash')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchRealOrders();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOnline, supabase]);

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
      // Order expired - it will be handled by database for user notification
      handleDecline(selectedOrder.id);
    }
  };

  // Check for expired orders periodically
  useEffect(() => {
    const checkExpired = setInterval(async () => {
      const now = Date.now();
      setPendingOrders(prev => {
        const filtered = prev.filter(o => {
          // Remove orders that have been accepted by other riders (expired)
          if (o.expiresAt && now > o.expiresAt + 5000) { // 5 sec grace period
            return false;
          }
          return true;
        });
        return filtered;
      });
    }, 5000);
    
    return () => clearInterval(checkExpired);
  }, []);

  // Low battery warning
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
          if (battery.level <= 0.2) {
            setShowLowBattery(true);
          }
        });
      });
    }
  }, []);

  // Live earnings counter when delivering
  useEffect(() => {
    if (currentOrder && (deliveryStep === "delivering" || deliveryStep === "picking_up")) {
      const interval = setInterval(() => {
        setLiveEarnings(prev => prev + 1);
      }, 30000); // Add ₹1 every 30 seconds while on delivery
      return () => clearInterval(interval);
    }
  }, [currentOrder, deliveryStep]);

  const clearAllPendingOrders = async () => {
    if (!confirm("This will delete ALL pending orders from the database. This is intended for testing only. Continue?")) return;
    
    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .is("rider_id", null)
        .in("status", ["pending"]);
      
      if (error) throw error;
      alert("Successfully cleared all pending orders.");
      setPendingOrders([]);
    } catch (err: any) {
      alert("Error clearing orders: " + err.message);
    }
  };

  const handleAccept = async (order: OrderWithTiming) => {
    // Try to accept via atomic database function
    if (order.orderDbId && riderId) {
      try {
        const { data: success, error } = await supabase.rpc('accept_order_as_rider', {
          p_order_id: order.orderDbId,
          p_rider_id: riderId
        });
        
        if (!success || error) {
          // Order was already taken by another rider
          setOrderTakenByOther(true);
          setTimeout(() => {
            setOrderTakenByOther(false);
            setPendingOrders(prev => prev.filter(o => o.id !== order.id));
            setSelectedOrder(null);
          }, 2000);
          return;
        }
      } catch (e) {
        console.log("RPC not available, using fallback");
      }
    }
    
    // Fallback: directly update order
    if (order.orderDbId) {
      const { error } = await supabase
        .from("orders")
        .update({ 
          rider_id: riderId, 
          status: 'accepted', 
          accepted_at: new Date().toISOString() 
        })
        .eq("id", order.orderDbId)
        .is("rider_id", null); // Only if no rider assigned
        
      if (error) {
        // Order already taken
        setOrderTakenByOther(true);
        setTimeout(() => {
          setOrderTakenByOther(false);
          setPendingOrders(prev => prev.filter(o => o.id !== order.id));
          setSelectedOrder(null);
        }, 2000);
        return;
      }
    }
    
    setPendingOrders(pendingOrders.filter(o => o.id !== order.id));
    setCurrentOrder(order);
    setSelectedOrder(null);
    setCountdown(300); // Reset timer for next order
    
    if (order.type === "multi_stop") {
      setDeliveryStep("picking_up");
    } else {
      setDeliveryStep("shopping");
    }
  };

  const handleDecline = (orderId: string) => {
    setPendingOrders(pendingOrders.filter(o => o.id !== orderId));
    setSelectedOrder(null);
    setShowSkipModal(false);
    setCountdown(300); // Reset to 5 minutes
  };

  const handleSkip = (order: OrderWithTiming) => {
    handleSnooze(order);
  };

  const handleCallCustomer = () => {
    setShowCallModal(true);
  };

  const handleStartChat = () => {
    setShowChatModal(true);
  };

  const handleSendMessage = async () => {
    if (chatMessage.trim() && currentOrder) {
      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("chat_messages").insert({
          order_id: currentOrder.id,
          sender_id: user.id,
          sender_type: "rider",
          message: chatMessage.trim(),
        });
      }
      
      // Add to local display
      setChatHistory([...chatHistory, { from: "you", text: chatMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setChatMessage("");
    }
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
      handleComplete();
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
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setIsOnline(!isOnline);
              alert(isOnline ? "You're now OFFLINE. You won't receive new orders." : "You're now ONLINE. Ready to receive orders!");
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${isOnline ? "bg-green-100 border-green-300" : "bg-slate-100 border-slate-300"}`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-slate-400"}`}></span>
            <span className={`font-bold text-[10px] ${isOnline ? "text-green-700" : "text-slate-500"}`}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </button>
          <button 
            onClick={() => alert("Emergency: Calling MIIAM Support...")}
            className="p-2 bg-red-50 rounded-full animate-pulse" 
            title="Emergency SOS"
          >
            <span className="material-symbols-outlined text-red-500">emergency</span>
          </button>
          <button 
            onClick={() => setShowQuestModal(true)}
            className="p-2 bg-amber-50 rounded-full relative" 
            title="Daily Quests"
          >
            <span className="material-symbols-outlined text-amber-500">local_fire_department</span>
            {streakDays > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {streakDays}
              </span>
            )}
          </button>
          <Link href="/rider/analytics" className="p-2 bg-blue-50 rounded-full" title="Analytics">
          <Link href="/rider/achievements" className="p-2 bg-amber-50 rounded-full" title="Achievements">
            <span className="material-symbols-outlined text-amber-500">emoji_events</span>
          </Link>
          <Link href="/rider/account" className="p-2">
            <span className="material-symbols-outlined text-slate-600">person</span>
          </Link>
        </div>
      </header>

      {/* Snooze Message Toast */}
      {snoozeMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">snooze</span>
          <span className="text-sm font-medium">{snoozeMessage}</span>
        </div>
      )}

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
                  <div className="relative w-12 h-12">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="24" cy="24" fill="transparent" r="22" stroke="rgba(255,255,255,0.3)" strokeWidth="3"></circle>
                      <circle cx="24" cy="24" fill="transparent" r="22" stroke="white" strokeWidth="3" strokeDasharray={`${(300 - countdown) / 300 * 138} 138`}></circle>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-black text-sm">
                      {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] opacity-80">NEW ORDER • 5 MIN</p>
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
                  {/* Customer Rating Preview */}
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    {customerRating}
                  </span>
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
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl text-sm"
                >
                  Decline
                </button>
                <button 
                  onClick={() => handleAccept(pendingOrders[0])}
                  className="flex-[2] py-3 bg-[#0b50d5] text-white font-black rounded-xl text-sm shadow-lg"
                >
                  ACCEPT ORDER
                </button>
              </div>
              {/* Order taken by other rider alert */}
              {orderTakenByOther && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 text-center max-w-xs mx-4">
                    <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
                    <p className="font-bold text-lg mt-3">Order Taken!</p>
                    <p className="text-sm text-slate-500 mt-1">Another rider accepted this order first.</p>
                  </div>
                </div>
              )}
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
                    <button 
                      onClick={() => alert("Location shared with customer!")}
                      className="w-full mt-3 py-2 bg-green-100 text-green-700 font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">share_location</span>
                      Share Live Location
                    </button>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentOrder.stops[currentStopIndex].address)}`}
                      target="_blank"
                      className="w-full mt-2 py-3 bg-[#0b50d5] text-white font-bold rounded-xl flex items-center justify-center gap-2"
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
                    <button 
                      onClick={() => alert("Location shared with customer!")}
                      className="w-full mt-3 py-2 bg-green-100 text-green-700 font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">share_location</span>
                      Share Live Location
                    </button>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentOrder.customerAddress)}`}
                      target="_blank"
                      className="w-full mt-2 py-3 bg-[#0b50d5] text-white font-bold rounded-xl flex items-center justify-center gap-2"
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
                    <p className="text-sm text-slate-500 mb-4">Ready to complete delivery</p>
                    <button 
                      onClick={handleComplete}
                      className="w-full py-4 bg-green-500 text-white font-black rounded-xl"
                    >
                      COMPLETE DELIVERY
                    </button>
                  </div>
                )}

              {/* Cancel Modal */}
              {showCancelModal && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl w-full max-w-sm p-4">
                    <h3 className="font-bold text-lg mb-4">Decline Order</h3>
                    <p className="text-sm text-slate-500 mb-4">Select a reason for declining:</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {cancelReasons.map((reason) => (
                        <button
                          key={reason}
                          onClick={() => {
                            handleDecline(pendingOrders[0].id);
                            setShowCancelModal(false);
                          }}
                          className="w-full text-left p-3 bg-slate-50 rounded-xl hover:bg-slate-100 text-sm"
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setShowCancelModal(false)}
                      className="w-full mt-4 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Quest Modal */}
              {showQuestModal && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl w-full max-w-sm p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Daily Quests</h3>
                      <button onClick={() => setShowQuestModal(false)}>
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                    
                    {/* Streak */}
                    <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white p-4 rounded-xl mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                        <span className="font-bold">{streakDays} Day Streak!</span>
                      </div>
                      <p className="text-xs opacity-80">Complete daily quests to maintain your streak</p>
                    </div>
                    
                    {/* Quests */}
                    <div className="space-y-3">
                      {dailyQuests.map((quest) => (
                        <div key={quest.id} className="p-3 bg-slate-50 rounded-xl">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm">{quest.title}</span>
                            <span className="text-green-600 font-bold text-sm">+₹{quest.bonus}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full" 
                              style={{ width: `${(quest.current / quest.target) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{quest.current}/{quest.target} completed</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Low Battery Warning */}
              {showLowBattery && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                  <span className="material-symbols-outlined text-sm">battery_alert</span>
                  <span className="text-sm font-medium">Low Battery ({batteryLevel}%)</span>
                  <button onClick={() => setShowLowBattery(false)}>
                    <span className="material-symbols-outlined text-sm">close</span>
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
        <div className="fixed top-20 left-4 z-20 space-y-2">
          <div className="bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg">
            <p className="text-[10px] text-slate-400">TODAY'S EARNINGS</p>
            <p className="font-black text-xl text-green-600">₹{todayEarnings + liveEarnings}</p>
            {currentOrder && (deliveryStep === "delivering" || deliveryStep === "picking_up") && (
              <p className="text-[8px] text-orange-500 animate-pulse">+₹{liveEarnings} (Live)</p>
            )}
          </div>
          <div className="bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-green-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            <div>
              <p className="text-[8px] text-slate-400">CASH</p>
              <p className="text-xs font-bold">₹{cashCollected} <span className="text-slate-400">/ ₹{cashPending}</span></p>
            </div>
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
                <button onClick={() => setShowChatModal(false)}>
                  <span className="material-symbols-outlined text-slate-600">arrow_back</span>
                </button>
                <div className="w-10 h-10 bg-[#0b50d5]/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#0b50d5]">person</span>
                </div>
                <div>
                  <p className="font-bold">{currentOrder?.customer || "Customer"}</p>
                  <p className="text-[10px] text-green-500">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleCallCustomer}
                  className="p-2 text-green-500 hover:bg-green-50 rounded-full"
                  title="Call Customer"
                >
                  <span className="material-symbols-outlined">call</span>
                </button>
                <button onClick={() => setShowChatModal(false)}>
                  <span className="material-symbols-outlined text-slate-600">close</span>
                </button>
              </div>
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
              {/* Quick Message Shortcuts */}
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {["I'm on my way", "I've arrived", "Item not available", "Traffic delay", "Contacting support"].map((msg) => (
                  <button
                    key={msg}
                    onClick={() => setChatMessage(msg)}
                    className="flex-shrink-0 px-3 py-1.5 bg-[#0b50d5]/10 text-[#0b50d5] rounded-full text-xs font-bold"
                  >
                    {msg}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <button className="p-2 text-slate-400 hover:text-[#0b50d5] hover:bg-slate-100 rounded-full" title="Attach file">
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <button className="p-2 text-slate-400 hover:text-[#0b50d5] hover:bg-slate-100 rounded-full" title="Voice message">
                  <span className="material-symbols-outlined">mic</span>
                </button>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm"
                />
<button 
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  className="w-10 h-10 bg-[#0b50d5] text-white rounded-full flex items-center justify-center disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
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
                    Alerts are triggered when you are online and a new order arrives within your zone.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Developer Tools</p>
                <button 
                  onClick={clearAllPendingOrders}
                  className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete_sweep</span>
                  Clear All Pending Orders
                </button>
                <p className="text-[10px] text-slate-400 mt-2 text-center italic">Deletes all unassigned pending orders from database.</p>
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