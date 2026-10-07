"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import BlurImage from "@/components/BlurImage";
import { SERVICE_TIME_SLOTS, type ServiceData } from "@/lib/data/services";
import { motion } from "framer-motion";

function ServiceDetailContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const serviceId = (params.id as string) || "";
  const supabase = useMemo(() => createClient(), []);
  const { addToast } = useToastStore();
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
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const handleBook = useCallback(async () => {
    if (!service) return;
    if (!selectedDate || !selectedTime) { setError("Please select both date and time"); return; }
    if (!address.trim()) { setError("Please enter your address"); return; }
    if (phone.length < 10) { setError("Please enter a valid phone number"); return; }
    setAdding(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Please login to book"); setAdding(false); return; }
      const res = await fetch("/api/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_type: service.category, sub_service: service.name, user_name: user.user_metadata?.full_name || "", user_phone: phone, address, scheduled_date: selectedDate, scheduled_time: selectedTime, amount: service.price, notes: null, provider_id: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      router.push(`/app/bookings/confirmation?id=${data.booking?.id || ""}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally { setAdding(false); }
  }, [service, selectedDate, selectedTime, address, phone, supabase, router]);

  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => { const date = new Date(); date.setDate(date.getDate() + i); return date; }), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="h-14 border-b border-outline-variant/60 flex items-center gap-3 px-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3 w-32 bg-surface-container-high animate-pulse rounded" />
            <div className="h-2.5 w-20 bg-surface-container-high animate-pulse rounded" />
          </div>
        </div>
        <div className="w-full aspect-square max-h-[70vh] bg-surface-container-high animate-pulse" />
        <div className="px-4 py-4 space-y-3">
          <div className="h-5 w-2/3 bg-surface-container-high animate-pulse rounded" />
          <div className="h-3 w-1/2 bg-surface-container-high animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-4">
        <span className="material-symbols-outlined text-on-surface-variant/30 text-5xl">search_off</span>
        <h1 className="text-xl font-bold text-on-surface">{t.services.serviceNotFound || "Service not found"}</h1>
        <p className="text-on-surface-variant text-sm text-center">{t.services.serviceNotFoundDesc || "The service you're looking for doesn't exist or has been removed."}</p>
        <button onClick={() => router.push("/app/services")} className="mt-4 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm active:scale-95 transition-all">{t.services.browseServices || "Browse Services"}</button>
      </div>
    );
  }

  const datesDisplay = dates.map(d => ({
    full: d, iso: d.toISOString().split("T")[0], label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
    short: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
  }));

  const savings = service.originalPrice ? service.originalPrice - service.price : 0;

  return (
    <div className="min-h-screen bg-surface pb-44 md:pb-32">
      {/* Sticky header — back / name + duration / share */}
      <header className="sticky top-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/60">
        <div className="h-14 flex items-center gap-1 px-2">
          <button onClick={() => router.back()} aria-label="Go back" className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high active:scale-90 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1 min-w-0 px-1">
            <p className="text-[13px] font-bold text-on-surface truncate">{service.name}</p>
            <p className="text-[11px] text-on-surface-variant truncate">{service.duration}</p>
          </div>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: service.name, text: `${service.name} — ₹${service.price} on MIIAM`, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                addToast("Link copied to clipboard", "success");
              }
            }}
            aria-label="Share service"
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </header>

      {/* Full-bleed image with overlay chips */}
      <div className="relative w-full aspect-square max-h-[70vh] overflow-hidden bg-surface-container">
        <BlurImage src={service.image} alt={service.name} fill className="w-full h-full object-cover" sizes="100vw" fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80" />
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
          {service.badge && (
            <span className="bg-primary text-on-primary text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-md">
              {t.services[service.badge as keyof typeof t.services] || service.badge}
            </span>
          )}
          {service.rating > 0 && (
            <span className="bg-white text-accent text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              {service.rating}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <section className="px-4 py-4 border-b border-outline-variant/60">
        <h1 className="text-[17px] font-bold text-on-surface leading-snug">{service.name}</h1>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">schedule</span> {service.duration}
          </span>
          {service.reviews > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px] text-accent" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              {service.rating} ({service.reviews})
            </span>
          )}
        </div>
      </section>

      {/* Description */}
      {service.description && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-4 border-b border-outline-variant/60">
          <h3 className="font-bold text-on-surface text-[15px] mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-accent text-lg">info</span> About
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">{service.description}</p>
        </motion.section>
      )}

      {/* What's Included */}
      {service.included.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="px-4 py-4 border-b border-outline-variant/60">
          <h3 className="font-bold text-on-surface text-[15px] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-accent text-lg">checklist</span> {t.services.whatIncluded}
          </h3>
          <div className="space-y-2.5">
            {service.included.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 bg-accent/10 text-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
                <span className="text-sm text-on-surface">{item}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-outline-variant/40">
            <span className="material-symbols-outlined text-accent text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="text-xs text-on-surface-variant">{t.services.warrantyDays?.replace("{days}", String(service.warranty_days)) || `${service.warranty_days}-day warranty`}</span>
          </div>
        </motion.section>
      )}

      {/* Date & Time Selection */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="px-4 py-4 border-b border-outline-variant/60">
        <h3 className="font-bold text-on-surface text-[15px] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-accent text-lg">calendar_today</span> {t.services.selectDate}
        </h3>

        {/* Date Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1" role="radiogroup" aria-label="Select date">
          {datesDisplay.map((d, i) => (
            <button key={i} role="radio" aria-checked={selectedDate === d.iso}
              onClick={() => { setSelectedDate(d.iso); if (navigator.vibrate) navigator.vibrate(10); }}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                selectedDate === d.iso
                  ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}>
              <div className="text-center">
                <div>{d.full.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                <div className="text-[10px] mt-0.5 opacity-70">{d.full.toLocaleDateString("en-IN", { month: "short" })}</div>
              </div>
            </button>
          ))}
        </div>

        <h3 className="font-bold text-on-surface text-[15px] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-accent text-lg">schedule</span> {t.services.selectTimeSlot}
        </h3>

        {/* Time Slots */}
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Select time slot">
          {SERVICE_TIME_SLOTS.map((slot) => (
            <button key={slot} role="radio" aria-checked={selectedTime === slot}
              onClick={() => { setSelectedTime(slot); if (navigator.vibrate) navigator.vibrate(10); }}
              className={`p-3 rounded-xl text-xs font-bold transition-all text-left active:scale-[0.98] ${
                selectedTime === slot
                  ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}>
              {slot}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Address & Phone */}
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="px-4 py-4 border-b border-outline-variant/60">
        <h3 className="font-bold text-on-surface text-[15px] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-accent text-lg">location_on</span> Service Address
        </h3>
        <textarea
          className="w-full border-2 border-outline rounded-xl p-3 text-sm focus:border-primary focus:outline-none resize-none mb-3 text-on-surface bg-surface"
          rows={2}
          placeholder="Enter your full address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          aria-label="Service address"
        />
        <h3 className="font-bold text-on-surface text-[15px] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-accent text-lg">phone</span> Phone Number
        </h3>
        <input
          type="tel"
          className="w-full border-2 border-outline rounded-xl p-3 text-sm focus:border-primary focus:outline-none text-on-surface bg-surface"
          placeholder="Enter your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          inputMode="numeric"
          maxLength={10}
          aria-label="Phone number"
        />
      </motion.section>

      {error && (
        <div className="px-4 pt-4" role="alert">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        </div>
      )}

      {/* Sticky bottom bar — price + Book Now (Blinkit style), sits above bottom nav */}
      <div className="fixed bottom-[80px] left-0 right-0 md:left-auto md:right-6 md:max-w-md z-40 bg-surface-container-lowest border-t md:border md:rounded-2xl border-outline-variant/60 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] md:shadow-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              {service.priceMin && service.priceMax ? (
                <>
                  <span className="text-lg font-black text-on-surface">₹{service.priceMin}</span>
                  <span className="text-sm text-on-surface-variant">– ₹{service.priceMax}</span>
                </>
              ) : (
                <span className="text-lg font-black text-on-surface">₹{service.price}</span>
              )}
              {service.originalPrice && (
                <span className="text-sm text-on-surface-variant line-through">₹{service.originalPrice}</span>
              )}
            </div>
            <p className="text-[11px] font-bold leading-tight text-green-600">
              {service.originalPrice ? `You save ₹${savings}` : t.checkout.incTaxes}
            </p>
          </div>
          <button onClick={handleBook} disabled={adding || !selectedDate || !selectedTime}
            className="shrink-0 bg-primary text-on-primary px-5 py-3 rounded-xl font-black text-sm shadow-md shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 whitespace-nowrap">
            {adding ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            )}
            {adding ? t.common.loading : (!selectedDate || !selectedTime || !address.trim() || phone.length < 10 ? "Fill details to book" : t.services.bookNow)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ServiceDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <ServiceDetailContent />
    </Suspense>
  );
}
