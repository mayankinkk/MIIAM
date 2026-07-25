"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

import { createClient } from "@/lib/supabase/client";
import { useLocationStore } from "@/lib/store/locationStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { HomeSkeleton } from "@/components/Skeleton";
import { NetworkError } from "@/components/ui/EmptyStates";
import { withRetry } from "@/lib/retry";
import logger from "@/lib/logger";
import { reverseGeocode, geocodePincode } from "@/lib/geocoding";
import { useRecentlyViewed } from "@/lib/hooks/useRecentlyViewed";

import HomeHeader from "@/components/home/HomeHeader";
import OffersCarousel from "@/components/home/OffersCarousel";
import ActiveOrderBubble from "@/components/home/ActiveOrderBubble";
import ServiceabilityChip from "@/components/home/ServiceabilityChip";
import HomeCategories from "@/components/home/HomeCategories";
import QuickReorder from "@/components/home/QuickReorder";
import SpotlightCard from "@/components/home/SpotlightCard";
import PromotedPartners from "@/components/home/PromotedPartners";
import CombosSection from "@/components/home/CombosSection";
import LocationModal from "@/components/home/LocationModal";
import NotificationsPanel from "@/components/home/NotificationsPanel";
import RecentlyViewed from "@/components/home/RecentlyViewed";
import PullToRefresh from "@/components/PullToRefresh";

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
  is_read: boolean;
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
  const [loading, setLoading] = useState(true);
  const { recentlyViewed } = useRecentlyViewed();

  const categories = [
    { id: "food?filter=under_99", label: "Under ₹99", icon: "local_fire_department", color: "from-orange-400 to-red-400" },
    { id: "food?filter=under_149", label: "Under ₹149", icon: "savings", color: "from-emerald-400 to-teal-400" },
    { id: "food?filter=under_199", label: "Under ₹199", icon: "star", color: "from-blue-400 to-indigo-400" },
    { id: "food?filter=under_249", label: "Under ₹249", icon: "new_releases", color: "from-purple-400 to-pink-400" },
    { id: "food?filter=combos", label: "Combos", icon: "merge", color: "from-amber-400 to-orange-400" },
    { id: "food?filter=bakery", label: "Bakery", icon: "bakery_dining", color: "from-pink-400 to-rose-400" },
  ];

  const [dbOffers, setDbOffers] = useState<Array<{ id: string; title: string; subtitle: string; gradient: string; badge: string }>>([]);
  const offers = dbOffers;

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
  const [combos, setCombos] = useState<{ id: string; name: string; description: string; image_url: string; original_price: number; combo_price: number; items: string[] }[]>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("miiam_combos_cache");
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) return data;
        } catch {}
      }
    }
    return [];
  });
  const [localServiceable, setLocalServiceable] = useState(true);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const userPincode = locationStore.pincode;
  const [lastOrder, setLastOrder] = useState<{ id: string; vendor_id: string; vendor_name: string; items: string; total: number; placed_at: string } | null>(null);

  useEffect(() => {
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
          ? supabase.from("vendors").select("id, shop_name, cuisine, image_url, cover_image_url, rating, delivery_time_min, delivery_time_max, delivery_charge, min_order_amount, is_new, is_featured, is_promoted, status, type, pincode, city").order("shop_name", { ascending: true }).limit(50)
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

      const { data: lastOrderData } = await supabase
        .from("orders")
        .select("id, status, total_amount, placed_at, vendor_id, items")
        .eq("user_id", user.id)
        .in("status", ["delivered", "completed"])
        .order("placed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastOrderData) {
        let vendorName = "Restaurant";
        if (lastOrderData.vendor_id) {
          const { data: v } = await supabase.from("vendors").select("shop_name").eq("id", lastOrderData.vendor_id).maybeSingle();
          if (v?.shop_name) vendorName = v.shop_name;
        }
        const itemsList = Array.isArray(lastOrderData.items)
          ? (lastOrderData.items as Array<{ name?: string }>).map((i) => i.name || "Item").join(", ")
          : typeof lastOrderData.items === "string" ? lastOrderData.items : "Previous order";
        setLastOrder({
          id: lastOrderData.id,
          vendor_id: lastOrderData.vendor_id || "",
          vendor_name: vendorName,
          items: itemsList,
          total: lastOrderData.total_amount || 0,
          placed_at: lastOrderData.placed_at,
        });
      }

      if (notifsResult.data) {
        setNotifications(notifsResult.data);
        setUnreadCount(notifsResult.data.filter((n: HomeNotification) => !n.is_read).length);
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
        const local = vendors.filter((v: HomeVendor) => {
          const pincodeMatch = v.pincode === pincode;
          const cityMatch = userCity && v.city?.toLowerCase() === userCity;
          return pincodeMatch || cityMatch;
        });
        setLocalServiceable(local.length > 0);
        setNearbyRestaurants(local);
        setFeaturedRestaurants(local.filter((v: HomeVendor) => v.is_featured || v.is_promoted).slice(0, 6));
        setSpotlightRestaurant(local.find((v: HomeVendor) => v.is_featured) || null);
      }

      const { data: comboData } = await supabase
        .from("combos")
        .select("id, name, description, image_url, original_price, combo_price, items")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(10);
      if (comboData) {
        setCombos(comboData);
        localStorage.setItem("miiam_combos_cache", JSON.stringify({ data: comboData, timestamp: Date.now() }));
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
            .select("id, status, total_amount, placed_at, vendor_id")
            .eq("user_id", user.id)
            .in("status", ["pending", "accepted", "preparing", "ready_for_pickup", "shopping", "picked_up", "picking_up", "on_the_way"])
            .order("placed_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (active) {
            let vendorName = "Restaurant";
            if (active.vendor_id) {
              const { data: v } = await supabase.from("vendors").select("shop_name").eq("id", active.vendor_id).maybeSingle();
              if (v?.shop_name) vendorName = v.shop_name;
            }
            setActiveOrder({
              id: active.id,
              vendor: vendorName,
              items: t.home.orderInProgress,
              steps: [
                { id: 1, label: t.home.orderPlaced, completed: true, time: new Date(active.placed_at).toLocaleTimeString() },
                { id: 2, label: t.home.accepted, completed: ["accepted", "preparing", "ready_for_pickup", "shopping", "picked_up", "picking_up", "on_the_way"].includes(active.status), time: "" },
                { id: 3, label: t.home.onTheWay, completed: ["shopping", "picked_up", "on_the_way"].includes(active.status), time: "" },
              ],
              eta: ["shopping", "picked_up", "on_the_way"].includes(active.status) ? "5-10 min" : "20-30 min",
            });
          }
        } catch (err) {
          logger.error({ err: err }, "Failed to fetch active order");
        }
      }
      fetchActiveOrder();

      let cancelled = false;
      const channelPromise = supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
        if (!user || cancelled) return null;
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
        return channel;
      });

    return () => {
      cancelled = true;
      channelPromise.then((ch: ReturnType<typeof supabase.channel> | null) => { if (ch) supabase.removeChannel(ch); });
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

    const geo = await geocodePincode(pin);
    if (geo) {
      const displayName = geo.state ? `${geo.displayAddress}, ${geo.state}` : geo.displayAddress;
      setLocation(displayName);
      locationStore.setLocation({
        pincode: pin,
        lat: geo.lat,
        lng: geo.lng,
        city: geo.city || undefined,
        state: geo.state || undefined,
        displayAddress: displayName,
      });
      setIsLoadingLocation(false);
      setShowLocationModal(false);
      setManualPincode("");
      return;
    }

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
          const geo = await reverseGeocode(latitude, longitude);
          const state = geo.state || undefined;
          const displayName = state ? `${geo.displayAddress}, ${state}` : geo.displayAddress;

          setLocation(displayName);
          locationStore.setLocation({
            pincode: geo.postalCode,
            lat: latitude,
            lng: longitude,
            city: geo.city || undefined,
            state,
            displayAddress: displayName,
          });
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

  useEffect(() => {
    async function loadPromos() {
      try {
        const { data } = await supabase
          .from("home_promotions")
          .select("id, badge, title, subtitle, gradient, link_url")
          .eq("is_active", true)
          .order("position");
        if (data && data.length > 0) {
          setDbOffers(data.map((p: { id: string; badge: string; title: string; subtitle: string; gradient: string }) => ({
            id: p.id,
            badge: p.badge || "",
            title: p.title,
            subtitle: p.subtitle || "",
            gradient: p.gradient || "from-blue-500 to-indigo-500",
          })));
        }
      } catch {
        // Use fallback offers
      }
    }
    loadPromos();
  }, [supabase]);

  useEffect(() => {
    if (offers.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentOffer((prev) => (prev + 1) % offers.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [offers.length]);

  if (loading) return <HomeSkeleton />;

  if (dataError) {
    return (
      <div className="min-h-screen bg-surface text-on-background flex items-center justify-center px-6 pb-24">
        <NetworkError onRetry={() => { setDataError(null); setLoading(true); setRetryKey((k) => k + 1); }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-background pb-24">
      <HomeHeader
        userName={userName}
        greeting={greeting}
        timeIcon={timeIcon}
        location={location}
        unreadCount={unreadCount}
        onLocationClick={() => setShowLocationModal(true)}
        onNotificationsClick={async () => {
          setShowNotifications(!showNotifications);
          if (unreadCount > 0 && user) {
            setUnreadCount(0);
            void supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
          }
        }}
      />

      <OffersCarousel offers={offers} currentOffer={currentOffer} />

      {activeOrder && (
        <ActiveOrderBubble
          activeOrder={activeOrder}
          expanded={orderBubbleExpanded}
          onToggle={() => setOrderBubbleExpanded(!orderBubbleExpanded)}
          onClose={() => setOrderBubbleExpanded(false)}
        />
      )}

      <ServiceabilityChip
        pincode={userPincode}
        displayAddress={locationStore.displayAddress || ""}
        localServiceable={localServiceable}
        checkingPincode={checkingPincode}
      />

      <PullToRefresh onRefresh={async () => { window.location.reload(); }} className="min-h-screen">
        <HomeCategories categories={categories} />
      </PullToRefresh>

      {lastOrder && <QuickReorder order={lastOrder} />}

      {spotlightRestaurant && <SpotlightCard restaurant={spotlightRestaurant} />}

      <PromotedPartners restaurants={featuredRestaurants} />

      <RecentlyViewed items={recentlyViewed} />

      <div id="combos">
        <CombosSection combos={combos} />
      </div>

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        manualPincode={manualPincode}
        onPincodeChange={(value) => { setManualPincode(value); setPincodeError(""); }}
        pincodeError={pincodeError}
        isLoadingLocation={isLoadingLocation}
        onCheckAvailability={handleManualLocation}
        onDetectLocation={getCurrentLocation}
      />

      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        notifTab={notifTab}
        onTabChange={setNotifTab}
      />
    </div>
  );
}
