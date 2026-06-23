"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { useRiderOnlineStore } from "@/lib/store/riderOnlineStore";
import { startLocationTracking, stopLocationTracking } from "@/lib/rider-location-tracker";
import { RiderDashboardSkeleton } from "@/components/Skeleton";
import { calculateEarnings } from "@/lib/earnings";
import type { OrderWithTiming } from "./types";
import type * as Leaflet from 'leaflet';
import QuickStats from "@/components/rider/QuickStats";
import MapControls from "@/components/rider/MapControls";
import DashboardHeader from "@/components/rider/DashboardHeader";
import IncomingOrderCard from "@/components/rider/IncomingOrderCard";
import ActiveDeliveryView from "@/components/rider/ActiveDeliveryView";
import { useTranslation } from "@/lib/i18n/useTranslation";
import logger from "@/lib/logger";

const CallModal = dynamic(() => import("@/components/rider/CallModal"), { ssr: false });
const OrderChatOverlay = dynamic(() => import("@/components/order/OrderChatOverlay"), { ssr: false });
const AlertSettingsModal = dynamic(() => import("@/components/rider/AlertSettingsModal"), { ssr: false });
const QuestModal = dynamic(() => import("@/components/rider/QuestModal"), { ssr: false });
const CancelOrderModal = dynamic(() => import("@/components/rider/CancelOrderModal"), { ssr: false });
const SkipOrderModal = dynamic(() => import("@/components/rider/SkipOrderModal"), { ssr: false });
const LowBatteryWarning = dynamic(() => import("@/components/rider/LowBatteryWarning"), { ssr: false });
const NewOrderBanner = dynamic(() => import("@/components/rider/NewOrderBanner"), { ssr: false });

