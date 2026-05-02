"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const categories = [
  { id: "food", label: "Food", icon: "restaurant", color: "bg-orange-100", iconColor: "text-orange-600", offer: "20% OFF" },
  { id: "grocery", label: "Grocery", icon: "shopping_basket", color: "bg-green-100", iconColor: "text-green-600", offer: "FREE Delivery" },
  { id: "beauty", label: "Beauty", icon: "spa", color: "bg-pink-100", iconColor: "text-pink-600", offer: "₹100 OFF" },
  { id: "services", label: "Services", icon: "handyman", color: "bg-blue-100", iconColor: "text-blue-600", offer: "Flat ₹200 OFF" },
  { id: "pharmacy", label: "Pharmacy", icon: "medication", color: "bg-purple-100", iconColor: "text-purple-600", offer: "15% OFF" },
  { id: "flowers", label: "Flowers", icon: "local_florist", color: "bg-rose-100", iconColor: "text-rose-600", offer: null },
];

const offers = [
  { id: "o1", title: "First Order Discount", subtitle: "Get 50% OFF on first order", color: "from-orange-500 to-red-500", badge: "NEW USER" },
  { id: "o2", title: "Free Delivery", subtitle: "On orders above ₹199", color: "from-green-500 to-emerald-500", badge: "FREE DELIVERY" },
  { id: "o3", title: "Flat ₹100 OFF", subtitle: "On orders above ₹300", color: "from-blue-500 to-indigo-500", badge: "FLAT OFF" },
  { id: "o4", title: "MIIAM+ Exclusive", subtitle: "Get 30% OFF with MIIAM+", color: "from-purple-500 to-pink-500", badge: "MIIAM+" },
];

const activeOrder = {
  id: "a1",
  vendor: "Biryani House",
  items: "Chicken Biryani x2",
  status: "preparing",
  eta: "25 mins",
  total: 498,
  steps: [
    { id: 1, label: "Order Placed", time: "12:30 PM", completed: true },
    { id: 2, label: "Preparing", time: "12:35 PM", completed: true },
    { id: 3, label: "Out for Delivery", time: "12:50 PM", completed: false },
    { id: 4, label: "Delivered", time: "", completed: false },
  ],
};

