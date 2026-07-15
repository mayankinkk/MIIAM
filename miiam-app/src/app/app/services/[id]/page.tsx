"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import { CardSkeleton } from "@/components/Skeleton";
import { SERVICE_TIME_SLOTS, type ServiceData } from "@/lib/data/services";

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const handleBook = useCallback(async () => {
    if (!service) return;
    if (!selectedDate || !selectedTime) {
      setError("Please select both date and time");
      return;
    }
    setAdding(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please login to book");
        setAdding(false);
        return;
      }

      // Convert display date to ISO format
      const dateObj = new Date(selectedDate);
      const isoDate = dateObj.toISOString().split("T")[0];

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: service.category,
          sub_service: service.name,
          user_name: user.user_metadata?.full_name || "",
          user_phone: user.user_metadata?.phone || "",
          address: "",
          scheduled_date: isoDate,
          scheduled_time: selectedTime,
          amount: service.price,
          notes: null,
          provider_id: null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");

      router.push("/app/bookings");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setAdding(false);
    }
  }, [service, selectedDate, selectedTime, supabase, router]);

  const dates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
      }),
    [],
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Fallback if service not found
  if (!service) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-4">
        <span className="material-symbols-outlined text-outline text-5xl">search_off</span>
        <h1 className="text-xl font-bold text-on-surface">{t.services.serviceNotFound || "Service not found"}</h1>
        <p className="text-on-surface-variant text-sm text-center">
          {t.services.serviceNotFoundDesc || "The service you're looking for doesn't exist or has been removed."}
        </p>
        <button
          onClick={() => router.push("/app/services")}
          className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all"
        >
          {t.services.browseServices || "Browse Services"}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <nav
        className="fixed top-0 w-full z-50 flex justify-between items-center px-4 py-3 bg-surface/90 backdrop-blur-2xl shadow-[0px_4px_20px_rgba(77,33,42,0.06)]"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface text-[22px]">arrow_back</span>
        </button>
        <span className="text-xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        <div className="w-10" />
      </nav>

      <Breadcrumbs
        items={[
          { label: "Home", href: "/app/home" },
          { label: t.services.homeServices, href: "/app/services" },
          { label: service.name },
        ]}
      />

      <div className="relative w-full h-64">
        <BlurImage src={service.image} alt={service.name} fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
      </div>

      <div className="p-4 -mt-8 relative z-10">
        {service.badge && (
          <span className="inline-block text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
            {t.services[service.badge as keyof typeof t.services] || service.badge}
          </span>
        )}

        <h1 className="text-2xl font-black text-on-surface mb-2">{service.name}</h1>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-lg">
            <span className="text-xs font-bold text-green-700">{service.rating}</span>
            <span className="text-green-700 text-xs">★</span>
          </div>
          <span className="text-sm text-on-surface-variant">
            {service.reviews.toLocaleString()} {t.services.reviews}
          </span>
          <span className="text-on-surface-variant/40">•</span>
          <span className="text-sm text-on-surface-variant">{service.duration}</span>
        </div>

        <p className="text-on-surface-variant mb-6 leading-relaxed">{service.description}</p>

        <div className="bg-surface-container-low rounded-xl p-4 mb-6">
          <h3 className="font-bold text-on-surface mb-3">{t.services.whatIncluded}</h3>
          <div className="space-y-2">
            {service.included.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span className="text-sm text-on-surface-variant">{item}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-outline-variant/20">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            <span className="text-xs text-on-surface-variant">
              {t.services.warrantyDays?.replace("{days}", String(service.warranty_days)) || `${service.warranty_days}-day warranty`}
            </span>
          </div>
        </div>

        {/* Date & Time Selection */}
        <div className="mb-6">
          <h3 className="font-bold text-on-surface mb-3">{t.services.selectDate}</h3>

          <div className="mb-3">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              aria-expanded={showDatePicker}
              aria-haspopup="listbox"
              className="w-full p-3 border-2 border-outline rounded-xl flex items-center justify-between hover:border-primary/50 transition-colors"
            >
              <span className={selectedDate ? "text-on-surface font-medium" : "text-on-surface-variant"}>
                {selectedDate || t.services.selectDate}
              </span>
              <span className="material-symbols-outlined text-on-surface-variant">calendar_today</span>
            </button>

            {showDatePicker && (
              <div className="mt-2 p-3 border-2 border-outline rounded-xl bg-surface-container-lowest" role="listbox" aria-label="Select date">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {dates.map((date, i) => {
                    const dateStr = date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
                    const isSelected = selectedDate === dateStr;
                    return (
                      <button
                        key={i}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setShowDatePicker(false);
                        }}
                        className={`flex-shrink-0 p-2 rounded-lg text-sm font-medium transition-all ${
                          isSelected ? "bg-primary text-white" : "hover:bg-surface-container"
                        }`}
                      >
                        {date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setShowTimePicker(!showTimePicker)}
              aria-expanded={showTimePicker}
              aria-haspopup="listbox"
              className="w-full p-3 border-2 border-outline rounded-xl flex items-center justify-between hover:border-primary/50 transition-colors"
            >
              <span className={selectedTime ? "text-on-surface font-medium" : "text-on-surface-variant"}>
                {selectedTime || t.services.selectTimeSlot}
              </span>
              <span className="material-symbols-outlined text-on-surface-variant">schedule</span>
            </button>

            {showTimePicker && (
              <div className="mt-2 p-3 border-2 border-outline rounded-xl bg-surface-container-lowest" role="listbox" aria-label="Select time slot">
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelectedTime(slot);
                          setShowTimePicker(false);
                        }}
                        className={`p-2 rounded-lg text-sm font-medium transition-all ${
                          isSelected ? "bg-primary text-white" : "hover:bg-surface-container"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-6 p-4 bg-surface-container-low rounded-xl">
          <div>
            {service.priceMin && service.priceMax ? (
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-on-surface-variant">Starting at</span>
                <span className="text-2xl font-black text-on-surface">₹{service.priceMin}</span>
                <span className="text-sm text-on-surface-variant">– ₹{service.priceMax}</span>
              </div>
            ) : (
              <span className="text-2xl font-black text-on-surface">₹{service.price}</span>
            )}
            {service.originalPrice && (
              <span className="text-sm text-on-surface-variant/60 line-through ml-2">₹{service.originalPrice}</span>
            )}
          </div>
          <span className="text-xs text-on-surface-variant">{t.checkout.incTaxes}</span>
        </div>

        {/* Ratings Summary */}
        {service.rating && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-surface-container-low rounded-xl">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-amber-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-lg font-black text-on-surface">{service.rating}</span>
            </div>
            {service.reviews && (
              <span className="text-sm text-on-surface-variant">({service.reviews} reviews)</span>
            )}
            {service.badge === "mostPopular" && (
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Most Popular</span>
            )}
            {service.badge === "bestSeller" && (
              <span className="text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">Best Seller</span>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleBook}
          disabled={adding}
          className="fixed bottom-6 left-4 right-4 bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all z-50 flex items-center justify-center gap-2"
          style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          {adding ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
          )}
          {adding ? t.common.loading : t.services.bookNow}
        </button>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4" aria-label="Loading...">
      <CardSkeleton />
    </div>
  );
}

export default function ServiceDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ServiceDetailContent />
    </Suspense>
  );
}
