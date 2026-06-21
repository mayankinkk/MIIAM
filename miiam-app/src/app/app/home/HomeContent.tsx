"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { useLocationStore } from "@/lib/store/locationStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useLanguageStore, type Language } from "@/lib/store/languageStore";
import { HomeSkeleton } from "@/components/Skeleton";
import BlurImage from "@/components/BlurImage";
import { NetworkError } from "@/components/ui/EmptyStates";
import { withRetry } from "@/lib/retry";
import logger from "@/lib/logger";
import PrintCostCalculator from "@/components/print/PrintCostCalculator";



import type { User } from "@supabase/supabase-js";

interface HomeVendor {
  id: string;
  shop_name: string;
  name?: string;
  cuisine?: string;
  image_url?: string;
  cover_image_url?: string;
  logo_url?: string;
  rating?: string | number;
  review_count?: number;
  delivery_time_min?: number;
  delivery_time_max?: number;
  delivery_time_minutes?: number;
  delivery_time?: string;
  delivery_charge?: number | string;
  min_order_amount?: string;
  is_new?: boolean;
  is_featured?: boolean;
  is_promoted?: boolean;
  status?: string;
  type?: string;
  pincode?: string;
  city?: string;
  created_at?: string;
}

interface HomeNotification {
  id: string;
  user_id: string;
  title: string;
  body?: string;
  message?: string;
  type: "order" | "promo" | "offer" | "info" | "system" | "rider";
  read: boolean;
  created_at: string;
}

interface OrderStep {
  id: number;
  label: string;
  completed: boolean;
  time: string;
}

interface ActiveOrder {
  id: string;
  vendor: string;
  items: string;
  steps: OrderStep[];
  eta: string;
}

interface UserProfile extends User {
  profile_name?: string;
}