const nearbyRestaurants = [
  { id: "r1", name: "Biryani House", rating: 4.8, reviews: "2.3k", distance: "1.2 km", deliveryTime: "25-35 min", cuisine: "Biryani, North Indian", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80", offer: "20% OFF" },
  { id: "r2", name: "Pizza Paradise", rating: 4.6, reviews: "1.8k", distance: "2.5 km", deliveryTime: "30-40 min", cuisine: "Pizza, Italian", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80", offer: "FREE DELIVERY" },
  { id: "r3", name: "Chinese Corner", rating: 4.7, reviews: "1.2k", distance: "0.8 km", deliveryTime: "20-30 min", cuisine: "Chinese, Asian", image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&q=80", offer: null },
  { id: "r4", name: "Burger Bliss", rating: 4.5, reviews: "987", distance: "3.1 km", deliveryTime: "25-35 min", cuisine: "Burgers, American", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80", offer: "₹100 OFF" },
];

const notifications = [
  { id: "n1", type: "order", title: "Order Delivered", message: "Your order from Biryani House has been delivered. Rate your experience!", time: "2 min ago", icon: "check_circle", color: "text-green-500" },
  { id: "n2", type: "offer", title: "50% OFF on Pizza", message: "Get flat 50% off on all pizza orders today. Use code PIZZA50", time: "1 hour ago", icon: "local_offer", color: "text-orange-500" },
  { id: "n3", type: "promo", title: "Free Delivery", message: "Free delivery on orders above ₹199. Limited time offer!", time: "3 hours ago", icon: "delivery_dining", color: "text-blue-500" },
  { id: "n4", type: "order", title: "Order Confirmed", message: "Your order #12345 has been confirmed and will be delivered in 25 mins", time: "5 hours ago", icon: "receipt", color: "text-purple-500" },
  { id: "n5", type: "promo", title: "MIIAM+ Special", message: "Upgrade to MIIAM+ and get 20% off on every order!", time: "Yesterday", icon: "workspace_premium", color: "text-amber-500" },
];

export default function HomePage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [currentOffer, setCurrentOffer] = useState(0);
  const [location, setLocation] = useState("Select Location");
  const [orderBubbleExpanded, setOrderBubbleExpanded] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  useEffect(() => {
    async function loadUserAndProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        if (profileData?.full_name) {
          setUser(prev => ({ ...prev, profile_name: profileData.full_name }));
        }
      }
    }
    loadUserAndProfile();
  }, [supabase]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      if (showNotifications) {
        setShowNotifications(false);
      }
    };
    
    if (showNotifications) {
      window.addEventListener("popstate", handlePopState);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.body.style.overflow = "unset";
    };
  }, [showNotifications]);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      const highAccuracyOptions = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      };

      const handleLocationSuccess = async (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'User-Agent': 'MIIAM/1.0' } }
          );
          const data = await response.json();
          const addr = data.address;
          
          const preciseLocation = buildPreciseAddress(addr, data.display_name);
          setLocation(preciseLocation);
        } catch {
          setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        
        setIsLoadingLocation(false);
        setShowLocationModal(false);
      };

      const handleLocationError = (error: GeolocationPositionError) => {
        setIsLoadingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location permission denied. Please enable location access in browser settings.");
        } else if (error.code === error.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(handleLocationSuccess, handleLocationError, {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 300000,
          });
        } else {
          alert("Unable to get location. Please enter manually.");
        }
      };

      navigator.geolocation.getCurrentPosition(handleLocationSuccess, handleLocationError, highAccuracyOptions);
    } else {
      setIsLoadingLocation(false);
      alert("Geolocation not supported on this device");
    }
  };

  const buildPreciseAddress = (addr: any, displayName?: string): string => {
    const parts: string[] = [];
    
    if (addr.house_number) parts.push(addr.house_number);
    if (addr.road || addr.street) parts.push(addr.road || addr.street);
    if (addr.neighbourhood) parts.push(addr.neighbourhood);
    else if (addr.suburb) parts.push(addr.suburb);
    if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
    if (addr.state) parts.push(addr.state);
    
    if (parts.length > 0) return parts.join(", ");
    if (displayName) return displayName.split(", ").slice(0, 3).join(", ");
    return "Current Location";
  };

  const handleManualLocation = () => {
    if (manualLocation.trim()) {
      setLocation(manualLocation.trim());
      setShowLocationModal(false);
      setManualLocation("");
    }
  };

  const hour = new Date().getHours();
  let greeting = "Good evening";
  let timeIcon = "🌙";
  if (hour < 12) { greeting = "Good morning"; timeIcon = "☀️"; }
  else if (hour < 18) { greeting = "Good afternoon"; timeIcon = "🌤️"; }

  const userName = user?.profile_name || user?.email?.split("@")[0] || "User";

  // Auto-rotate offers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentOffer((prev) => (prev + 1) % offers.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#fff8f7] pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#5c403d]">{greeting} {timeIcon}</p>
              <h1 className="text-2xl font-black text-[#281716] capitalize">{userName}</h1>
            </div>
            <button 
              onClick={() => { setShowNotifications(!showNotifications); setUnreadCount(0); }}
              className="relative w-10 h-10 bg-[#fff4f4] rounded-full flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[#ba001c]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[10px] text-white font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Location Quick Switch */}
        <div className="px-4 pb-3">
          <button 
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-2 bg-[#fff4f4] px-4 py-2.5 rounded-xl w-full hover:bg-[#ffecee] transition-colors"
          >
            <span className="material-symbols-outlined text-[#ba001c]">location_on</span>
            <div className="flex-1 text-left">
              <p className="text-xs text-[#5c403d]">Delivering to</p>
              <p className="font-bold text-[#281716] text-sm">{location}</p>
            </div>
            <span className="material-symbols-outlined text-[#5c403d]">expand_more</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <Link href="/app/search" className="flex items-center w-full bg-gray-100 rounded-xl px-4 py-3 hover:bg-gray-200 transition-colors">
            <span className="material-symbols-outlined text-gray-400">search</span>
            <span className="ml-3 text-gray-400 text-sm">Search for food, restaurants...</span>
          </Link>
        </div>
      </header>

      {/* Offers Carousel */}
      <div className="px-4 py-4">
        <Link href="/app/explore">
          <div className={`relative h-28 rounded-2xl overflow-hidden bg-gradient-to-r ${offers[currentOffer].color}`}>
            <div className="absolute top-3 left-4">
              <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-1 rounded">
                {offers[currentOffer].badge}
              </span>
            </div>
            <div className="absolute inset-0 flex items-center justify-between px-6">
              <div>
                <h3 className="text-xl font-black text-white">{offers[currentOffer].title}</h3>
                <p className="text-white/90 text-sm mt-1">{offers[currentOffer].subtitle}</p>
              </div>
              <span className="material-symbols-outlined text-white/50 text-6xl">arrow_forward</span>
            </div>
            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {offers.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentOffer ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          </div>
        </Link>
      </div>

      {/* Floating Order Bubble */}
      {activeOrder && (
        <div className="fixed bottom-20 right-4 z-40">
          {/* Expanded Order Details */}
          {orderBubbleExpanded && (
            <div className="absolute bottom-16 right-0 w-72 bg-white rounded-2xl shadow-2xl p-4 mb-2 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-orange-600">delivery_dining</span>
                  </div>
                  <div>
                    <p className="font-bold text-[#281716]">{activeOrder.vendor}</p>
                    <p className="text-xs text-[#5c403d]">{activeOrder.items}</p>
                  </div>
                </div>
                <button onClick={() => setOrderBubbleExpanded(false)} className="text-gray-400">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              {/* Progress Steps */}
              <div className="space-y-3">
                {activeOrder.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-500' : index === 2 ? 'bg-orange-500 animate-pulse' : 'bg-gray-200'
                    }`}>
                      {step.completed ? (
                        <span className="material-symbols-outlined text-white text-sm">check</span>
                      ) : index === 2 ? (
                        <span className="material-symbols-outlined text-white text-xs">local_shipping</span>
                      ) : (
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${step.completed ? 'text-[#281716]' : index === 2 ? 'text-orange-600' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {step.time && <p className="text-xs text-gray-400">{step.time}</p>}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* ETA */}
              <div className="mt-4 p-3 bg-orange-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#5c403d]">Estimated Delivery</p>
                  <p className="font-bold text-orange-600">{activeOrder.eta}</p>
                </div>
                <Link href="/app/orders" className="text-[#ba001c] font-bold text-sm">
                  Track Order →
                </Link>
              </div>
            </div>
          )}
          
          {/* Bubble Button */}
          <button
            onClick={() => setOrderBubbleExpanded(!orderBubbleExpanded)}
            className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${
              orderBubbleExpanded ? 'bg-[#ba001c]' : 'bg-white'
            }`}
          >
            <span className={`material-symbols-outlined text-2xl ${
              orderBubbleExpanded ? 'text-white' : 'text-orange-600'
            }`}>
              delivery_dining
            </span>
          </button>
        </div>
      )}

      {/* Categories with Offers */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-bold text-[#281716] mb-3">Categories</h2>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/app/${cat.id}`} className="relative">
              <div className={`${cat.color} rounded-2xl p-4 text-center shadow-sm`}>
                <div className={`w-12 h-12 rounded-xl bg-white mx-auto flex items-center justify-center mb-2`}>
                  <span className={`material-symbols-outlined ${cat.iconColor} text-xl`}>{cat.icon}</span>
                </div>
                <p className="font-bold text-[#281716] text-sm">{cat.label}</p>
              </div>
              {cat.offer && (
                <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full">
                  {cat.offer}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Nearby Popular Restaurants */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#281716]">Nearby Popular 🔥</h2>
          <Link href="/app/food" className="text-xs font-bold text-[#ba001c]">See All</Link>
        </div>
        <div className="space-y-3">
          {nearbyRestaurants.map((restaurant) => (
            <Link key={restaurant.id} href={`/app/vendor/${restaurant.id}`} className="block bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="flex">
                <div className="w-28 h-28 flex-shrink-0">
                  <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-[#281716]">{restaurant.name}</h3>
                    <div className="flex items-center gap-1 bg-green-100 px-1.5 py-0.5 rounded">
                      <span className="text-xs font-bold text-green-700">{restaurant.rating}</span>
                      <span className="text-green-700 text-xs">★</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#5c403d] mt-1">{restaurant.cuisine}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#5c403d]">
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {restaurant.deliveryTime}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {restaurant.distance}
                    </span>
                  </div>
                  {restaurant.offer && (
                    <div className="mt-2 inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded">
                      {restaurant.offer}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* MIIAM+ Banner */}
      <div className="px-4 pb-4">
        <Link href="/app/subscription" className="block bg-gradient-to-r from-[#281716] to-[#4d212a] rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-bold text-amber-400">MIIAM+</span>
            </div>
            <h3 className="text-lg font-black">Unlock Unlimited Benefits</h3>
            <p className="text-white/80 text-xs mt-1">Free delivery • 20% off • Priority support</p>
            <span className="inline-block mt-3 bg-white text-[#ba001c] px-4 py-1.5 rounded-full text-xs font-bold">
              Subscribe for ₹99/month
            </span>
          </div>
        </Link>
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:w-96 rounded-t-3xl md:rounded-3xl p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-[#281716]">Select Location</h2>
              <button onClick={() => setShowLocationModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-600">close</span>
              </button>
            </div>

            {/* GPS Button */}
            <button
              onClick={getCurrentLocation}
              disabled={isLoadingLocation}
              className="w-full flex items-center gap-4 p-4 border-2 border-[#ba001c] rounded-xl mb-4 hover:bg-[#fff4f4] transition-colors"
            >
              <div className="w-12 h-12 bg-[#ba001c]/10 rounded-xl flex items-center justify-center">
                {isLoadingLocation ? (
                  <div className="w-6 h-6 border-2 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[#ba001c]">my_location</span>
                )}
              </div>
              <div className="text-left">
                <p className="font-bold text-[#281716]">Use Current Location</p>
                <p className="text-xs text-[#5c403d]">Automatically detect via GPS</p>
              </div>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Manual Entry */}
            <div>
              <p className="font-bold text-[#281716] mb-2">Enter Location Manually</p>
              <input
                type="text"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                placeholder="Enter your area, street, landmark..."
                className="w-full px-4 py-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-[#ba001c] outline-none"
              />
              <button
                onClick={handleManualLocation}
                disabled={!manualLocation.trim()}
                className="w-full mt-4 bg-[#ba001c] text-white py-3 rounded-xl font-bold hover:bg-[#a00018] transition-colors disabled:opacity-50"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="fixed inset-0 z-50" onClick={() => setShowNotifications(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-xl font-black text-[#281716]">Notifications</h2>
              <button 
                onClick={() => setShowNotifications(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-gray-600">close</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button className="flex-1 py-3 text-sm font-bold text-[#ba001c] border-b-2 border-[#ba001c]">
                All
              </button>
              <button className="flex-1 py-3 text-sm font-bold text-gray-400">
                Orders
              </button>
              <button className="flex-1 py-3 text-sm font-bold text-gray-400">
                Offers
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto h-[calc(100vh-140px)]">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0`}>
                      <span className={`material-symbols-outlined ${notif.color}`}>{notif.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <p className="font-bold text-[#281716] text-sm">{notif.title}</p>
                        <span className="text-[10px] text-gray-400">{notif.time}</span>
                      </div>
                      <p className="text-xs text-[#5c403d] mt-1">{notif.message}</p>
                      {notif.type === "offer" && (
                        <button className="mt-2 text-xs font-bold text-[#ba001c]">
                          Apply Now →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {notifications.length === 0 && (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-300">notifications_off</span>
                  <p className="text-gray-500 mt-2">No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}