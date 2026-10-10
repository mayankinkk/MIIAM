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
      if (!serviceId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("service_items")
        .select("*, service_categories!inner(name)")
        .eq("id", serviceId)
        .single();
      if (error || !data) {
        setLoading(false);
        return;
      }
      const cat = data.service_categories as { name: string } | null;
      const catName = cat?.name?.toLowerCase().replace(/\s+/g, "_").replace(/&/g, "") ?? "";
      setService({
        id: data.id,
        name: data.name,
        category: catName,
        rating: Number(data.rating) || 0,
        reviews: Number(data.reviews) || 0,
        price: Number(data.price),
        priceMin: data.price_min != null ? Number(data.price_min) : undefined,
        priceMax: data.price_max != null ? Number(data.price_max) : undefined,
        originalPrice: data.original_price != null ? Number(data.original_price) : undefined,
        duration: data.duration || "",
        image: data.image_url || "",
        included: (data.included as string[]) || [],
        warranty_days: Number(data.warranty_days) || 7,
        badge: data.badge || undefined,
        description: data.description || "",
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
    if (!selectedDate || !selectedTime) {
      setError("Please select both date and time");
      return;
    }
    if (!address.trim()) {
      setError("Please enter your address");
      return;
    }
    if (phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    setAdding(true);
    setError("");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Please login to book");
        setAdding(false);
        return;
      }
      // Pull dropoff coords from the most relevant saved address (match by street text)
      let dropLat: number | null = null;
      let dropLng: number | null = null;
      try {
        const saved: { street?: string; lat?: number; lng?: number }[] = JSON.parse(
          localStorage.getItem("miiam_addresses") || "[]"
        );
        const match = saved.find((a) => a.street && address.includes(a.street.slice(0, 30)));
        if (match && typeof match.lat === "number" && typeof match.lng === "number") {
          dropLat = match.lat;
          dropLng = match.lng;
        }
      } catch {
        /* no saved addresses */
      }
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: service.category,
          sub_service: service.name,
          user_name: user.user_metadata?.full_name || "",
          user_phone: phone,
          address,
          scheduled_date: selectedDate,
          scheduled_time: selectedTime,
          amount: service.price,
          notes: null,
          provider_id: null,
          lat: dropLat,
          lng: dropLng,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      router.push(`/app/bookings/confirmation?id=${data.booking?.id || ""}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setAdding(false);
    }
  }, [service, selectedDate, selectedTime, address, phone, supabase, router]);

  const dates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
      }),
    []
  );

  if (loading) {
    return (
      <div className="bg-surface min-h-screen">
        <div className="border-outline-variant/60 flex h-14 items-center gap-3 border-b px-3">
          <div className="bg-surface-container-high h-10 w-10 animate-pulse rounded-full" />
          <div className="space-y-1.5">
            <div className="bg-surface-container-high h-3 w-32 animate-pulse rounded" />
            <div className="bg-surface-container-high h-2.5 w-20 animate-pulse rounded" />
          </div>
        </div>
        <div className="bg-surface-container-high aspect-square max-h-[70vh] w-full animate-pulse" />
        <div className="space-y-3 px-4 py-4">
          <div className="bg-surface-container-high h-5 w-2/3 animate-pulse rounded" />
          <div className="bg-surface-container-high h-3 w-1/2 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="bg-surface flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <span className="material-symbols-outlined text-on-surface-variant/30 text-5xl">
          search_off
        </span>
        <h1 className="text-on-surface text-xl font-bold">
          {t.services.serviceNotFound || "Service not found"}
        </h1>
        <p className="text-on-surface-variant text-center text-sm">
          {t.services.serviceNotFoundDesc ||
            "The service you're looking for doesn't exist or has been removed."}
        </p>
        <button
          onClick={() => router.push("/app/services")}
          className="bg-primary text-on-primary mt-4 rounded-xl px-6 py-3 text-sm font-bold transition-all active:scale-95"
        >
          {t.services.browseServices || "Browse Services"}
        </button>
      </div>
    );
  }

  const datesDisplay = dates.map((d) => ({
    full: d,
    iso: d.toISOString().split("T")[0],
    label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
    short: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
  }));

  const savings = service.originalPrice ? service.originalPrice - service.price : 0;

  return (
    <div className="bg-surface min-h-screen pb-44 md:pb-32">
      {/* Sticky header — back / name + duration / share */}
      <header className="bg-surface-container-lowest/95 border-outline-variant/60 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="flex h-14 items-center gap-1 px-2">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="text-on-surface hover:bg-surface-container-high flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all active:scale-90"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="min-w-0 flex-1 px-1">
            <p className="text-on-surface truncate text-[13px] font-bold">{service.name}</p>
            <p className="text-on-surface-variant truncate text-[11px]">{service.duration}</p>
          </div>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: service.name,
                  text: `${service.name} — ₹${service.price} on MIIAM`,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                addToast("Link copied to clipboard", "success");
              }
            }}
            aria-label="Share service"
            className="text-on-surface hover:bg-surface-container-high flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all active:scale-90"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </header>

      {/* Full-bleed image with overlay chips */}
      <div className="bg-surface-container relative aspect-square max-h-[70vh] w-full overflow-hidden">
        <BlurImage
          src={service.image}
          alt={service.name}
          fill
          className="h-full w-full object-cover"
          sizes="100vw"
          fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80"
        />
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
          {service.badge && (
            <span className="bg-primary text-on-primary rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide uppercase shadow-md">
              {t.services[service.badge as keyof typeof t.services] || service.badge}
            </span>
          )}
          {service.rating > 0 && (
            <span className="text-accent flex items-center gap-0.5 rounded-full bg-white px-2 py-1 text-xs font-bold shadow-md dark:bg-[var(--color-surface-container)]">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              {service.rating}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <section className="border-outline-variant/60 border-b px-4 py-4">
        <h1 className="text-on-surface text-[17px] leading-snug font-bold">{service.name}</h1>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="text-on-surface-variant inline-flex items-center gap-1 text-xs">
            <span className="material-symbols-outlined text-[14px]">schedule</span>{" "}
            {service.duration}
          </span>
          {service.reviews > 0 && (
            <span className="text-on-surface-variant inline-flex items-center gap-1 text-xs">
              <span
                className="material-symbols-outlined text-accent text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                star
              </span>
              {service.rating} ({service.reviews})
            </span>
          )}
        </div>
      </section>

      {/* Description */}
      {service.description && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-outline-variant/60 border-b px-4 py-4"
        >
          <h3 className="text-on-surface mb-2 flex items-center gap-2 text-[15px] font-bold">
            <span className="material-symbols-outlined text-accent text-lg">info</span> About
          </h3>
          <p className="text-on-surface-variant text-sm leading-relaxed">{service.description}</p>
        </motion.section>
      )}

      {/* What's Included */}
      {service.included.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="border-outline-variant/60 border-b px-4 py-4"
        >
          <h3 className="text-on-surface mb-3 flex items-center gap-2 text-[15px] font-bold">
            <span className="material-symbols-outlined text-accent text-lg">checklist</span>{" "}
            {t.services.whatIncluded}
          </h3>
          <div className="space-y-2.5">
            {service.included.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="bg-accent/10 text-accent flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                  <span
                    className="material-symbols-outlined text-[12px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                </div>
                <span className="text-on-surface text-sm">{item}</span>
              </div>
            ))}
          </div>
          <div className="border-outline-variant/40 mt-3 flex items-center gap-2 border-t pt-3">
            <span
              className="material-symbols-outlined text-accent text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <span className="text-on-surface-variant text-xs">
              {t.services.warrantyDays?.replace("{days}", String(service.warranty_days)) ||
                `${service.warranty_days}-day warranty`}
            </span>
          </div>
        </motion.section>
      )}

      {/* Date & Time Selection */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border-outline-variant/60 border-b px-4 py-4"
      >
        <h3 className="text-on-surface mb-3 flex items-center gap-2 text-[15px] font-bold">
          <span className="material-symbols-outlined text-accent text-lg">calendar_today</span>{" "}
          {t.services.selectDate}
        </h3>

        {/* Date Chips */}
        <div
          className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1"
          role="radiogroup"
          aria-label="Select date"
        >
          {datesDisplay.map((d, i) => (
            <button
              key={i}
              role="radio"
              aria-checked={selectedDate === d.iso}
              onClick={() => {
                setSelectedDate(d.iso);
                if (navigator.vibrate) navigator.vibrate(10);
              }}
              className={`flex-shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                selectedDate === d.iso
                  ? "bg-primary text-on-primary shadow-primary/20 shadow-md"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <div className="text-center">
                <div>{d.full.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                <div className="mt-0.5 text-[10px] opacity-70">
                  {d.full.toLocaleDateString("en-IN", { month: "short" })}
                </div>
              </div>
            </button>
          ))}
        </div>

        <h3 className="text-on-surface mb-3 flex items-center gap-2 text-[15px] font-bold">
          <span className="material-symbols-outlined text-accent text-lg">schedule</span>{" "}
          {t.services.selectTimeSlot}
        </h3>

        {/* Time Slots */}
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Select time slot">
          {SERVICE_TIME_SLOTS.map((slot) => (
            <button
              key={slot}
              role="radio"
              aria-checked={selectedTime === slot}
              onClick={() => {
                setSelectedTime(slot);
                if (navigator.vibrate) navigator.vibrate(10);
              }}
              className={`rounded-xl p-3 text-left text-xs font-bold transition-all active:scale-[0.98] ${
                selectedTime === slot
                  ? "bg-primary text-on-primary shadow-primary/20 shadow-md"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Address & Phone */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="border-outline-variant/60 border-b px-4 py-4"
      >
        <h3 className="text-on-surface mb-3 flex items-center gap-2 text-[15px] font-bold">
          <span className="material-symbols-outlined text-accent text-lg">location_on</span> Service
          Address
        </h3>
        <textarea
          className="border-outline focus:border-primary text-on-surface bg-surface mb-3 w-full resize-none rounded-xl border-2 p-3 text-sm focus:outline-none"
          rows={2}
          placeholder="Enter your full address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          aria-label="Service address"
        />
        <h3 className="text-on-surface mb-3 flex items-center gap-2 text-[15px] font-bold">
          <span className="material-symbols-outlined text-accent text-lg">phone</span> Phone Number
        </h3>
        <input
          type="tel"
          className="border-outline focus:border-primary text-on-surface bg-surface w-full rounded-xl border-2 p-3 text-sm focus:outline-none"
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
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        </div>
      )}

      {/* Sticky bottom bar — price + Book Now (Blinkit style), sits above bottom nav */}
      <div className="bg-surface-container-lowest border-outline-variant/60 fixed right-0 bottom-[80px] left-0 z-40 border-t shadow-[0_-6px_20px_rgba(0,0,0,0.08)] md:right-6 md:left-auto md:max-w-md md:rounded-2xl md:border md:shadow-xl">
        <div
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}
        >
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              {service.priceMin && service.priceMax ? (
                <>
                  <span className="text-on-surface text-lg font-black">₹{service.priceMin}</span>
                  <span className="text-on-surface-variant text-sm">– ₹{service.priceMax}</span>
                </>
              ) : (
                <span className="text-on-surface text-lg font-black">₹{service.price}</span>
              )}
              {service.originalPrice && (
                <span className="text-on-surface-variant text-sm line-through">
                  ₹{service.originalPrice}
                </span>
              )}
            </div>
            <p className="text-[11px] leading-tight font-bold text-green-600">
              {service.originalPrice ? `You save ₹${savings}` : t.checkout.incTaxes}
            </p>
          </div>
          <button
            onClick={handleBook}
            disabled={adding || !selectedDate || !selectedTime}
            className="bg-primary text-on-primary shadow-primary/20 flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black whitespace-nowrap shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
          >
            {adding ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            )}
            {adding
              ? t.common.loading
              : !selectedDate || !selectedTime || !address.trim() || phone.length < 10
                ? "Fill details to book"
                : t.services.bookNow}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ServiceDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-surface flex min-h-screen items-center justify-center px-4">
          <div className="border-primary/30 border-t-primary h-8 w-8 animate-spin rounded-full border-4" />
        </div>
      }
    >
      <ServiceDetailContent />
    </Suspense>
  );
}
