"use client";

import { useState, useEffect, Suspense, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useServiceSettingsStore, type ServiceCategory } from "@/lib/store/serviceSettingsStore";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import { useLocationStore } from "@/lib/store/locationStore";
import { useToastStore } from "@/lib/store/toastStore";
import { createClient } from "@/lib/supabase/client";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import PullToRefresh from "@/components/PullToRefresh";
import { SERVICE_TIME_SLOTS, type ServiceData } from "@/lib/data/services";
import BookingStepper from "@/components/BookingStepper";
import { motion, AnimatePresence } from "framer-motion";

// ---------- Booking Modal ----------
function BookingModal({ service, onClose }: { service: ServiceData; onClose: () => void }) {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const locationStore = useLocationStore();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState<"pick" | "confirm" | "done">("pick");
  const [booking, setBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const prefilledAddress = locationStore.displayAddress !== "Select Location" ? locationStore.displayAddress : "";
  const [address, setAddress] = useState(prefilledAddress);
  const [phone, setPhone] = useState("");
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const dateOptions = useMemo(() => {
    return [0, 1, 2, 3, 4].map((d) => {
      const date = new Date();
      date.setDate(date.getDate() + d);
      return {
        value: date.toISOString().split("T")[0],
        label:
          d === 0
            ? t.common.today
            : d === 1
              ? t.common.tomorrow
              : date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }),
      };
    });
  }, [t]);

  const canProceed = selectedDate && selectedSlot && address.trim() && phone.trim();

  const handleConfirmBooking = useCallback(async () => {
    if (booking) return;
    if (!address.trim()) {
      addToast(t.services.pleaseEnterAddress, "error");
      return;
    }
    if (!phone.trim()) {
      addToast(t.services.pleaseEnterPhone || "Please enter your phone number", "error");
      return;
    }
    setBooking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addToast("Please log in to book a service", "error");
        setBooking(false);
        return;
      }
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: service.category,
          sub_service: service.name,
          user_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Customer",
          user_phone: phone.trim(),
          address,
          scheduled_date: selectedDate,
          scheduled_time: selectedSlot,
          amount: service.price,
          notes: null,
          provider_id: null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Booking failed" }));
        addToast(err.error || "Booking failed. Please try again.", "error");
        setBooking(false);
        return;
      }
      setStep("done");
      if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
    } catch {
      addToast("Network error. Please try again.", "error");
      setBooking(false);
    }
  }, [booking, address, phone, selectedDate, selectedSlot, service, supabase, addToast, t]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
      <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl p-6 pb-10 max-h-[90vh] overflow-y-auto animate-slide-reveal">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" aria-hidden="true" />

        {step !== "done" && (
          <BookingStepper steps={[t.services.selectDate || "Details", t.services.confirmBooking || "Confirm", t.services.bookingConfirmed || "Done"]} current={step === "pick" ? 0 : 1} />
        )}

        {step === "pick" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-blue-50 flex-shrink-0">
                <BlurImage src={service.image} alt={service.name} fill className="w-full h-full" sizes="56px" fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80" />
              </div>
              <div>
                <h2 id="booking-modal-title" className="font-black text-gray-900 text-lg">{service.name}</h2>
                <p className="text-blue-600 font-bold text-sm">
                  {service.priceMin && service.priceMax ? `₹${service.priceMin} – ₹${service.priceMax}` : `₹${service.price}`} • {service.duration}
                </p>
              </div>
            </div>

            <p className="font-bold text-gray-900 mb-3 text-sm">{t.services.selectDate}</p>
            <div className="flex gap-2 flex-wrap mb-5" role="radiogroup" aria-label="Select date">
              {dateOptions.map((d) => (
                <button key={d.value} role="radio" aria-checked={selectedDate === d.value}
                  onClick={() => { setSelectedDate(d.value); if (navigator.vibrate) navigator.vibrate(10); }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${
                    selectedDate === d.value
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                      : "border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}>
                  {d.label}
                </button>
              ))}
            </div>

            <p className="font-bold text-gray-900 mb-3 text-sm">{t.services.selectTimeSlot}</p>
            <div className="grid grid-cols-2 gap-2 mb-5" role="radiogroup" aria-label="Select time slot">
              {SERVICE_TIME_SLOTS.map((slot) => (
                <button key={slot} role="radio" aria-checked={selectedSlot === slot}
                  onClick={() => { setSelectedSlot(slot); if (navigator.vibrate) navigator.vibrate(10); }}
                  className={`p-3 rounded-xl text-xs font-bold border-2 transition-all text-left active:scale-[0.98] ${
                    selectedSlot === slot
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                      : "border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}>
                  {slot}
                </button>
              ))}
            </div>

            <p className="font-bold text-gray-900 mb-2 text-sm">{t.services.serviceAddress}</p>
            <textarea className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none resize-none mb-4" rows={2} placeholder={t.services.addressPlaceholder} value={address} onChange={(e) => setAddress(e.target.value)} aria-label={t.services.serviceAddress} />

            <p className="font-bold text-gray-900 mb-2 text-sm">{t.services.phoneNumber || "Phone Number"}</p>
            <input type="tel" className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-blue-500 focus:outline-none mb-5" placeholder={t.services.phonePlaceholder || "Enter your phone number"} value={phone} onChange={(e) => setPhone(e.target.value)} aria-label={t.services.phoneNumber || "Phone Number"} inputMode="numeric" maxLength={15} />

            <button disabled={!canProceed} onClick={() => {
              if (!selectedDate) { addToast(t.services.pleaseSelectDate, "error"); return; }
              if (!selectedSlot) { addToast(t.services.pleaseSelectTime, "error"); return; }
              if (!address.trim()) { addToast(t.services.pleaseEnterAddress, "error"); return; }
              setStep("confirm");
              if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
            }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base disabled:opacity-40 hover:bg-blue-700 transition-all active:scale-[0.98]">
              {t.services.reviewBooking}
            </button>
            <button onClick={() => { onClose(); if (navigator.vibrate) navigator.vibrate(10); }} className="w-full mt-3 py-3 text-gray-400 font-semibold text-sm hover:text-gray-600 transition-colors">
              {t.common.cancel}
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <h2 id="booking-modal-title" className="font-black text-xl text-gray-900 mb-6">{t.services.confirmBooking}</h2>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-6 border border-gray-100">
              <div className="flex justify-between"><span className="text-gray-500 text-sm">{t.services.service}</span><span className="font-bold text-gray-900 text-sm text-right">{service.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 text-sm">{t.services.date}</span><span className="font-bold text-gray-900 text-sm">{new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 text-sm">{t.services.time}</span><span className="font-bold text-gray-900 text-sm">{selectedSlot}</span></div>
              {address && <div className="flex justify-between"><span className="text-gray-500 text-sm">{t.services.address}</span><span className="font-bold text-gray-900 text-sm text-right max-w-[60%]">{address}</span></div>}
              <div className="border-t border-gray-200 pt-3 flex justify-between"><span className="font-bold text-gray-900">{t.services.total}</span><span className="font-black text-blue-600 text-lg">₹{service.price}</span></div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2 mb-5">
              <span className="material-symbols-outlined text-blue-600 text-sm mt-0.5">info</span>
              <p className="text-xs text-blue-700">{t.services.paymentAfterService}</p>
            </div>
            <button onClick={handleConfirmBooking} disabled={booking} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
              {booking ? (<><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />{t.services.booking}</>) : t.services.confirmAndBook}
            </button>
            <button onClick={() => { setStep("pick"); if (navigator.vibrate) navigator.vibrate(10); }} className="w-full mt-3 py-3 text-gray-400 font-semibold text-sm hover:text-gray-600 transition-colors">{t.services.goBack}</button>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-8 animate-pop-in">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-blue-600 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h2 className="font-black text-2xl text-gray-900 mb-2">{t.services.bookingConfirmed}</h2>
            <p className="text-gray-500 mb-1">{service.name}</p>
            <p className="font-bold text-blue-600 mb-1">{new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}</p>
            <p className="text-gray-500 font-semibold mb-6">{selectedSlot}</p>
            <p className="text-sm text-gray-400 mb-8">{t.services.bookingConfirmedDesc}</p>
            <button onClick={() => { onClose(); if (navigator.vibrate) navigator.vibrate([20, 10, 20]); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base hover:bg-blue-700 transition-all active:scale-[0.98]">{t.common.done}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Main Page ----------
function ServicesContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { getSetting } = useServiceSettingsStore();
  const [isServiceable, setIsServiceable] = useState(true);
  const locationStore = useLocationStore();
  const userPincode = locationStore.pincode;
  const userCity = locationStore.city;
  const { addToast } = useToastStore();
  const supabase = useMemo(() => createClient(), []);
  const [dbCategories, setDbCategories] = useState<{ id: string; name: string; slug: string; icon: string; color: string; bg: string }[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [dbServices, setDbServices] = useState<ServiceData[]>([]);

  const rawCategory = searchParams.get("category") ?? "all";

  const categoryIdMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    dbCategories.forEach((cat) => { map[cat.slug] = cat.slug; map[cat.name] = cat.slug; });
    return map;
  }, [dbCategories]);

  useEffect(() => {
    async function loadServices() {
      setLoadingServices(true);
      try {
        const { data: cats } = await supabase.from("service_categories").select("id, name, slug, icon").eq("is_active", true).order("display_order");
        if (cats) {
          const colors = ["text-blue-600", "text-emerald-600", "text-cyan-600", "text-amber-600", "text-pink-600", "text-red-600", "text-purple-600", "text-orange-600", "text-indigo-600", "text-teal-600"];
          const bgs = ["bg-blue-50", "bg-emerald-50", "bg-cyan-50", "bg-amber-50", "bg-pink-50", "bg-red-50", "bg-purple-50", "bg-orange-50", "bg-indigo-50", "bg-teal-50"];
          const mapped = cats.map((c: { id: string; name: string; slug: string | null; icon: string }, i: number) => ({
            id: c.id, name: c.name, slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "_").replace(/&/g, ""), icon: c.icon || "home_repair_service", color: colors[i % colors.length], bg: bgs[i % bgs.length],
          }));
          setDbCategories(mapped);
          const catIds = cats.map((c: { id: string }) => c.id);
          if (catIds.length > 0) {
            const { data: items } = await supabase.from("service_items").select("*, service_categories!inner(name)").in("category_id", catIds).eq("is_active", true).order("sort_order");
            if (items) {
              const mappedItems: ServiceData[] = items.map((item: Record<string, unknown>) => {
                const cat = item.service_categories as { name: string } | null;
                const catObj = mapped.find((c: { name: string }) => c.name === cat?.name);
                return {
                  id: item.id as string, name: item.name as string, category: catObj?.slug ?? "", rating: Number(item.rating) || 0, reviews: Number(item.reviews) || 0, price: Number(item.price),
                  priceMin: item.price_min != null ? Number(item.price_min) : undefined, priceMax: item.price_max != null ? Number(item.price_max) : undefined, originalPrice: item.original_price != null ? Number(item.original_price) : undefined,
                  duration: (item.duration as string) || "", image: (item.image_url as string) || "", included: (item.included as string[]) || [], warranty_days: Number(item.warranty_days) || 7, badge: (item.badge as string) || undefined, description: (item.description as string) || "",
                };
              });
              setDbServices(mappedItems);
            }
          }
        }
      } catch {
        // Supabase query failed — show empty state
      }
      setLoadingServices(false);
    }
    loadServices();
  }, [supabase]);

  const mappedCategory = categoryIdMap[rawCategory] || null;
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryIdMap[rawCategory] ?? "all");
  const [bookingService, setBookingService] = useState<ServiceData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const mapped = categoryIdMap[rawCategory];
    if (mapped) setSelectedCategory(mapped);
  }, [categoryIdMap, rawCategory]);

  const checkServiceability = useCallback(async () => { setIsServiceable(true); }, []);

  if (mappedCategory) {
    const setting = getSetting(mappedCategory as ServiceCategory);
    if (setting && !setting.isEnabled) {
      return <ServiceUnavailable serviceName={setting.name} message={setting.message} icon={setting.icon} />;
    }
  }

  const filteredServices = useMemo(() => {
    let results = selectedCategory === "all" ? dbServices : dbServices.filter((s) => s.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.included.some((item) => item.toLowerCase().includes(q)),
      );
    }
    return results;
  }, [selectedCategory, dbServices, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Blue Header */}
      <header className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 px-4 pt-12 pb-6 sticky top-0 z-30">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/app/home" aria-label="Back" className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">{t.services.title}</h1>
            <p className="text-blue-100 text-xs mt-0.5">{t.services.subtitle}</p>
          </div>
          <Link href="/app/cart" className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20">
            <span className="material-symbols-outlined">shopping_cart</span>
          </Link>
        </div>
        {/* Search */}
        <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3 border border-white/10 focus-within:border-white/30 transition-colors">
          <span className="material-symbols-outlined text-white/70">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for services..."
            className="bg-transparent text-white text-sm placeholder-white/50 outline-none flex-1"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-white/50 hover:text-white/80">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </header>

      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: t.services.homeServices }]} />

      <PullToRefresh onRefresh={checkServiceability}>
        {/* Location Banner */}
        {(userPincode || userCity) && (
          <div className={`mx-4 mt-3 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold ${isServiceable ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
            <span className={`material-symbols-outlined text-sm ${isServiceable ? "text-emerald-600" : "text-amber-600"}`}>{isServiceable ? "location_on" : "warning"}</span>
            {isServiceable
              ? <span>Services available in {userPincode || userCity}</span>
              : <span>{t.services.notServiceable} {userPincode || userCity}</span>
            }
          </div>
        )}

        {/* Hero Banner */}
        <div className="px-4 mt-4">
          <div className="rounded-2xl overflow-hidden relative h-40 shadow-lg shadow-blue-600/10">
            <BlurImage src="/images/services_hero.png" alt="Professional Services" fill className="w-full h-full" sizes="100vw" fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/50 to-transparent flex flex-col justify-end p-5">
              <h2 className="text-white text-xl font-black leading-tight">{t.services.expertProfessionals}</h2>
              <p className="text-blue-100 text-xs mt-1">{t.services.expertDesc}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Verified Pros</span>
                <span className="bg-emerald-500/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Top Rated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Circles - GKB Style */}
        <div className="px-4 py-5">
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            <button onClick={() => { setSelectedCategory("all"); if (navigator.vibrate) navigator.vibrate(10); }}
              className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${selectedCategory === "all" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "bg-white text-gray-600 border border-gray-200"}`}>
                <span className="material-symbols-outlined text-xl">apps</span>
              </div>
              <span className={`text-[10px] font-bold ${selectedCategory === "all" ? "text-blue-600" : "text-gray-500"}`}>{t.services.all}</span>
            </button>
            {dbCategories.map((cat) => (
              <button key={cat.id} onClick={() => { setSelectedCategory(cat.slug as ServiceCategory); if (navigator.vibrate) navigator.vibrate(10); }}
                className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${selectedCategory === cat.slug ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "bg-white text-gray-600 border border-gray-200"}`}>
                  <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                </div>
                <span className={`text-[10px] font-bold text-center max-w-[56px] truncate ${selectedCategory === cat.slug ? "text-blue-600" : "text-gray-500"}`}>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Services List */}
        <main className="px-4 space-y-4 pb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-gray-900">
              {selectedCategory === "all" ? "All Services" : dbCategories.find(c => c.slug === selectedCategory)?.name || "Services"}
            </h2>
            <span className="text-xs font-bold text-gray-400">{filteredServices.length} services</span>
          </div>

          {loadingServices ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10">
                  <div className="h-36 bg-surface-container animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-surface-container rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-surface-container rounded w-1/2 animate-pulse" />
                    <div className="h-3 bg-surface-container rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
              <span className="material-symbols-outlined text-gray-300 text-5xl mb-3">search_off</span>
              <p className="font-bold text-gray-900 text-lg mb-1">{t.services.noServices || "No services found"}</p>
              <p className="text-sm text-gray-400 mb-4">{t.services.tryDifferentCategory || "Try selecting a different category"}</p>
              <button onClick={() => setSelectedCategory("all")} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-all">
                {t.services.showAll || "Show All Services"}
              </button>
            </div>
          ) : (
            <>
              {/* Featured Services - Horizontal Scroll */}
              {filteredServices.some(s => s.badge) && (
                <div className="mb-2">
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {filteredServices.filter(s => s.badge).map((service) => (
                      <div key={service.id} className="flex-shrink-0 w-64 bg-surface-container-lowest rounded-3xl overflow-hidden shadow-editorial-sm border border-outline/5 card-lift">
                        <div className="relative h-36 overflow-hidden">
                          <BlurImage src={service.image} alt={service.name} fill className="w-full h-full object-cover" sizes="256px" fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <span className="absolute top-2 left-2 bg-primary text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-md">
                            {t.services[service.badge as keyof typeof t.services] || service.badge}
                          </span>
                          {service.originalPrice && (
                            <span className="absolute top-2 right-2 bg-status-error text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">
                              {Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)}% OFF
                            </span>
                          )}
                          <div className="absolute bottom-2 left-2 right-2">
                            <h3 className="text-white font-bold text-sm truncate">{service.name}</h3>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-white/80 text-[10px]">{service.duration}</span>
                               <span className="text-white font-black text-sm">{"₹"}{service.price}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Rated Services */}
              {filteredServices.length > 3 && (() => {
                const topRated = [...filteredServices].filter(s => s.rating > 0).sort((a, b) => b.rating - a.rating).slice(0, 6);
                if (topRated.length === 0) return null;
                return (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">⭐</span>
                      <h2 className="text-lg font-bold text-on-surface">Top Rated</h2>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {topRated.map((service) => (
                        <Link key={`top-${service.id}`} href={`/app/services/${service.id}`} className="flex-shrink-0 w-36 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-editorial-sm border border-outline/5 active:scale-[0.97] transition-transform">
                          <div className="relative h-24 overflow-hidden">
                            <BlurImage src={service.image} alt={service.name} fill className="w-full h-full object-cover" sizes="144px" fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80" />
                            <span className="absolute top-1.5 right-1.5 bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-md">
                              <span className="text-[8px]">★</span> {service.rating}
                            </span>
                          </div>
                          <div className="p-3">
                            <h3 className="font-bold text-on-surface text-[11px] truncate">{service.name}</h3>
                            <p className="text-[10px] font-bold text-primary mt-0.5">₹{service.price}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* All Services - Vertical Cards */}
              {filteredServices.map((service, index) => (
                <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-editorial-sm border border-outline/5">
                  {/* Image */}
                  <div className="relative h-36 overflow-hidden">
                    <BlurImage src={service.image} alt={service.name} fill className="w-full h-full object-cover" sizes="(max-width: 768px) 100vw, 50vw" fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    {service.badge && (
                      <span className="absolute top-2 left-2 bg-primary text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-md">
                        {t.services[service.badge as keyof typeof t.services] || service.badge}
                      </span>
                    )}
                    {service.originalPrice && (
                      <span className="absolute top-2 right-2 bg-status-error text-white text-[9px] font-black px-2 py-1 rounded-full shadow-md">
                        {Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)}% OFF
                      </span>
                    )}
                    <div className="absolute bottom-2 left-2 flex gap-1.5">
                      <span className="bg-white/95 backdrop-blur-sm text-on-surface text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        {service.duration}
                      </span>
                      {service.rating > 0 && (
                        <span className="bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {service.rating}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Title & Reviews */}
                    <h3 className="font-bold text-on-surface text-base leading-tight">{service.name}</h3>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">{service.reviews > 0 ? `${service.reviews.toLocaleString()} ${t.services.reviews}` : ""}</p>

                    {/* What's Included */}
                    {service.included.length > 0 && (
                      <div className="mt-3 bg-surface-container-low rounded-xl p-3">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">{t.services.whatIncluded}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {service.included.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-status-success text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                              <span className="text-[11px] text-on-surface font-medium">{item.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline/10">
                      <div className="flex items-baseline gap-1.5">
                        {service.originalPrice && (
                          <span className="text-xs text-on-surface-variant line-through">{"₹"}{service.originalPrice}</span>
                        )}
                        <span className="font-black text-xl text-on-surface">{"₹"}{service.price}</span>
                      </div>
                      <button onClick={() => {
                        if (!isServiceable) { addToast(t.services.cannotBook, "error"); } else { setBookingService(service); }
                        if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
                      }} className={`px-5 py-2 rounded-xl font-bold text-xs active:scale-95 transition-all ${
                        isServiceable
                          ? "bg-primary text-white hover:bg-primary-dim shadow-md shadow-primary/20"
                          : "bg-surface-container text-on-surface-variant cursor-not-allowed"
                      }`}>
                        {isServiceable ? t.services.bookNow : t.services.unavailable}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </main>
      </PullToRefresh>

      {bookingService && <BookingModal service={bookingService} onClose={() => setBookingService(null)} />}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    }>
      <ServicesContent />
    </Suspense>
  );
}