export default function HomePage() {

  const supabase = useMemo(() => createClient(), []);
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: "food", label: t.nav.food, icon: "restaurant", color: "bg-orange-100", iconColor: "text-orange-600", offer: "20% OFF" },
    { id: "grocery", label: t.nav.groceries, icon: "shopping_basket", color: "bg-green-100", iconColor: "text-green-600", offer: t.home.offerFreeDeliveryBadge },
    { id: "beauty", label: t.nav.beauty, icon: "spa", color: "bg-pink-100", iconColor: "text-pink-600", offer: "₹100 OFF" },
    { id: "services", label: t.nav.services, icon: "handyman", color: "bg-blue-100", iconColor: "text-blue-600", offer: "Flat ₹200 OFF" },
    { id: "printing", label: t.nav.printing, icon: "print", color: "bg-indigo-100", iconColor: "text-indigo-600", offer: null },
  ];

  const offers = [
    { id: "o1", title: t.home.offerFirstOrder, subtitle: t.home.offerFirstOrderDesc, color: "from-orange-500 to-red-500", badge: t.home.offerNewUser },
    { id: "o2", title: t.home.offerFreeDelivery, subtitle: t.home.offerFreeDeliveryDesc, color: "from-green-500 to-emerald-500", badge: t.home.offerFreeDeliveryBadge },
    { id: "o3", title: t.home.offerFlat100, subtitle: t.home.offerFlat100Desc, color: "from-blue-500 to-indigo-500", badge: t.home.offerFlatOff },
  ];

  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentOffer, setCurrentOffer] = useState(0);
  const locationStore = useLocationStore();
  const [location, setLocation] = useState(locationStore.displayAddress || t.home.selectLocation);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [orderBubbleExpanded, setOrderBubbleExpanded] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [manualPincode, setManualPincode] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifTab, setNotifTab] = useState<"all" | "orders" | "offers">("all");
  const [notifications, setNotifications] = useState<HomeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<HomeVendor[]>([]);
  const [featuredRestaurants, setFeaturedRestaurants] = useState<HomeVendor[]>([]);
  const [spotlightRestaurant, setSpotlightRestaurant] = useState<HomeVendor | null>(null);
  const [localServiceable, setLocalServiceable] = useState(true);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const userPincode = locationStore.pincode;

  useEffect(() => {
    // Check if redirecting from another page requesting location change
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("selectLocation") === "true") {
        setShowLocationModal(true);
      }
    }

    async function checkAndLoad() {
      const { pincode } = locationStore;

      const [userResult, vendorsResult] = await Promise.all([
        supabase.auth.getUser(),
        pincode
          ? supabase.from("vendors").select("id, shop_name, name, cuisine, image_url, cover_image_url, rating, review_count, delivery_time_min, delivery_time_max, delivery_time_minutes, delivery_time, delivery_charge, min_order_amount, is_new, is_featured, is_promoted, status, type, pincode, city, created_at").order("created_at", { ascending: false }).limit(50)
          : Promise.resolve({ data: null }),
      ]);

      const { user } = userResult.data;
      if (!user) return;
      const [profileResult, notifsResult] = await Promise.all([
        supabase.from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      setUser({
        ...user,
        profile_name: profileResult.data?.full_name || user.user_metadata?.full_name || user.user_metadata?.name
      });

      if (notifsResult.data) {
        setNotifications(notifsResult.data);
        setUnreadCount(notifsResult.data.filter((n: HomeNotification) => !n.read).length);
      }

      if (!pincode) {
        setLocalServiceable(false);
        setNearbyRestaurants([]);
        setFeaturedRestaurants([]);
        setSpotlightRestaurant(null);
        setLoading(false);
        return;
      }
      
      setCheckingPincode(true);
      
      const vendors = vendorsResult.data;
      if (vendors) {
        const userCity = locationStore.city?.toLowerCase() || "";
        
        // Strict filter: pincode match OR city match only
        const local = vendors.filter((v: HomeVendor) => {
          const pincodeMatch = v.pincode === pincode;
          const cityMatch = userCity && v.city?.toLowerCase() === userCity;
          return pincodeMatch || cityMatch;
        });
        
        // Mark serviceable only if we found local vendors
        setLocalServiceable(local.length > 0);
        
        // Show ONLY local vendors — empty array if none found
        setNearbyRestaurants(local);
        setFeaturedRestaurants(local.filter((v: HomeVendor) => v.is_featured || v.is_promoted).slice(0, 6));
        setSpotlightRestaurant(local.find((v: HomeVendor) => v.is_featured) || null);
      }
      setCheckingPincode(false);
      setLoading(false);
    }
    withRetry(checkAndLoad).catch((e) => {
      logger.error({ err: e }, "Home page data load error");
      setDataError("Couldn't load recommendations. Pull down to try again.");
      setLoading(false);
    });

      async function fetchActiveOrder() {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { data: active } = await supabase
            .from("orders")
            .select("id, status, total_amount, placed_at, vendors(shop_name)")
            .eq("user_id", user.id)
            .in("status", ["pending", "accepted", "preparing", "ready_for_pickup", "picking_up", "on_the_way"])
            .order("placed_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (active) {
            setActiveOrder({
              id: active.id,
              vendor: (Array.isArray(active.vendors) ? active.vendors[0] : active.vendors)?.shop_name || "Restaurant",
              items: t.home.orderInProgress,
              steps: [
                { id: 1, label: t.home.orderPlaced, completed: true, time: new Date(active.placed_at).toLocaleTimeString() },
                { id: 2, label: t.home.accepted, completed: ["accepted", "preparing", "ready_for_pickup", "picking_up", "on_the_way"].includes(active.status), time: "" },
                { id: 3, label: t.home.onTheWay, completed: ["on_the_way"].includes(active.status), time: "" },
              ],
              eta: active.status === "on_the_way" ? "5-10 min" : "20-30 min",
            });
          }
        } catch (err) {
          logger.error({ err: err }, "Failed to fetch active order");
        }
      }
      fetchActiveOrder();

      // Set up Realtime subscription to get live notification updates
    const channelRef = { current: null as ReturnType<typeof supabase.channel> | null };
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
      if (!user) return;
      const channel = supabase
        .channel(`notifications-${user.id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        }, (payload: { new: HomeNotification }) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        })
        .subscribe();
      channelRef.current = channel;
    });

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [locationStore.pincode, locationStore.city, retryKey]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: t.home.goodMorning, icon: "☀️" };
    if (hour < 18) return { text: t.home.goodAfternoon, icon: "🌤️" };
    return { text: t.home.goodEvening, icon: "🌙" };
  };

  const [greeting, setGreeting] = useState(() => getGreeting().text);
  const [timeIcon, setTimeIcon] = useState(() => getGreeting().icon);

  useEffect(() => {
    const { text, icon } = getGreeting();
    setGreeting(text);
    setTimeIcon(icon);
  }, [t]);

  const resolvePincodeToArea = async (pin: string): Promise<{ area: string; city: string; state: string }> => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const area = po.Name || po.Division || "";
        const city = po.District || po.Division || "";
        const state = po.State || "";
        return { area, city, state };
      }
    } catch { /* ignore */ }
    return { area: "", city: "", state: "" };
  };

  const handleManualLocation = async () => {
    const pin = manualPincode.trim();
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setPincodeError(t.home.invalidPincode);
      return;
    }
    setPincodeError("");
    setIsLoadingLocation(true);

    const { area, city, state } = await resolvePincodeToArea(pin);
    const displayName = area
      ? state ? `${area}, ${state}` : area
      : `PIN: ${pin}`;

    setLocation(displayName);
    locationStore.setLocation({
      pincode: pin,
      city: city || undefined,
      state: state || undefined,
      displayAddress: displayName,
    });
    setIsLoadingLocation(false);
    setShowLocationModal(false);
    setManualPincode("");
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setPincodeError(t.home.locationNotSupported);
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const address = data.address || {};
          const pincode = address.postcode || "";

          if (pincode) {
            // Resolve area name from the detected pincode
            const { area, city, state } = await resolvePincodeToArea(pincode);
            const displayName = area
              ? state ? `${area}, ${state}` : area
              : data.display_name?.split(",")[0] || `PIN: ${pincode}`;

            setLocation(displayName);
            locationStore.setLocation({
              pincode,
              lat: latitude,
              lng: longitude,
              city: city || address.city || address.town || null,
              state: state || undefined,
              displayAddress: displayName,
            });
          } else {
            const fallback = data.display_name?.split(",")[0] || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setLocation(fallback);
            locationStore.setLocation({
              lat: latitude,
              lng: longitude,
              displayAddress: fallback,
            });
          }
          setShowLocationModal(false);
        } catch {
          const fallback = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
          setLocation(fallback);
          locationStore.setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            displayAddress: fallback,
          });
          setShowLocationModal(false);
        }
        setIsLoadingLocation(false);
      },
      (error) => {
        setIsLoadingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setPincodeError(t.home.locationDenied);
        } else {
          setPincodeError(t.home.unableToDetect);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const userName = user?.profile_name || user?.email?.split("@")[0] || "User";

  // Auto-rotate offers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentOffer((prev) => (prev + 1) % offers.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  if (loading) return <HomeSkeleton />;

  if (dataError) {
    return (
      <div className="min-h-screen bg-background dark:bg-[var(--color-surface)] text-on-background flex items-center justify-center px-6 pb-24">
        <NetworkError onRetry={() => { setDataError(null); setLoading(true); setRetryKey((k) => k + 1); }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-[var(--color-surface)] text-on-background pb-24">
      {/* Header */}
      <header className="bg-surface-container dark:bg-[var(--color-surface-container-lowest)] border-b border-outline-variant/10 dark:border-[var(--color-border-subtle)] shadow-sm">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-on-surface-variant">{greeting} {timeIcon}</p>
              <h1 className="text-2xl font-black text-on-background capitalize">{userName}</h1>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                aria-label="Select language"
                className="bg-surface-container-high text-on-surface text-xs font-bold px-2 py-1.5 rounded-lg border border-outline-variant/20 focus:outline-none focus:border-primary"
              >
                <option value="en">EN</option>
                <option value="hi">HI</option>
                <option value="as">AS</option>
                <option value="bn">BN</option>
              </select>
              <button 
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              onClick={async () => { 
                setShowNotifications(!showNotifications);
                if (unreadCount > 0 && user) {
                  setUnreadCount(0);
                  void supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
                }
              }}
              className="relative w-10 h-10 bg-surface-container-high hover:bg-surface-container-highest transition-colors rounded-full flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-primary" aria-hidden="true">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-surface-container text-[10px] text-white font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            </div>
          </div>
        </div>

        {/* Location Quick Switch */}
        <div className="px-4 pb-3">
          <button 
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-2 bg-surface-container-high px-4 py-2.5 rounded-xl w-full hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-primary">location_on</span>
            <div className="flex-1 text-left">
              <p className="text-xs text-on-surface-variant">{t.home.deliveringTo}</p>
              <p className="font-bold text-on-surface text-sm">{location}</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <Link href="/app/search" className="flex items-center w-full bg-surface-container-high rounded-xl px-4 py-3 hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant/60">search</span>
            <span className="ml-3 text-on-surface-variant/60 text-sm">{t.home.searchPlaceholder}</span>
          </Link>
        </div>
      </header>

      {/* Offers Carousel */}
      <div className="px-4 py-4">
        <Link href="/app/explore">
          <div className={`relative h-28 rounded-2xl overflow-hidden bg-gradient-to-r ${offers[currentOffer].color}`}>
            <div className="absolute top-3 left-4">
              <span className="text-[10px] font-bold bg-[var(--color-surface-container-lowest)]/20 text-white px-2 py-1 rounded">
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
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentOffer ? 'bg-white' : 'bg-[var(--color-surface-container-lowest)]/40'}`} />
              ))}
            </div>
          </div>
        </Link>
      </div>

      {/* Floating Order Bubble */}
      {activeOrder && (
        <div className="fixed bottom-20 right-4 z-40"
          style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {/* Expanded Order Details */}
          {orderBubbleExpanded && (
            <div className="absolute bottom-16 right-0 w-72 bg-surface-container dark:bg-[var(--color-surface-container-lowest)] rounded-2xl border border-outline-variant/10 dark:border-[var(--color-border-subtle)] shadow-2xl p-4 mb-2 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-orange-600">delivery_dining</span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{activeOrder.vendor}</p>
                    <p className="text-xs text-on-surface-variant">{activeOrder.items}</p>
                  </div>
                </div>
                <button onClick={() => setOrderBubbleExpanded(false)} aria-label="Close order details" className="text-gray-400 w-11 h-11 flex items-center justify-center rounded-full">
                  <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>
              
              {/* Progress Steps */}
              <div className="space-y-3">
                {activeOrder.steps.map((step: OrderStep, index: number) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-500' : index === 2 ? 'bg-orange-500 animate-pulse' : 'bg-surface-container-high'
                    }`}>
                      {step.completed ? (
                        <span className="material-symbols-outlined text-white text-sm">check</span>
                      ) : index === 2 ? (
                        <span className="material-symbols-outlined text-white text-xs">local_shipping</span>
                      ) : (
                        <div className="w-2 h-2 bg-on-surface-variant/40 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${step.completed ? 'text-on-surface' : index === 2 ? 'text-orange-600' : 'text-on-surface-variant/60'}`}>
                        {step.label}
                      </p>
                      {step.time && <p className="text-xs text-on-surface-variant/60">{step.time}</p>}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* ETA */}
              <div className="mt-4 p-3 bg-orange-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-on-surface-variant">{t.home.estimatedDelivery}</p>
                  <p className="font-bold text-orange-600">{activeOrder.eta}</p>
                </div>
                <Link href={`/app/orders/${activeOrder.id}`} className="text-primary font-bold text-sm">
                  {t.home.trackOrder}
                </Link>
              </div>
            </div>
          )}
          
          {/* Bubble Button */}
          <button
            onClick={() => setOrderBubbleExpanded(!orderBubbleExpanded)}
            aria-label="Toggle order details"
            className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${
              orderBubbleExpanded ? 'bg-primary' : 'bg-surface-container-lowest border border-outline-variant/15'
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

      {/* Serviceability Banner */}
      {locationStore.pincode && (
        <div className={`px-4 py-2 ${localServiceable ? "bg-green-500/10 border-b border-green-500/20" : "bg-amber-500/10 border-b border-amber-500/20"}`}>
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-sm ${localServiceable ? "text-green-600 animate-pulse" : "text-amber-600"}`}>location_on</span>
            <p className={`text-[11px] font-bold ${localServiceable ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
              {checkingPincode ? t.home.checkingAvailability : localServiceable
                ? `${t.home.showingNearby} ${locationStore.displayAddress}`
                : `${t.home.noExactMatch} ${locationStore.pincode}. ${t.home.showingByCity}`
              }
            </p>
          </div>
        </div>
      )}

      {/* Categories with Offers */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-bold text-on-surface mb-3">{t.home.categories}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/app/${cat.id}`} className="relative">
              <div className={`${cat.color} dark:bg-surface-container rounded-2xl p-4 text-center shadow-sm`}>
                <div className={`w-12 h-12 rounded-xl bg-surface-container-lowest mx-auto flex items-center justify-center mb-2`}>
                  <span className={`material-symbols-outlined ${cat.iconColor} text-xl`}>{cat.icon}</span>
                </div>
                <p className="font-bold text-on-surface text-sm">{cat.label}</p>
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

      {/* Spotlight Section - Featured Today */}
      {spotlightRestaurant && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <h2 className="text-lg font-bold text-on-surface">{t.home.featuredToday}</h2>
          </div>
          <Link href={`/app/vendor/${spotlightRestaurant.id}`} className="block relative bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-[var(--color-surface-container-lowest)]/10 rounded-full blur-2xl" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-20 h-20 bg-[var(--color-surface-container-lowest)]/20 rounded-2xl flex items-center justify-center overflow-hidden">
                {spotlightRestaurant.cover_image_url || spotlightRestaurant.image_url ? (
                  <BlurImage src={spotlightRestaurant.cover_image_url || spotlightRestaurant.image_url || ""} alt={`${spotlightRestaurant.name || spotlightRestaurant.shop_name} featured`} fill className="w-full h-full" sizes="80px" />
                ) : (
                  <span className="text-3xl">🍽️</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-white/30 text-xs font-bold px-2 py-0.5 rounded-full">⭐ {t.home.featured}</span>
                </div>
                <h3 className="text-xl font-black">{spotlightRestaurant.name || spotlightRestaurant.shop_name}</h3>
                <p className="text-sm text-white/80">{spotlightRestaurant.cuisine || t.home.variousCuisines}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center gap-1 bg-[var(--color-surface-container-lowest)]/20 px-2 py-1 rounded-full text-xs font-bold">
                    ★ {spotlightRestaurant.rating || 4.0}
                  </span>
                  <span className="text-xs text-white/80">{t.home.minDelivery}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Featured/Promoted Section */}
      {featuredRestaurants.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <h2 className="text-lg font-bold text-on-surface">{t.home.promotedPartners}</h2>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {featuredRestaurants.map((restaurant) => (
              <Link key={restaurant.id} href={`/app/vendor/${restaurant.id}`} className="flex-shrink-0 w-36 bg-surface-container-lowest dark:bg-[var(--color-surface-container)] border border-outline-variant/10 dark:border-[var(--color-border-subtle)] rounded-2xl overflow-hidden shadow-sm hover:border-purple-500/30 transition-all">
                <div className="relative h-28 bg-surface-container">
                  {restaurant.cover_image_url || restaurant.image_url ? (
                    <BlurImage src={restaurant.cover_image_url || restaurant.image_url || ""} alt={`${restaurant.shop_name || restaurant.name} promoted`} fill className="w-full h-full" sizes="(max-width: 768px) 50vw, 25vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                  )}
                  {restaurant.is_promoted && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {t.home.promoted}
                    </div>
                  )}
                  {restaurant.is_new && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {t.home.new}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <h4 className="font-bold text-sm text-on-surface truncate">{restaurant.name || restaurant.shop_name}</h4>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs font-bold text-green-700 dark:text-green-400">★ {restaurant.rating || 4.0}</span>
                    <span className="text-xs text-on-surface-variant/70">• {restaurant.cuisine?.split(",")[0] || t.home.various}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Print Store Quick Entry + Calculator */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500" style={{ fontVariationSettings: "'FILL' 1" }}>print</span>
            <h2 className="text-lg font-bold text-on-surface">{t.home.printStore}</h2>
          </div>
          <Link href="/app/printing" className="text-xs font-bold text-primary">{t.home.open}</Link>
        </div>
        <div className="mt-3">
          <PrintCostCalculator ctaHref="/app/printing" />
        </div>
      </div>

      {/* Nearby Popular Restaurants */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-on-surface">{t.home.nearbyPopular} 🔥</h2>
          <Link href="/app/food" className="text-xs font-bold text-primary">{t.home.seeAll}</Link>
        </div>
        {nearbyRestaurants.filter(r => r.type === 'food' || r.type === 'restaurant').length > 0 ? (
          <div className="space-y-3">
            {nearbyRestaurants.filter(r => r.type === 'food' || r.type === 'restaurant').map((restaurant) => (
              <Link key={restaurant.id} href={`/app/vendor/${restaurant.id}`} className="block bg-surface-container-lowest dark:bg-[var(--color-surface-container)] border border-outline-variant/10 dark:border-[var(--color-border-subtle)] rounded-2xl overflow-hidden shadow-sm">
                <div className="flex">
                  <div className="w-28 h-28 flex-shrink-0 bg-surface-container relative">
                    {restaurant.cover_image_url || restaurant.image_url ? (
                      <BlurImage src={restaurant.cover_image_url || restaurant.image_url || ""} alt={restaurant.name || restaurant.shop_name} fill className="w-full h-full" sizes="112px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                    )}
                    {restaurant.is_featured && (
                      <div className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        {t.home.featured}
                      </div>
                    )}
                    {restaurant.is_promoted && (
                      <div className="absolute top-1 right-1 bg-purple-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {t.home.promoted}
                      </div>
                    )}
                    {restaurant.is_new && (
                      <div className="absolute bottom-1 left-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {t.home.new}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-on-surface">{restaurant.name || restaurant.shop_name}</h3>
                      <div className="flex items-center gap-1 bg-green-500/15 px-1.5 py-0.5 rounded">
                        <span className="text-xs font-bold text-green-600 dark:text-green-400">{restaurant.rating || 4.0}</span>
                        <span className="text-green-600 dark:text-green-400 text-xs">★</span>
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">{restaurant.cuisine || t.home.various}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {t.home.minDelivery}
                      </span>
                      {restaurant.is_featured && (
                        <span className="flex items-center gap-0.5 text-amber-600">
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {t.home.topRated}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : !locationStore.pincode ? (
          <div className="bg-surface-container dark:bg-[var(--color-surface-container-lowest)] border border-outline-variant/10 dark:border-[var(--color-border-subtle)] rounded-2xl p-8 text-center shadow-sm">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
              <span className="material-symbols-outlined text-4xl text-primary">location_on</span>
            </div>
            <h3 className="text-lg font-black text-on-surface dark:text-[var(--color-on-surface)] mb-1">{t.home.locationRequired}</h3>
            <p className="text-sm text-on-surface-variant dark:text-[var(--color-outline)] mb-5">
              {t.home.locationRequiredDesc}
            </p>
            <button
              onClick={() => setShowLocationModal(true)}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-[#a00018] active:scale-95 transition-all shadow-md"
            >
              {t.home.selectPincode}
            </button>
          </div>
        ) : locationStore.pincode ? (
          <div className="bg-surface-container dark:bg-[var(--color-surface-container-lowest)] border border-outline-variant/10 dark:border-[var(--color-border-subtle)] rounded-2xl p-8 text-center shadow-sm">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-amber-500">location_off</span>
            </div>
            <h3 className="text-lg font-black text-on-surface dark:text-[var(--color-on-surface)] mb-1">{t.home.notAvailable}</h3>
            <p className="text-sm text-on-surface-variant dark:text-[var(--color-outline)] mb-1">
              {t.home.notAvailableDesc}
            </p>
            <p className="text-sm font-bold text-primary mb-4">
              {locationStore.displayAddress} ({locationStore.pincode})
            </p>
            <p className="text-xs text-[var(--color-outline-variant)] mb-5">
              {t.home.expanding}
            </p>
            <button
              onClick={() => setShowLocationModal(true)}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm"
            >
              {t.home.changeLocation}
            </button>
          </div>
        ) : (
          <div className="text-center py-8 text-on-surface-variant/70">
            <span className="material-symbols-outlined text-4xl mb-2">restaurant</span>
            <p>{t.home.noRestaurantsNearby}</p>
          </div>
        )}
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="location-modal-title" onKeyDown={(e) => { if (e.key === "Escape") setShowLocationModal(false); }}>
          <div className="bg-surface-container dark:bg-[var(--color-surface-container-lowest)] w-full md:w-96 rounded-t-3xl md:rounded-3xl p-6 border-t border-x border-outline-variant/10 dark:border-[var(--color-border-subtle)] md:border animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 id="location-modal-title" className="text-xl font-black text-on-surface">{t.home.enterPincode}</h2>
              <button onClick={() => setShowLocationModal(false)} aria-label="Close location modal" className="w-11 h-11 bg-surface-container-high rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">close</span>
              </button>
            </div>

            <p className="text-sm text-on-surface-variant mb-4">{t.home.enterPincodeDesc}</p>

            {/* Pincode Entry */}
            <div className="mb-4">
              <label htmlFor="pincode-input" className="text-xs font-bold text-[var(--color-outline)] mb-1 block">{t.home.pincode}</label>
              <input
                id="pincode-input"
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={manualPincode}
                onChange={(e) => {
                  setManualPincode(e.target.value.replace(/\D/g, ""));
                  setPincodeError("");
                }}
                placeholder={t.home.enter6Digit}
                className="w-full px-4 py-4 bg-surface-container-high dark:bg-[var(--color-surface-container)] rounded-xl border-2 border-transparent focus:border-primary outline-none text-2xl font-black tracking-[0.5em] text-center text-on-surface dark:text-[var(--color-on-surface)]"
                autoFocus
              />
              {pincodeError && <p className="text-red-500 text-xs mt-2 text-center font-bold">{pincodeError}</p>}
            </div>

            <button
              onClick={handleManualLocation}
              disabled={manualPincode.length !== 6 || isLoadingLocation}
              className="w-full mb-3 bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-[#a00018] transition-colors disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoadingLocation ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t.home.detectingArea}
                </>
              ) : (
                t.home.checkAvailability
              )}
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-px bg-outline-variant/20" />
              <span className="text-xs text-gray-400 font-bold">{t.home.or}</span>
              <div className="flex-1 h-px bg-outline-variant/20" />
            </div>

            {/* GPS Button */}
            <button
              onClick={getCurrentLocation}
              disabled={isLoadingLocation}
              className="w-full flex items-center gap-4 p-4 border border-outline-variant/20 rounded-xl hover:bg-surface-container-high transition-colors"
            >
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                {isLoadingLocation ? (
                  <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-green-600">my_location</span>
                )}
              </div>
              <div className="text-left">
                <p className="font-bold text-on-surface text-sm">{t.home.detectMyLocation}</p>
                <p className="text-[10px] text-on-surface-variant">{t.home.useGps}</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="fixed inset-0 z-50" onClick={() => setShowNotifications(false)} role="dialog" aria-modal="true" aria-labelledby="notifications-title" onKeyDown={(e) => { if (e.key === "Escape") setShowNotifications(false); }}>
          <div className="absolute inset-0 bg-black/30" />
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-md bg-surface-container-lowest dark:bg-[var(--color-surface-container)] border-l border-outline-variant/10 dark:border-[var(--color-border-subtle)] shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
              <h2 id="notifications-title" className="text-xl font-black text-on-surface">{t.home.notifications}</h2>
              <button 
                onClick={() => setShowNotifications(false)}
                aria-label="Close notifications"
                className="w-11 h-11 bg-surface-container-high rounded-full flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">close</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-outline-variant/10" role="tablist" aria-label="Notification categories">
              <button role="tab" aria-selected={notifTab === "all"} onClick={() => setNotifTab("all")} className={`flex-1 py-3 text-sm font-bold border-b-2 ${notifTab === "all" ? "text-primary border-primary" : "text-gray-400 border-transparent"}`}>
                {t.home.all}
              </button>
              <button role="tab" aria-selected={notifTab === "orders"} onClick={() => setNotifTab("orders")} className={`flex-1 py-3 text-sm font-bold border-b-2 ${notifTab === "orders" ? "text-primary border-primary" : "text-gray-400 border-transparent"}`}>
                {t.home.ordersTab}
              </button>
              <button role="tab" aria-selected={notifTab === "offers"} onClick={() => setNotifTab("offers")} className={`flex-1 py-3 text-sm font-bold border-b-2 ${notifTab === "offers" ? "text-primary border-primary" : "text-gray-400 border-transparent"}`}>
                {t.home.offersTab}
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto h-[calc(100vh-140px)]">
              {notifications
                .filter(n => notifTab === "all" || (notifTab === "orders" && (n.type === "order" || n.type === "info")) || (notifTab === "offers" && (n.type === "promo" || n.type === "offer")))
                .map((notif) => (
                <div key={notif.id} className={`p-4 border-b border-outline-variant/10 transition-colors ${!notif.read ? 'bg-primary/10' : 'hover:bg-surface-container-high/50'}`}>
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notif.type === "order" ? "bg-surface-container-high" :
                      notif.type === "promo" ? "bg-amber-500/10" : "bg-surface-container-low"
                    }`}>
                      <span className="material-symbols-outlined text-primary">
                        {notif.type === "order" ? "restaurant" :
                         notif.type === "promo" ? "local_offer" : "info"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <p className={`font-bold text-on-surface text-sm ${!notif.read ? 'text-primary' : ''}`}>{notif.title}</p>
                        <span className="text-[10px] text-gray-400">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">{notif.body || notif.message}</p>
                      {notif.type === "offer" && (
                        <button
                          onClick={() => {
                            if (notif.body) {
                              navigator.clipboard.writeText(notif.body);
                              import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Coupon code copied!", "success"));
                            }
                          }}
                          className="mt-2 text-xs font-bold text-primary"
                          aria-label={`Apply offer: ${notif.title}`}
                        >
                          {t.home.applyNow}
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
                  <p className="text-gray-500 mt-2">{t.home.noNotifications}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}