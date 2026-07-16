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

        {step === "pick" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-blue-50 flex-shrink-0">
                <BlurImage src={service.image} alt={service.name} fill className="w-full h-full" sizes="56px" fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80" />
              </div>
              <div>
                <h2 id="booking-modal-title" className="font-black text-gray-900 text-lg">{service.name}</h2>
                <p className="text-blue-600 font-bold text-sm">
                  {service.priceMin && service.priceMax ? `\u20B9${service.priceMin} \u2013 \u20B9${service.priceMax}` : `\u20B9${service.price}`} \u2022 {service.duration}
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
              <div className="border-t border-gray-200 pt-3 flex justify-between"><span className="font-bold text-gray-900">{t.services.total}</span><span className="font-black text-blue-600 text-lg">\u20B9{service.price}</span></div>
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
      setLoadingServices(false);
    }
    loadServices();
  }, [supabase]);

  const mappedCategory = categoryIdMap[rawCategory] || null;
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryIdMap[rawCategory] ?? "all");
  const [bookingService, setBookingService] = useState<ServiceData | null>(null);

  const checkServiceability = useCallback(async () => { setIsServiceable(true); }, []);

  if (mappedCategory) {
    const setting = getSetting(mappedCategory as ServiceCategory);
    if (setting && !setting.isEnabled) {
      return <ServiceUnavailable serviceName={setting.name} message={setting.message} icon={setting.icon} />;
    }
  }

  const filteredServices = useMemo(() => {
    if (selectedCategory === "all") return dbServices;
    return dbServices.filter((s) => s.category === selectedCategory);
  }, [selectedCategory, dbServices]);

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
        <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3 border border-white/10">
          <span className="material-symbols-outlined text-white/70">search</span>
          <span className="text-white/50 text-sm">Search for services...</span>
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-400">Loading services...</p>
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
                      <div key={service.id} className="flex-shrink-0 w-64 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 card-lift">
                        <div className="relative h-32 overflow-hidden">
                          <BlurImage src={service.image} alt={service.name} fill className="w-full h-full" sizes="256px" fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          <span className="absolute top-2 left-2 bg-blue-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
                            {t.services[service.badge as keyof typeof t.services] || service.badge}
                          </span>
                          {service.originalPrice && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                              {Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)}% OFF
                            </span>
                          )}
                          <div className="absolute bottom-2 left-2 right-2">
                            <h3 className="text-white font-bold text-sm truncate">{service.name}</h3>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-white/80 text-[10px]">{service.duration}</span>
                              <span className="text-white font-black text-sm">\u20B9{service.price}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Services - Vertical Cards */}
              {filteredServices.map((service, index) => (
                <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden">
                    <BlurImage src={service.image} alt={service.name} fill className="w-full h-full" sizes="(max-width: 768px) 100vw, 50vw" fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    {service.badge && (
                      <span className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide shadow-md">
                        {t.services[service.badge as keyof typeof t.services] || service.badge}
                      </span>
                    )}
                    {service.originalPrice && (
                      <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                        {Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)}% OFF
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        {service.duration}
                      </span>
                      <span className="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        {service.rating}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Title & Rating */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 text-base leading-tight">{service.name}</h3>
                    </div>
                    <p className="text-xs text-gray-400">{service.reviews.toLocaleString()} {t.services.reviews}</p>

                    {/* What's Included */}
                    {service.included.length > 0 && (
                      <div className="mt-3 bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">{t.services.whatIncluded}</p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                          {service.included.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-blue-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                              <span className="text-xs text-gray-600 font-medium">{item.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-baseline gap-2">
                        {service.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">\u20B9{service.originalPrice}</span>
                        )}
                        <span className="font-black text-2xl text-gray-900">\u20B9{service.price}</span>
                      </div>
                      <button onClick={() => {
                        if (!isServiceable) { addToast(t.services.cannotBook, "error"); } else { setBookingService(service); }
                        if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
                      }} className={`px-6 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all ${
                        isServiceable
                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
