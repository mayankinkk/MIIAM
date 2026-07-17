"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import { SERVICE_TIME_SLOTS, type ServiceData } from "@/lib/data/services";
import { motion } from "framer-motion";

function ServiceDetailContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const serviceId = (params.id as string) || "";
  const supabase = useMemo(() => createClient(), []);
  const [service, setService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadService() {
      if (!serviceId) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("service_items")
        .select("*, service_categories!inner(name)")
        .eq("id", serviceId)
        .single();
      if (error || !data) { setLoading(false); return; }
      const cat = data.service_categories as { name: string } | null;
      const catName = cat?.name?.toLowerCase().replace(/\s+/g, "_").replace(/&/g, "") ?? "";
      setService({
        id: data.id, name: data.name, category: catName, rating: Number(data.rating) || 0, reviews: Number(data.reviews) || 0,
        price: Number(data.price), priceMin: data.price_min != null ? Number(data.price_min) : undefined,
        priceMax: data.price_max != null ? Number(data.price_max) : undefined, originalPrice: data.original_price != null ? Number(data.original_price) : undefined,
        duration: data.duration || "", image: data.image_url || "", included: (data.included as string[]) || [],
        warranty_days: Number(data.warranty_days) || 7, badge: data.badge || undefined, description: data.description || "",
      });
      setLoading(false);
    }
    loadService();
  }, [serviceId, supabase]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const handleBook = useCallback(async () => {
    if (!service) return;
    if (!selectedDate || !selectedTime) { setError("Please select both date and time"); return; }
    setAdding(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Please login to book"); setAdding(false); return; }
      const dateObj = new Date(selectedDate);
      const isoDate = dateObj.toISOString().split("T")[0];
      const res = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_type: service.category, sub_service: service.name, user_name: user.user_metadata?.full_name || "", user_phone: user.user_metadata?.phone || "", address: "", scheduled_date: isoDate, scheduled_time: selectedTime, amount: service.price, notes: null, provider_id: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      router.push(`/app/bookings/confirmation?id=${data.booking?.id || ""}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally { setAdding(false); }
  }, [service, selectedDate, selectedTime, supabase, router]);

  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => { const date = new Date(); date.setDate(date.getDate() + i); return date; }), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <span className="material-symbols-outlined text-gray-300 text-5xl">search_off</span>
        <h1 className="text-xl font-bold text-gray-900">{t.services.serviceNotFound || "Service not found"}</h1>
        <p className="text-gray-400 text-sm text-center">{t.services.serviceNotFoundDesc || "The service you're looking for doesn't exist or has been removed."}</p>
        <button onClick={() => router.push("/app/services")} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-all">{t.services.browseServices || "Browse Services"}</button>
      </div>
    );
  }

  const datesDisplay = dates.map(d => ({
    full: d, label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
    short: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
  }));

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        <BlurImage src={service.image} alt={service.name} fill className="w-full h-full object-cover" sizes="100vw" fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-gray-900/10" />
        {/* Nav */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 pt-12 pb-3">
          <button onClick={() => router.back()} aria-label="Go back" className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="text-lg font-black text-white tracking-tight">MIIAM</span>
          <div className="w-10" />
        </div>
        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {service.badge && (
            <span className="inline-block bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide mb-2 shadow-md">
              {t.services[service.badge as keyof typeof t.services] || service.badge}
            </span>
          )}
          <h1 className="text-white font-black text-2xl leading-tight">{service.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            {service.rating > 0 && (
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <span style={{ fontVariationSettings: "'FILL' 1" }}>★</span> {service.rating}
              </span>
            )}
            {service.reviews > 0 && <span className="text-white/70 text-xs">{service.reviews.toLocaleString()} {t.services.reviews}</span>}
            {service.rating > 0 && service.reviews > 0 && <span className="text-white/40">•</span>}
            <span className="text-white/70 text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">schedule</span> {service.duration}
            </span>
          </div>
        </div>
      </div>

      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: t.services.homeServices, href: "/app/services" }, { label: service.name }]} />

      <div className="px-4 -mt-4 relative z-10 space-y-4">
        {/* Description */}
        {service.description && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500 text-lg">info</span> About
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">{service.description}</p>
          </motion.div>
        )}

        {/* What's Included */}
        {service.included.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500 text-lg">checklist</span> {t.services.whatIncluded}
            </h3>
            <div className="space-y-2.5">
              {service.included.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-blue-600 text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  </div>
                  <span className="text-sm text-gray-600">{item}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="material-symbols-outlined text-blue-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="text-xs text-gray-400">{t.services.warrantyDays?.replace("{days}", String(service.warranty_days)) || `${service.warranty_days}-day warranty`}</span>
            </div>
          </motion.div>
        )}

        {/* Date & Time Selection */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500 text-lg">calendar_today</span> {t.services.selectDate}
          </h3>

          {/* Date Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
            {datesDisplay.map((d, i) => (
              <button key={i} onClick={() => { setSelectedDate(d.label); if (navigator.vibrate) navigator.vibrate(10); }}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                  selectedDate === d.label
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                <div className="text-center">
                  <div>{d.full.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                  <div className="text-[10px] mt-0.5 opacity-70">{d.full.toLocaleDateString("en-IN", { month: "short" })}</div>
                </div>
              </button>
            ))}
          </div>

          <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500 text-lg">schedule</span> {t.services.selectTimeSlot}
          </h3>

          {/* Time Slots */}
          <div className="grid grid-cols-2 gap-2">
            {SERVICE_TIME_SLOTS.map((slot) => (
              <button key={slot} onClick={() => { setSelectedTime(slot); if (navigator.vibrate) navigator.vibrate(10); }}
                className={`p-3 rounded-xl text-xs font-bold transition-all text-left active:scale-[0.98] ${
                  selectedTime === slot
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {slot}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Price Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              {service.priceMin && service.priceMax ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-gray-400">Starting at</span>
                  <span className="text-2xl font-black text-gray-900">₹{service.priceMin}</span>
                  <span className="text-sm text-gray-400">– ₹{service.priceMax}</span>
                </div>
              ) : (
                <span className="text-2xl font-black text-gray-900">₹{service.price}</span>
              )}
              {service.originalPrice && (
                <span className="text-sm text-gray-400 line-through ml-2">₹{service.originalPrice}</span>
              )}
            </div>
            <span className="text-xs text-gray-400">{t.checkout.incTaxes}</span>
          </div>
        </motion.div>

        {/* Rating Card */}
        {service.rating > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-black text-gray-900">{service.rating}</p>
                <div className="flex justify-center gap-0.5 mt-1">
                  {[1,2,3,4,5].map((s) => (
                    <span key={s} className={`text-sm ${s <= Math.round(service.rating) ? "text-amber-400" : "text-gray-200"}`}>★</span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{service.reviews} reviews</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5,4,3,2,1].map((star) => {
                  const count = Math.round((service.reviews || 0) * (star === Math.round(service.rating) ? 0.6 : star === Math.round(service.rating) - 1 ? 0.25 : star === Math.round(service.rating) + 1 ? 0.15 : 0));
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-3">{star}</span>
                      <span className="text-amber-400 text-[10px]">★</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min((count / Math.max(service.reviews || 1, 1)) * 100 * 5, 100)}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400 w-5 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {service.badge && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                {service.badge === "mostPopular" && <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-200">Most Popular</span>}
                {service.badge === "bestSeller" && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-200">Best Seller</span>}
              </div>
            )}
          </motion.div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600" role="alert">{error}</div>
        )}
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-8" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
        <button onClick={handleBook} disabled={adding || !selectedDate || !selectedTime}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2">
          {adding ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
          )}
          {adding ? t.common.loading : (!selectedDate || !selectedTime ? "Select date & time" : t.services.bookNow)}
        </button>
      </div>
    </div>
  );
}

export default function ServiceDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    }>
      <ServiceDetailContent />
    </Suspense>
  );
}