export default function RiderDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { t } = useTranslation();
  const isOnline = useRiderOnlineStore((s) => s.isOnline);
  const setOnline = useRiderOnlineStore((s) => s.setOnline);
  const [countdown, setCountdown] = useState(300);
  const [pendingOrders, setPendingOrders] = useState<OrderWithTiming[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithTiming | null>(null);
  const [currentOrder, setCurrentOrder] = useState<OrderWithTiming | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [riderDeliveries, setRiderDeliveries] = useState(0);
  const [riderEarnings, setRiderEarnings] = useState(0);
  const [orderTakenByOther, setOrderTakenByOther] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [showNewOrderAlert, setShowNewOrderAlert] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [snoozeMessage, setSnoozeMessage] = useState("");
  const [activeOrders, setActiveOrders] = useState<OrderWithTiming[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [deliveryStep, setDeliveryStep] = useState<"shopping" | "picking_up" | "picked" | "delivering" | "arrived">("shopping");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [dndMode, setDndMode] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<Leaflet.Map | null>(null);
  const riderMarkerRef = useRef<Leaflet.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const questTitles = { complete5: t.rider.quests.complete5, earn500: t.rider.quests.earn500, threeStar: t.rider.quests.threeStar };
  const [dailyQuests, setDailyQuests] = useState([
    { id: 1, title: questTitles.complete5, current: 0, target: 5, bonus: 100 },
    { id: 2, title: questTitles.earn500, current: 0, target: 500, bonus: 75 },
    { id: 3, title: questTitles.threeStar, current: 0, target: 10, bonus: 50 },
  ]);
  const [streakDays, setStreakDays] = useState(0);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [liveEarnings, setLiveEarnings] = useState(0);
  const [cashCollected, setCashCollected] = useState(0);
  const [cashPending, setCashPending] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const cancelReasons = [t.rider.cancelReasons.tooFarPickup, t.rider.cancelReasons.tooFarDelivery, t.rider.cancelReasons.vehicleBreakdown, t.rider.cancelReasons.customerUnreachable, t.rider.cancelReasons.orderUnavailable, t.rider.cancelReasons.other];
  const [pickedItems, setPickedItems] = useState<Set<number>>(new Set());
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [showLowBattery, setShowLowBattery] = useState(false);
  const [customerRating, setCustomerRating] = useState(5.0);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const handleCenterMap = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { mapInstanceRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 15); },
        () => {},
        { timeout: 10000 }
      );
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (dndMode) return;
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 500]);
    }
  }, [dndMode, soundEnabled, vibrationEnabled]);

  const dismissNewOrderAlert = useCallback(() => setShowNewOrderAlert(false), []);

  // Get rider ID on mount + load real stats
  useEffect(() => {
    async function getRiderId() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/rider/login"); return; }
        setCurrentUserId(user.id);

        const { data: riderRow } = await supabase.from("riders").select("id, total_deliveries").eq("user_id", user.id).maybeSingle();
        if (!riderRow) { setError("You don't have a rider account yet."); setInitialLoading(false); return; }

        const riderIdVal = riderRow.id;
        setRiderId(riderIdVal);
        setRiderDeliveries(riderRow.total_deliveries || 0);

        let totalEarnings = 0;
        const { data: allDeliveredOrders } = await supabase.from("orders").select("delivery_fee").eq("rider_id", riderIdVal).in("status", ["delivered", "completed"]);
        totalEarnings = (allDeliveredOrders || []).reduce((s: number, o: { delivery_fee: number | null }) => s + (Number(o.delivery_fee) || 0), 0);
        if (!totalEarnings) {
          const { data: walletFallback } = await supabase.from("rider_wallets").select("total_earnings").eq("rider_id", riderIdVal).maybeSingle();
          totalEarnings = Number(walletFallback?.total_earnings) || 0;
        }
        setRiderEarnings(totalEarnings);

        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        let todayEarned = 0; let collected = 0;
        const { data: todayOrders } = await supabase.from("orders").select("delivery_fee").eq("rider_id", riderIdVal).in("status", ["delivered", "completed"]).gte("placed_at", todayStart.toISOString());
        todayEarned = (todayOrders || []).reduce((s: number, o: { delivery_fee: number | null }) => s + (Number(o.delivery_fee) || 0), 0);
        if (!todayEarned) {
          const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0);
          const { data: todayTxns } = await supabase.from("rider_wallet").select("amount").eq("rider_id", riderIdVal).eq("type", "earning").gte("created_at", weekStart.toISOString());
          todayEarned = (todayTxns || []).reduce((s: number, t: { amount: number }) => s + Number(t.amount), 0);
        }
        setTodayEarnings(todayEarned);
        setCashCollected(0); setCashPending(0);

        const { data: settings } = await supabase.from("rider_settings").select("dnd_mode, sound_enabled, vibration_enabled").eq("rider_id", riderIdVal).maybeSingle();
        if (settings) {
          setDndMode(settings.dnd_mode || false);
          if (settings.sound_enabled !== undefined) setSoundEnabled(settings.sound_enabled);
          if (settings.vibration_enabled !== undefined) setVibrationEnabled(settings.vibration_enabled);
        }

        const { data: quests } = await supabase.from("rider_quest_progress").select("*").eq("rider_id", riderIdVal);
        if (quests && quests.length > 0) {
          setDailyQuests(quests.map((q: { quest_id: number; current_progress: number; target: number; bonus: number }) => ({
            id: q.quest_id, title: q.quest_id === 1 ? questTitles.complete5 : q.quest_id === 2 ? questTitles.earn500 : questTitles.threeStar,
            current: q.current_progress, target: q.target, bonus: q.bonus,
          })));
        } else {
          const defaultQuests = [{ quest_id: 1, target: 5, bonus: 100 }, { quest_id: 2, target: 500, bonus: 75 }, { quest_id: 3, target: 10, bonus: 50 }];
          const initialProgress = [{ current: riderRow.total_deliveries || 0, target: 5 }, { current: todayEarned, target: 500 }, { current: 0, target: 10 }];
          setDailyQuests(initialProgress.map((p, i) => ({
            id: defaultQuests[i].quest_id, title: defaultQuests[i].quest_id === 1 ? questTitles.complete5 : defaultQuests[i].quest_id === 2 ? questTitles.earn500 : questTitles.threeStar,
            current: p.current, target: p.target, bonus: defaultQuests[i].bonus,
          })));
          for (const q of defaultQuests) {
            await supabase.from("rider_quest_progress").insert({ rider_id: riderIdVal, quest_id: q.quest_id, current_progress: 0, target: q.target, bonus: q.bonus });
          }
        }

        try {
          const activeStatuses = ["pending", "accepted", "preparing", "ready_for_pickup", "shopping", "picking_up", "on_the_way", "arrived"];
          const { data: activeOrdersData } = await supabase.from("orders").select("id, user_id, vendor_id, status, total_amount, delivery_address, special_instructions, placed_at, vendor:vendors(id, shop_name, address, phone, latitude, longitude)").eq("rider_id", riderIdVal).in("status", activeStatuses).order("placed_at", { ascending: false }).limit(1);
          if (activeOrdersData && activeOrdersData.length > 0) {
            const dbOrder = activeOrdersData[0];
            const vendorData = dbOrder.vendor as Record<string, unknown> | null;
            let customerName = "Customer";
            let customerPhone = "+91 88888 88888";
            if (dbOrder.user_id) {
              const { data: profile } = await supabase.from("profiles").select("full_name, name, phone").eq("id", dbOrder.user_id).maybeSingle();
              if (profile) { customerName = (profile.full_name as string) || (profile.name as string) || "Customer"; customerPhone = (profile.phone as string) || customerPhone; }
            }
            const { data: itemsData } = await supabase.from("order_items").select("id, order_id, menu_item_id, name, quantity, price, unit_price, status, actual_price, picked").eq("order_id", dbOrder.id);
            const items = itemsData || [];
            const itemsCount = items.reduce((sum: number, it: Record<string, unknown>) => sum + (it.quantity as number), 0);
            const itemsList = items.map((it: Record<string, unknown>) => `${it.quantity}x ${(it.name as string) || "Item"}`);
            const activeOrder: OrderWithTiming = {
              id: dbOrder.id, orderDbId: dbOrder.id, vendor: (vendorData?.shop_name as string) || (vendorData?.name as string) || "Restaurant",
              vendorAddress: (vendorData?.address as string) || "Restaurant Address", vendorPhone: (vendorData?.phone as string) || "+91 99999 99999",
              vendorLat: (vendorData?.latitude as number) || (vendorData?.lat as number) || undefined, vendorLng: (vendorData?.longitude as number) || (vendorData?.lng as number) || undefined,
              customer: customerName, customerPhone, customerAddress: dbOrder.delivery_address || "Customer Delivery Location",
              landmark: dbOrder.special_instructions || "N/A", distance: 0, distance2: 0, totalDistance: 0,
              earnings: calculateEarnings(0), orderTotal: Math.round(dbOrder.total_amount || 0), items: itemsCount || 1,
              itemsList: itemsList.length > 0 ? itemsList : ["Items hidden"], time: "Calculating...", time2: "Calculating...",
              estCompletion: 0, priority: (dbOrder.total_amount > 500) ? "high" as const : "normal" as const,
              peakMultiplier: 1.0, specialInstructions: dbOrder.special_instructions || "", otp: "", type: (vendorData?.type as "food" | "grocery" | "multi_stop") || "food",
            };
            setCurrentOrder(activeOrder);
            const statusStepMap: Record<string, "shopping" | "picking_up" | "picked" | "delivering" | "arrived"> = {
              accepted: "shopping", preparing: "shopping", shopping: "shopping", ready_for_pickup: "picking_up",
              picking_up: "picking_up", on_the_way: "delivering", arrived: "arrived",
            };
            setDeliveryStep(statusStepMap[dbOrder.status] || "shopping");
          }
        } catch (activeErr) { logger.warn({ err: activeErr }, "Failed to load active order"); }

        setInitialLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize dashboard");
        setInitialLoading(false);
      }
    }
    getRiderId();
  }, [supabase, router]);

  useEffect(() => {
    if (selectedOrder && countdown > 0) {
      if (selectedOrder.isSnoozed && selectedOrder.snoozeUntil && Date.now() < selectedOrder.snoozeUntil) return;
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && selectedOrder) {
      handleDecline(selectedOrder.id);
    }
  }, [countdown, selectedOrder]);

  const handleSnooze = useCallback(async (order: OrderWithTiming) => {
    const snoozeUntil = Date.now() + 30000;
    setPendingOrders(prev => prev.map(o => o.id === order.id ? { ...o, isSnoozed: true, snoozeUntil } : o));
    if (selectedOrder?.id === order.id) setSelectedOrder(prev => prev ? { ...prev, isSnoozed: true, snoozeUntil } : null);
    setSnoozeMessage(t.rider.notifications.snoozed);
    setTimeout(() => setSnoozeMessage(""), 3000);
    if (order.orderDbId && riderId) {
      try { await supabase.rpc('snooze_order_for_rider', { p_order_id: order.orderDbId, p_rider_id: riderId, p_seconds: 30 }); } catch { /* silent */ }
    }
  }, [selectedOrder, riderId, supabase]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPendingOrders(prev => prev.map(o => {
        if (o.isSnoozed && o.snoozeUntil && now >= o.snoozeUntil) return { ...o, isSnoozed: false, snoozeUntil: undefined };
        return o;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchRealOrders() {
      try {
        if (!isOnline) return;
        const yesterday = new Date(); yesterday.setHours(yesterday.getHours() - 24);
        const { data: dbOrders } = await supabase.from("orders").select("id, user_id, vendor_id, status, total_amount, delivery_address, special_instructions, placed_at").is("rider_id", null).in("status", ["pending", "ready_for_pickup"]).gte("placed_at", yesterday.toISOString()).order("placed_at", { ascending: false });
        if (!dbOrders || dbOrders.length === 0) { setPendingOrders([]); return; }

        const vendorIds = [...new Set(dbOrders.map((o: Record<string, unknown>) => o.vendor_id).filter(Boolean))] as string[];
        const userIds = [...new Set(dbOrders.map((o: Record<string, unknown>) => o.user_id).filter(Boolean))] as string[];
        const orderIds = dbOrders.map((o: Record<string, unknown>) => o.id) as string[];

        const [vendorsRes, profilesRes, allItemsRes] = await Promise.all([
          vendorIds.length > 0 ? supabase.from("vendors").select("id, shop_name, address, phone, latitude, longitude").in("id", vendorIds) : Promise.resolve({ data: [] }),
          userIds.length > 0 ? supabase.from("profiles").select("id, full_name, name, phone").in("id", userIds) : Promise.resolve({ data: [] }),
          supabase.from("order_items").select("id, order_id, menu_item_id, name, quantity, price, unit_price").in("order_id", orderIds),
        ]);

        const vendorsMap = new Map((vendorsRes.data || []).map((v: Record<string, unknown>) => [v.id, v]));
        const profilesMap = new Map((profilesRes.data || []).map((p: Record<string, unknown>) => [p.id, p]));
        const allItems = allItemsRes.data || [];

        const allMenuItemIds = [...new Set(allItems.map((i: Record<string, unknown>) => i.menu_item_id).filter(Boolean))] as string[];
        let menuItemsMap = new Map();
        if (allMenuItemIds.length > 0) {
          const { data: menuItems } = await supabase.from("menu_items").select("id, name").in("id", allMenuItemIds);
          menuItemsMap = new Map((menuItems || []).map((mi: Record<string, unknown>) => [mi.id, mi]));
        }

        const now = Date.now(); const expirationTime = now + (5 * 60 * 1000);
        const mappedOrders: OrderWithTiming[] = dbOrders.map((dbOrder: Record<string, unknown>) => {
          const vendorData = dbOrder.vendor_id ? vendorsMap.get(dbOrder.vendor_id as string) : null;
          const profileData = dbOrder.user_id ? profilesMap.get(dbOrder.user_id as string) : null;
          const orderItems = allItems.filter((i: Record<string, unknown>) => i.order_id === dbOrder.id);
          let itemsList: string[] = []; let itemsCount = 0;
          if (orderItems.length > 0) {
            itemsCount = orderItems.reduce((sum: number, item: Record<string, unknown>) => sum + (item.quantity as number), 0);
            itemsList = orderItems.map((item: Record<string, unknown>) => {
              const mi = item.menu_item_id ? menuItemsMap.get(item.menu_item_id as string) : null;
              return `${item.quantity}x ${(mi as Record<string, unknown>)?.name || "Item"}`;
            });
          }
          return {
            id: dbOrder.id, orderDbId: dbOrder.id, vendor: (vendorData as Record<string, unknown>)?.shop_name || (vendorData as Record<string, unknown>)?.name || "Restaurant",
            vendorAddress: (vendorData as Record<string, unknown>)?.address || "Restaurant Address", vendorPhone: (vendorData as Record<string, unknown>)?.phone || "+91 99999 99999",
            vendorLat: (vendorData as Record<string, unknown>)?.latitude || (vendorData as Record<string, unknown>)?.lat || 0, vendorLng: (vendorData as Record<string, unknown>)?.longitude || (vendorData as Record<string, unknown>)?.lng || 0,
            customer: (profileData as Record<string, unknown>)?.full_name || (profileData as Record<string, unknown>)?.name || "Customer",
            customerPhone: (profileData as Record<string, unknown>)?.phone || "+91 88888 88888",
            customerAddress: dbOrder.delivery_address || "Customer Delivery Location", landmark: dbOrder.special_instructions || "N/A",
            distance: 0, distance2: 0, totalDistance: 0, earnings: calculateEarnings(0),
            orderTotal: Math.round(Number(dbOrder.total_amount) || 0), items: itemsCount || 1,
            itemsList: itemsList.length > 0 ? itemsList : ["Items hidden"], time: "Calculating...", time2: "Calculating...",
            estCompletion: 0, priority: (Number(dbOrder.total_amount) > 500) ? "high" : "normal", peakMultiplier: 1.0,
            specialInstructions: dbOrder.special_instructions || "", otp: "", type: (vendorData as Record<string, unknown>)?.type || "food",
            expiresAt: expirationTime, isSnoozed: false,
          } as OrderWithTiming;
        });
        setPendingOrders(mappedOrders);
      } catch (err) { logger.error({ err }, "Failed to fetch pending orders"); setPendingOrders([]); }
    }
    fetchRealOrders();
    const channel = supabase.channel('rider-orders-dash')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `status=eq.ready_for_pickup` }, () => { fetchRealOrders(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `status=eq.ready_for_pickup` }, () => { fetchRealOrders(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isOnline, supabase]);

  useEffect(() => {
    if (pendingOrders.length > 0 && isOnline && !showNewOrderAlert) {
      setShowNewOrderAlert(true);
      playNotificationSound();
    }
  }, [pendingOrders, isOnline]);

  useEffect(() => {
    const checkExpired = setInterval(() => {
      const now = Date.now();
      setPendingOrders(prev => prev.filter(o => !(o.expiresAt && now > o.expiresAt + 5000)));
    }, 5000);
    return () => clearInterval(checkExpired);
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) return;
    let batteryRef: { level: number; addEventListener: (type: string, listener: () => void) => void; removeEventListener: (type: string, listener: () => void) => void } | null = null;
    let handler: (() => void) | null = null;
    (navigator as Navigator & { getBattery?: () => Promise<{ level: number; addEventListener: (type: string, listener: () => void) => void; removeEventListener: (type: string, listener: () => void) => void }> }).getBattery?.().then((battery) => {
      batteryRef = battery;
      setBatteryLevel(Math.round(battery.level * 100));
      handler = () => {
        setBatteryLevel(Math.round(battery.level * 100));
        if (battery.level <= 0.2) setShowLowBattery(true);
      };
      battery.addEventListener('levelchange', handler);
    });
    return () => {
      if (batteryRef && handler) batteryRef.removeEventListener('levelchange', handler);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    let isMounted = true;
    (async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
      if (!isMounted || !mapRef.current) return;
      const map = L.map(mapRef.current, { zoomControl: false }).setView([28.6139, 77.2090], 14);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 18 }).addTo(map);
      mapInstanceRef.current = map;
      navigator.geolocation.getCurrentPosition((pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 15), () => {}, { timeout: 10000 });
      const riderIcon = L.divIcon({ className: '', html: `<div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:var(--color-secondary);border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(11,80,213,0.4);"><span style="font-size:20px;color:white;">🏍️</span></div>`, iconSize: [40, 40], iconAnchor: [20, 40] });
      riderMarkerRef.current = L.marker([28.6139, 77.2090], { icon: riderIcon }).addTo(map);
      const watchId = navigator.geolocation.watchPosition((pos) => { riderMarkerRef.current?.setLatLng([pos.coords.latitude, pos.coords.longitude]); }, () => {}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
      watchIdRef.current = watchId;
    })();
    return () => {
      isMounted = false;
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const markers: Leaflet.Marker[] = [];
    (async () => {
      const L = await import('leaflet');
      if (currentOrder && currentOrder.vendorLat && currentOrder.vendorLng) {
        const pickupIcon = L.divIcon({ className: '', html: `<div style="display:flex;flex-direction:column;align-items:center;"><div style="width:44px;height:44px;background:white;border-radius:50%;border:3px solid var(--color-secondary);box-shadow:0 3px 10px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;"><span style="font-size:20px;">🍽️</span></div><span style="margin-top:2px;padding:2px 6px;background:white;border-radius:6px;font-size:10px;font-weight:bold;box-shadow:0 1px 4px rgba(0,0,0,0.15);white-space:nowrap;">${currentOrder.vendor}</span></div>`, iconSize: [44, 64], iconAnchor: [22, 64] });
        markers.push(L.marker([currentOrder.vendorLat, currentOrder.vendorLng], { icon: pickupIcon }).addTo(map));
        if (deliveryStep === "delivering" && currentOrder.customerLat && currentOrder.customerLng) {
          const deliveryIcon = L.divIcon({ className: '', html: `<div style="display:flex;flex-direction:column;align-items:center;"><div style="width:44px;height:44px;background:white;border-radius:50%;border:3px solid var(--color-primary);box-shadow:0 3px 10px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;"><span style="font-size:20px;">🏠</span></div><span style="margin-top:2px;padding:2px 6px;background:white;border-radius:6px;font-size:10px;font-weight:bold;box-shadow:0 1px 4px rgba(0,0,0,0.15);white-space:nowrap;">${currentOrder.customer}</span></div>`, iconSize: [44, 64], iconAnchor: [22, 64] });
          markers.push(L.marker([currentOrder.customerLat, currentOrder.customerLng], { icon: deliveryIcon }).addTo(map));
        }
      }
      if (mapRef.current) { const el = mapRef.current as HTMLDivElement & { _orderMarkers?: Leaflet.Marker[] }; el._orderMarkers?.forEach((m) => m.remove()); el._orderMarkers = markers; }
    })();
    return () => { markers.forEach(m => m.remove()); };
  }, [currentOrder, deliveryStep]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    (async () => {
      const L = await import('leaflet');
      const mapEl = mapRef.current as (HTMLDivElement & { _demandMarkers?: Leaflet.Marker[] }) | null;
      if (mapEl?._demandMarkers) mapEl._demandMarkers.forEach((m) => m.remove());
      const demandMarkers: Leaflet.Marker[] = [];
      pendingOrders.forEach((order) => {
        if (order.vendorLat && order.vendorLng) {
          const dotIcon = L.divIcon({ className: '', html: `<div style="width:16px;height:16px;background:rgba(11,80,213,0.5);border:2px solid var(--color-secondary);border-radius:50%;box-shadow:0 0 12px rgba(11,80,213,0.4);animation:pulse-dot 2s ease-in-out infinite;"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] });
          demandMarkers.push(L.marker([order.vendorLat, order.vendorLng], { icon: dotIcon }).addTo(map).bindPopup(`<b>${order.vendor}</b><br/>₹${order.earnings} • ${order.items} items`));
        }
      });
      if (mapEl) mapEl._demandMarkers = demandMarkers;
    })();
    return () => { const mapEl = mapRef.current as (HTMLDivElement & { _demandMarkers?: Leaflet.Marker[] }) | null; if (mapEl?._demandMarkers) mapEl._demandMarkers.forEach((m) => m.remove()); };
  }, [pendingOrders]);

  useEffect(() => {
    if (!currentOrder?.id || !currentUserId) { setUnreadCount(0); return; }
    const orderId = currentOrder.id;
    async function loadUnread() {
      const { count } = await supabase.from("chat_messages").select("*", { count: "exact", head: true }).eq("order_id", orderId).neq("sender_id", currentUserId).eq("read", false);
      setUnreadCount(prev => { if (count && count > prev && prev > 0) playMessageAlert(); return count || 0; });
    }
    loadUnread();
    const channel = supabase.channel(`rider-unread-${orderId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `order_id=eq.${orderId}` }, () => { loadUnread(); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages", filter: `order_id=eq.${orderId}` }, () => { loadUnread(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentOrder?.id, currentUserId, supabase]);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission();
  }, []);

  function playMessageAlert() {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(t.rider.notifications.newMessage, { body: `Order #${currentOrder?.id?.slice(0, 8) || ""}`, icon: "/icon.png" });
    }
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch (_) { /* audio not supported */ }
  }

  const clearAllPendingOrders = async () => {
    try {
      const { error } = await supabase.from("orders").delete().is("rider_id", null).in("status", ["pending"]);
      if (error) throw error;
      setPendingOrders([]);
    } catch (err: unknown) { logger.error({ err }, "Clear failed"); }
  };

  const handleAccept = async (order: OrderWithTiming) => {
    let accepted = false;
    if (order.orderDbId && riderId) {
      try {
        const { data: success, error } = await supabase.rpc('accept_order_as_rider', { p_order_id: order.orderDbId, p_rider_id: riderId });
        if (!success || error) {
          setOrderTakenByOther(true);
          setTimeout(() => { setOrderTakenByOther(false); setPendingOrders(prev => prev.filter(o => o.id !== order.id)); setSelectedOrder(null); }, 2000);
          return;
        }
        accepted = true;
      } catch { /* silent */ }
    }
    if (!accepted && order.orderDbId && riderId) {
      const { error } = await supabase.from("orders").update({ rider_id: riderId, status: "accepted", accepted_at: new Date().toISOString() }).eq("id", order.orderDbId).is("rider_id", null);
      if (error) {
        setOrderTakenByOther(true);
        setTimeout(() => { setOrderTakenByOther(false); setPendingOrders(prev => prev.filter(o => o.id !== order.id)); setSelectedOrder(null); }, 2000);
        return;
      }
    }
    setPendingOrders(prev => prev.filter(o => o.id !== order.id));
    setActiveOrders(prev => [...prev, order]);
    setCurrentOrder(prev => prev || order);
    setSelectedOrder(null); setCountdown(300);
    setDeliveryStep(order.type === "multi_stop" ? "picking_up" : "shopping");
    if (order.orderDbId && riderId) startLocationTracking(riderId, order.orderDbId);
  };

  const handleDecline = async (orderId: string, reason?: string) => {
    setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    setSelectedOrder(null); setShowSkipModal(false); setCountdown(300);
    if (riderId && reason) {
      try {
        const { data: orderData } = await supabase.from("orders").select("id").eq("id", orderId).maybeSingle();
        if (orderData) {
          await fetch("/api/rider/cancel-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: orderData.id, rider_id: riderId, reason }) });
        }
      } catch { /* silent */ }
    }
  };

  const handleComplete = async () => {
    if (!currentOrder) return;
    const finalEarnings = calculateEarnings(currentOrder.totalDistance, 40, 8, currentOrder.peakMultiplier);
    try {
      if (currentOrder.orderDbId && riderId) {
        // 1. Credit wallet first (non-critical)
        try {
          const { data: wallet } = await supabase.from("rider_wallets").select("id, balance, total_earnings").eq("rider_id", riderId).maybeSingle();
          if (wallet) {
            await supabase.from("rider_wallets").update({ balance: (wallet.balance || 0) + finalEarnings, total_earnings: (wallet.total_earnings || 0) + finalEarnings }).eq("id", wallet.id);
          } else {
            await supabase.from("rider_wallets").insert({ rider_id: riderId, balance: finalEarnings, total_earnings: finalEarnings, pending_payout: 0, advance_used: 0 });
          }
          await supabase.from("rider_wallet").insert({ rider_id: riderId, amount: finalEarnings, type: "earning", description: `Delivery earnings for order #${currentOrder.orderDbId.slice(0, 8)}`, order_id: currentOrder.orderDbId, created_at: new Date().toISOString() });
        } catch (walletErr) { logger.error({ err: walletErr }, "Wallet credit failed (non-critical)"); }

        // 2. Update rider stats
        try { await supabase.from("riders").update({ total_deliveries: riderDeliveries + 1 }).eq("id", riderId); setRiderDeliveries((prev) => prev + 1); } catch { /* column may not exist */ }

        // 3. Update earnings + send notifications
        setRiderEarnings((prev) => prev + finalEarnings);
        if (currentOrder?.user_id) {
          try { await supabase.from("notifications").insert({ user_id: currentOrder.user_id, title: t.rider.notifications.orderDeliveredTitle, message: t.rider.notifications.orderDeliveredMsg, type: "order", read: false, created_at: new Date().toISOString() }); } catch { /* silent */ }
          try { await fetch("/api/emails/order-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: currentOrder.orderDbId, status: "delivered" }) }); } catch { /* silent */ }
        }

        // 4. Order status update LAST (critical — point of no return)
        const { error: orderErr } = await supabase.from("orders").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", currentOrder.orderDbId);
        if (orderErr) throw new Error("order update: " + orderErr.message);
      }
    } catch (e) { logger.error({ err: e }, "Failed to persist delivery"); }
    setCurrentOrder(null); stopLocationTracking();
    setActiveOrders(prev => {
      const remaining = prev.filter(o => o.id !== currentOrder?.id);
      if (remaining.length > 0) { setCurrentOrder(remaining[0]); setDeliveryStep("shopping"); }
      return remaining;
    });
  };

  const handlePickedUp = async () => {
    setDeliveryStep("delivering");
    if (currentOrder?.orderDbId && riderId) {
      try { await supabase.from("orders").update({ status: "on_the_way", picked_at: new Date().toISOString() }).eq("id", currentOrder.orderDbId); startLocationTracking(riderId, currentOrder.orderDbId); } catch { /* silent */ }
    }
  };

  const handleArrived = async () => {
    if (currentOrder?.type === "multi_stop" && currentOrder.stops && currentStopIndex < currentOrder.stops.length - 1) {
      setCurrentStopIndex(currentStopIndex + 1);
      if (currentOrder.orderDbId) { try { await supabase.from("orders").update({ delivery_notes: `Stop ${currentStopIndex + 2}/${currentOrder.stops.length} - ${currentOrder.stops[currentStopIndex + 1]?.name}` }).eq("id", currentOrder.orderDbId); } catch { /* silent */ } }
    } else {
      if (currentOrder?.orderDbId) { try { await supabase.from("orders").update({ status: "arrived", arrived_at: new Date().toISOString() }).eq("id", currentOrder.orderDbId); } catch { /* silent */ } }
      setDeliveryStep("arrived");
    }
  };

  const handleItemsCollected = async () => {
    if (currentOrder?.orderDbId) { try { await supabase.from("orders").update({ status: "picking_up" }).eq("id", currentOrder.orderDbId); } catch { /* silent */ } }
    setDeliveryStep("picking_up");
  };

  if (error) {
    const isNotRider = error === "You don't have a rider account yet.";
    return (
      <div className="min-h-screen bg-[var(--color-surface-container-lowest)] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          {isNotRider ? (
            <>
              <span className="material-symbols-outlined text-5xl text-amber-400 mb-4 block">motorcycle</span>
              <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">{t.rider.errors.notRiderYet}</h2>
              <p className="text-[var(--color-outline)] mb-2">{t.rider.errors.notRiderDesc}</p>
              <p className="text-[var(--color-outline)] mb-6">{t.rider.errors.notRiderCta}</p>
              <Link href="/rider/apply" className="inline-block px-6 py-3 bg-brand-secondary text-white rounded-xl font-bold">{t.rider.errors.applyToRider}</Link>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-5xl text-red-400 mb-4 block">wifi_off</span>
              <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">{t.rider.errors.unableToLoad}</h2>
              <p className="text-[var(--color-outline)] mb-6">{error}</p>
              <button onClick={() => window.location.reload()} className="px-6 py-3 bg-brand-secondary text-white rounded-xl font-bold">{t.rider.errors.tryAgain}</button>
            </>
          )}
        </div>
      </div>
    );
  }
  if (initialLoading) return <RiderDashboardSkeleton />;

  return (
    <div className="min-h-screen bg-background font-body-md text-on-surface">
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQoKJZPl" preload="auto" aria-hidden="true" />
      <DashboardHeader isOnline={isOnline} streakDays={streakDays} onToggleOnline={async () => { const newStatus = !isOnline; setOnline(newStatus); if (riderId) await supabase.from("riders").update({ is_online: newStatus }).eq("id", riderId); }} onOpenQuests={() => setShowQuestModal(true)} />
      {isOnline && pendingOrders.length > 1 && !currentOrder && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-brand-secondary/5 border-b border-brand-secondary/10 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-secondary text-sm">stacked_bar_chart</span>
            <span className="text-sm font-bold text-brand-secondary">{pendingOrders.length} {t.rider.stats.ordersAvailable}</span>
          </div>
          <button onClick={async () => { if (pendingOrders.length > 1 && !window.confirm(`Accept all ${pendingOrders.length} orders?`)) return; for (const order of pendingOrders) { await handleAccept(order); } }} className="px-4 py-1.5 bg-brand-secondary text-white text-xs font-bold rounded-full">{t.rider.stats.acceptAll}</button>
        </div>
      )}
      {snoozeMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">snooze</span>
          <span className="text-sm font-medium">{snoozeMessage}</span>
        </div>
      )}
      <main className="relative h-screen w-full pt-16">
        <div className="absolute inset-0 z-0"><div ref={mapRef} className="w-full h-full" style={{ opacity: isOnline ? 1 : 0.3, transition: "opacity 0.3s ease" }} /></div>
        {!currentOrder && pendingOrders.length > 0 && (
          <IncomingOrderCard order={pendingOrders[0]} countdown={countdown} customerRating={customerRating} onAccept={handleAccept} onDecline={() => setShowCancelModal(true)} isTakenByOther={orderTakenByOther} />
        )}
        {currentOrder && (
          <ActiveDeliveryView currentOrder={currentOrder} activeOrders={activeOrders} deliveryStep={deliveryStep} currentStopIndex={currentStopIndex} unreadCount={unreadCount} pickedItems={pickedItems} onSetCurrentOrder={(o) => { setCurrentOrder(o); setDeliveryStep("shopping"); }} onSetDeliveryStep={(s) => setDeliveryStep(s as "shopping" | "picking_up" | "picked" | "delivering" | "arrived")} onCallCustomer={() => setShowCallModal(true)} onStartChat={() => setShowChatModal(true)} onPickedUp={handlePickedUp} onArrived={handleArrived} onComplete={handleComplete} onItemsCollected={handleItemsCollected} onSetPickedItems={setPickedItems as (fn: (prev: Set<number>) => Set<number>) => void} />
        )}
        <MapControls onZoomIn={() => mapInstanceRef.current?.zoomIn()} onZoomOut={() => mapInstanceRef.current?.zoomOut()} onCenter={handleCenterMap} />
        {!(pendingOrders.length > 0 && !currentOrder) && (
          <QuickStats todayEarnings={todayEarnings} liveEarnings={liveEarnings} cashCollected={cashCollected} cashPending={cashPending} dndMode={dndMode} hasActiveOrder={!!currentOrder} deliveryStep={deliveryStep} />
        )}
      </main>
      <CallModal open={showCallModal} onClose={() => setShowCallModal(false)} name={currentOrder?.vendor} phone={currentOrder?.vendorPhone || currentOrder?.customerPhone} />
      {showChatModal && currentOrder && currentUserId && (
        <OrderChatOverlay orderId={currentOrder.id} currentUserId={currentUserId} senderType="rider" otherName={currentOrder.customer || "Customer"} onClose={() => setShowChatModal(false)} />
      )}
      <SkipOrderModal open={showSkipModal} onConfirm={() => handleDecline(pendingOrders[0]?.id || "")} onCancel={() => setShowSkipModal(false)} />
      <AlertSettingsModal open={showAlertSettings} soundEnabled={soundEnabled} vibrationEnabled={vibrationEnabled} onSoundChange={setSoundEnabled} onVibrationChange={setVibrationEnabled} onClearOrders={clearAllPendingOrders} onClose={() => setShowAlertSettings(false)} />
      <CancelOrderModal open={showCancelModal} reasons={cancelReasons} onSelectReason={(reason) => { handleDecline(pendingOrders[0]?.id || "", reason); setShowCancelModal(false); }} onClose={() => setShowCancelModal(false)} />
      <QuestModal open={showQuestModal} quests={dailyQuests} streakDays={streakDays} onClose={() => setShowQuestModal(false)} />
      <LowBatteryWarning visible={showLowBattery} level={batteryLevel} onDismiss={() => setShowLowBattery(false)} />
      <NewOrderBanner visible={showNewOrderAlert} order={pendingOrders[0] || null} onView={dismissNewOrderAlert} onDismiss={dismissNewOrderAlert} />
    </div>
  );
}
