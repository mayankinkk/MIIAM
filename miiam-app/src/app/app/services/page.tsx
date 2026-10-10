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
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { SERVICE_TIME_SLOTS, type ServiceData } from "@/lib/data/services";
import BookingStepper from "@/components/BookingStepper";
import { motion } from "framer-motion";

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
  const prefilledAddress =
    locationStore.displayAddress !== "Select Location" ? locationStore.displayAddress : "";
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
              : date.toLocaleDateString("en-IN", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                }),
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="bg-surface-container-lowest animate-slide-reveal max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-6 pb-10 shadow-2xl">
        <div className="bg-outline/30 mx-auto mb-5 h-1.5 w-12 rounded-full" aria-hidden="true" />

        {step !== "done" && (
          <BookingStepper
            steps={[
              t.services.selectDate || "Details",
              t.services.confirmBooking || "Confirm",
              t.services.bookingConfirmed || "Done",
            ]}
            current={step === "pick" ? 0 : 1}
          />
        )}

        {step === "pick" && (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div className="bg-surface-container relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl">
                <BlurImage
                  src={service.image}
                  alt={service.name}
                  fill
                  className="h-full w-full"
                  sizes="56px"
                  fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80"
                />
              </div>
              <div>
                <h2 id="booking-modal-title" className="text-on-surface text-lg font-black">
                  {service.name}
                </h2>
                <p className="text-accent text-sm font-bold">
                  {service.priceMin && service.priceMax
                    ? `₹${service.priceMin} – ₹${service.priceMax}`
                    : `₹${service.price}`}{" "}
                  • {service.duration}
                </p>
              </div>
            </div>

            <p className="text-on-surface mb-3 text-sm font-bold">{t.services.selectDate}</p>
            <div className="mb-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Select date">
              {dateOptions.map((d) => (
                <button
                  key={d.value}
                  role="radio"
                  aria-checked={selectedDate === d.value}
                  onClick={() => {
                    setSelectedDate(d.value);
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all active:scale-95 ${
                    selectedDate === d.value
                      ? "bg-primary text-on-primary border-primary shadow-primary/20 shadow-md"
                      : "border-outline text-on-surface-variant hover:border-primary/40"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <p className="text-on-surface mb-3 text-sm font-bold">{t.services.selectTimeSlot}</p>
            <div
              className="mb-5 grid grid-cols-2 gap-2"
              role="radiogroup"
              aria-label="Select time slot"
            >
              {SERVICE_TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  role="radio"
                  aria-checked={selectedSlot === slot}
                  onClick={() => {
                    setSelectedSlot(slot);
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  className={`rounded-xl border-2 p-3 text-left text-xs font-bold transition-all active:scale-[0.98] ${
                    selectedSlot === slot
                      ? "bg-primary text-on-primary border-primary shadow-primary/20 shadow-md"
                      : "border-outline text-on-surface-variant hover:border-primary/40"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>

            <p className="text-on-surface mb-2 text-sm font-bold">{t.services.serviceAddress}</p>
            <textarea
              className="border-outline focus:border-primary text-on-surface bg-surface mb-4 w-full resize-none rounded-xl border-2 p-3 text-sm focus:outline-none"
              rows={2}
              placeholder={t.services.addressPlaceholder}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              aria-label={t.services.serviceAddress}
            />

            <p className="text-on-surface mb-2 text-sm font-bold">
              {t.services.phoneNumber || "Phone Number"}
            </p>
            <input
              type="tel"
              className="border-outline focus:border-primary text-on-surface bg-surface mb-5 w-full rounded-xl border-2 p-3 text-sm focus:outline-none"
              placeholder={t.services.phonePlaceholder || "Enter your phone number"}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-label={t.services.phoneNumber || "Phone Number"}
              inputMode="numeric"
              maxLength={15}
            />

            <button
              disabled={!canProceed}
              onClick={() => {
                if (!selectedDate) {
                  addToast(t.services.pleaseSelectDate, "error");
                  return;
                }
                if (!selectedSlot) {
                  addToast(t.services.pleaseSelectTime, "error");
                  return;
                }
                if (!address.trim()) {
                  addToast(t.services.pleaseEnterAddress, "error");
                  return;
                }
                setStep("confirm");
                if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
              }}
              className="bg-primary text-on-primary hover:bg-primary-hover hover:text-on-primary w-full rounded-2xl py-4 text-base font-bold transition-all active:scale-[0.98] disabled:opacity-40"
            >
              {t.services.reviewBooking}
            </button>
            <button
              onClick={() => {
                onClose();
                if (navigator.vibrate) navigator.vibrate(10);
              }}
              className="text-on-surface-variant hover:text-on-surface mt-3 w-full py-3 text-sm font-semibold transition-colors"
            >
              {t.common.cancel}
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <h2 id="booking-modal-title" className="text-on-surface mb-6 text-xl font-black">
              {t.services.confirmBooking}
            </h2>
            <div className="bg-surface-container border-outline/20 mb-6 space-y-3 rounded-2xl border p-4">
              <div className="flex justify-between">
                <span className="text-on-surface-variant text-sm">{t.services.service}</span>
                <span className="text-on-surface text-right text-sm font-bold">{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant text-sm">{t.services.date}</span>
                <span className="text-on-surface text-sm font-bold">
                  {new Date(selectedDate).toLocaleDateString("en-IN", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant text-sm">{t.services.time}</span>
                <span className="text-on-surface text-sm font-bold">{selectedSlot}</span>
              </div>
              {address && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant text-sm">{t.services.address}</span>
                  <span className="text-on-surface max-w-[60%] text-right text-sm font-bold">
                    {address}
                  </span>
                </div>
              )}
              <div className="border-outline/20 flex justify-between border-t pt-3">
                <span className="text-on-surface font-bold">{t.services.total}</span>
                <span className="text-on-surface text-lg font-black">₹{service.price}</span>
              </div>
            </div>
            <div className="bg-primary-container/30 border-primary/20 mb-5 flex gap-2 rounded-xl border p-3">
              <span className="material-symbols-outlined text-accent mt-0.5 text-sm">info</span>
              <p className="text-on-primary-container text-xs">{t.services.paymentAfterService}</p>
            </div>
            <button
              onClick={handleConfirmBooking}
              disabled={booking}
              className="bg-primary text-on-primary hover:bg-primary-hover hover:text-on-primary flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {booking ? (
                <>
                  <span className="border-on-primary h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
                  {t.services.booking}
                </>
              ) : (
                t.services.confirmAndBook
              )}
            </button>
            <button
              onClick={() => {
                setStep("pick");
                if (navigator.vibrate) navigator.vibrate(10);
              }}
              className="text-on-surface-variant hover:text-on-surface mt-3 w-full py-3 text-sm font-semibold transition-colors"
            >
              {t.services.goBack}
            </button>
          </>
        )}

        {step === "done" && (
          <div className="animate-pop-in py-8 text-center">
            <div className="bg-primary-container mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
              <span
                className="material-symbols-outlined text-on-primary-container text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <h2 className="text-on-surface mb-2 text-2xl font-black">
              {t.services.bookingConfirmed}
            </h2>
            <p className="text-on-surface-variant mb-1">{service.name}</p>
            <p className="text-accent mb-1 font-bold">
              {new Date(selectedDate).toLocaleDateString("en-IN", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-on-surface-variant mb-6 font-semibold">{selectedSlot}</p>
            <p className="text-on-surface-variant/60 mb-8 text-sm">
              {t.services.bookingConfirmedDesc}
            </p>
            <button
              onClick={() => {
                onClose();
                if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
              }}
              className="bg-primary text-on-primary hover:bg-primary-hover hover:text-on-primary w-full rounded-2xl py-4 text-base font-bold transition-all active:scale-[0.98]"
            >
              {t.common.done}
            </button>
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
  const [isServiceable, setIsServiceable] = useState(false);
  const locationStore = useLocationStore();
  const userPincode = locationStore.pincode;
  const userCity = locationStore.city;
  const { addToast } = useToastStore();
  const supabase = useMemo(() => createClient(), []);
  const [dbCategories, setDbCategories] = useState<
    { id: string; name: string; slug: string; icon: string }[]
  >([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [dbServices, setDbServices] = useState<ServiceData[]>([]);

  const rawCategory = searchParams.get("category") ?? "all";

  const categoryIdMap: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    dbCategories.forEach((cat) => {
      map[cat.slug] = cat.slug;
      map[cat.name] = cat.slug;
    });
    return map;
  }, [dbCategories]);

  useEffect(() => {
    async function loadServices() {
      setLoadingServices(true);
      try {
        const { data: cats } = await supabase
          .from("service_categories")
          .select("id, name, slug, icon")
          .eq("is_active", true)
          .order("display_order");
        if (cats) {
          const mapped = cats.map(
            (c: { id: string; name: string; slug: string | null; icon: string }) => ({
              id: c.id,
              name: c.name,
              slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "_").replace(/&/g, ""),
              icon: c.icon || "home_repair_service",
            })
          );
          setDbCategories(mapped);
          const catIds = cats.map((c: { id: string }) => c.id);
          if (catIds.length > 0) {
            const { data: items } = await supabase
              .from("service_items")
              .select("*, service_categories!inner(name)")
              .in("category_id", catIds)
              .eq("is_active", true)
              .order("sort_order");
            if (items) {
              const mappedItems: ServiceData[] = items.map((item: Record<string, unknown>) => {
                const cat = item.service_categories as { name: string } | null;
                const catObj = mapped.find((c: { name: string }) => c.name === cat?.name);
                return {
                  id: item.id as string,
                  name: item.name as string,
                  category: catObj?.slug ?? "",
                  rating: Number(item.rating) || 0,
                  reviews: Number(item.reviews) || 0,
                  price: Number(item.price),
                  priceMin: item.price_min != null ? Number(item.price_min) : undefined,
                  priceMax: item.price_max != null ? Number(item.price_max) : undefined,
                  originalPrice:
                    item.original_price != null ? Number(item.original_price) : undefined,
                  duration: (item.duration as string) || "",
                  image: (item.image_url as string) || "",
                  included: (item.included as string[]) || [],
                  warranty_days: Number(item.warranty_days) || 7,
                  badge: (item.badge as string) || undefined,
                  description: (item.description as string) || "",
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
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryIdMap[rawCategory] ?? "all"
  );
  const [bookingService, setBookingService] = useState<ServiceData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const mapped = categoryIdMap[rawCategory];
    if (mapped) setSelectedCategory(mapped);
  }, [categoryIdMap, rawCategory]);

  useEffect(() => {
    setIsServiceable(Boolean(userPincode || userCity));
  }, [userPincode, userCity]);

  const checkServiceability = useCallback(async () => {
    setIsServiceable(Boolean(userPincode || userCity));
  }, [userPincode, userCity]);

  const filteredServices = useMemo(() => {
    let results =
      selectedCategory === "all"
        ? dbServices
        : dbServices.filter((s) => s.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.included.some((item) => item.toLowerCase().includes(q))
      );
    }
    return results;
  }, [selectedCategory, dbServices, searchQuery]);

  // Must come after every hook: returning early here used to skip useMemo and
  // crash React ("rendered fewer hooks") once categories loaded.
  if (mappedCategory) {
    const setting = getSetting(mappedCategory as ServiceCategory);
    if (setting && !setting.isEnabled) {
      return (
        <ServiceUnavailable
          serviceName={setting.name}
          message={setting.message}
          icon={setting.icon}
        />
      );
    }
  }

  return (
    <div className="bg-surface min-h-screen pb-24">
      {/* Header */}
      <header className="bg-surface-container-lowest sticky top-0 z-30 px-4 pt-12 pb-4 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/app/home"
            aria-label="Back"
            className="bg-surface-container text-on-surface border-outline/30 flex h-10 w-10 items-center justify-center rounded-full border transition-transform active:scale-90"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-on-surface text-xl font-black">{t.services.title}</h1>
            <p className="text-on-surface-variant mt-0.5 text-xs">{t.services.subtitle}</p>
          </div>
          <Link
            href="/app/cart"
            aria-label="View cart"
            className="bg-surface-container text-on-surface border-outline/30 flex h-10 w-10 items-center justify-center rounded-full border"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
          </Link>
        </div>
        {/* Search */}
        <div className="w-full">
          <SearchAutocomplete
            onSelect={(term) => setSearchQuery(term)}
            preventNavigation
            className="w-full"
            placeholder="Search for services..."
          />
        </div>
      </header>

      <Breadcrumbs
        items={[{ label: "Home", href: "/app/home" }, { label: t.services.homeServices }]}
      />

      <PullToRefresh onRefresh={checkServiceability}>
        {/* Location Banner */}
        {(userPincode || userCity) && (
          <div
            className={`mx-4 mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold ${isServiceable ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-amber-200 bg-amber-50 text-amber-700"}`}
          >
            <span
              className={`material-symbols-outlined text-sm ${isServiceable ? "text-emerald-600" : "text-amber-600"}`}
            >
              {isServiceable ? "location_on" : "warning"}
            </span>
            {isServiceable ? (
              <span>Services available in {userPincode || userCity}</span>
            ) : (
              <span>
                {t.services.notServiceable} {userPincode || userCity}
              </span>
            )}
          </div>
        )}

        {/* Category Circles - GKB Style */}
        <div className="px-4 py-5">
          <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            <button
              onClick={() => {
                setSelectedCategory("all");
                if (navigator.vibrate) navigator.vibrate(10);
              }}
              aria-label={t.services.all}
              className="flex flex-shrink-0 snap-start flex-col items-center gap-1.5"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${selectedCategory === "all" ? "bg-primary text-on-primary shadow-primary/30 shadow-lg" : "bg-surface text-on-surface-variant border-outline border"}`}
              >
                <span className="material-symbols-outlined text-xl">apps</span>
              </div>
              <span
                className={`text-[10px] font-bold ${selectedCategory === "all" ? "text-on-surface" : "text-on-surface-variant"}`}
              >
                {t.services.all}
              </span>
            </button>
            {dbCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.slug as ServiceCategory);
                  if (navigator.vibrate) navigator.vibrate(10);
                }}
                aria-label={cat.name}
                className="flex flex-shrink-0 snap-start flex-col items-center gap-1.5"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${selectedCategory === cat.slug ? "bg-primary text-on-primary shadow-primary/30 shadow-lg" : "bg-surface text-on-surface-variant border-outline border"}`}
                >
                  <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                </div>
                <span
                  className={`max-w-[56px] truncate text-center text-[10px] font-bold ${selectedCategory === cat.slug ? "text-on-surface" : "text-on-surface-variant"}`}
                >
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Services List */}
        <main className="space-y-4 px-4 pb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-on-surface text-base font-bold">
              {selectedCategory === "all"
                ? "All Services"
                : dbCategories.find((c) => c.slug === selectedCategory)?.name || "Services"}
            </h2>
            <span className="text-on-surface-variant text-xs font-bold">
              {filteredServices.length} services
            </span>
          </div>

          {loadingServices ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest border-outline-variant/10 overflow-hidden rounded-2xl border"
                >
                  <div className="bg-surface-container h-36 animate-pulse" />
                  <div className="space-y-2 p-3">
                    <div className="bg-surface-container h-4 w-3/4 animate-pulse rounded" />
                    <div className="bg-surface-container h-3 w-1/2 animate-pulse rounded" />
                    <div className="bg-surface-container h-3 w-1/3 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="bg-surface-container-lowest border-outline/20 rounded-2xl border p-10 text-center shadow-sm">
              <span className="material-symbols-outlined text-on-surface-variant/30 mb-3 text-5xl">
                search_off
              </span>
              <p className="text-on-surface mb-1 text-lg font-bold">
                {t.services.noServices || "No services found"}
              </p>
              <p className="text-on-surface-variant mb-4 text-sm">
                {t.services.tryDifferentCategory || "Try selecting a different category"}
              </p>
              <button
                onClick={() => setSelectedCategory("all")}
                className="bg-primary text-on-primary rounded-xl px-5 py-2.5 text-sm font-bold transition-all active:scale-95"
              >
                {t.services.showAll || "Show All Services"}
              </button>
            </div>
          ) : (
            <>
              {/* Featured Services - Horizontal Scroll */}
              {filteredServices.some((s) => s.badge) && (
                <div className="mb-2">
                  <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
                    {filteredServices
                      .filter((s) => s.badge)
                      .map((service) => (
                        <div
                          key={service.id}
                          className="bg-surface-container-lowest shadow-editorial-sm border-outline/5 card-hover w-64 flex-shrink-0 overflow-hidden rounded-3xl border"
                        >
                          <div className="relative h-36 overflow-hidden">
                            <BlurImage
                              src={service.image}
                              alt={service.name}
                              fill
                              className="h-full w-full object-cover"
                              sizes="256px"
                              fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <span className="bg-primary text-on-primary absolute top-2 left-2 rounded-full px-2.5 py-1 text-[9px] font-black tracking-wide uppercase shadow-md">
                              {t.services[service.badge as keyof typeof t.services] ||
                                service.badge}
                            </span>
                            {service.originalPrice && (
                              <span className="bg-status-error absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-black text-white shadow-md">
                                {Math.round(
                                  ((service.originalPrice - service.price) /
                                    service.originalPrice) *
                                    100
                                )}
                                % OFF
                              </span>
                            )}
                            <div className="absolute right-2 bottom-2 left-2">
                              <h3 className="truncate text-sm font-bold text-white">
                                {service.name}
                              </h3>
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-[10px] text-white/80">
                                  {service.duration}
                                </span>
                                <span className="text-sm font-black text-white">
                                  {"₹"}
                                  {service.price}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Top Rated Services */}
              {filteredServices.length > 3 &&
                (() => {
                  const topRated = [...filteredServices]
                    .filter((s) => s.rating > 0)
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 6);
                  if (topRated.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-lg">⭐</span>
                        <h2 className="text-on-surface text-lg font-bold">Top Rated</h2>
                      </div>
                      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                        {topRated.map((service) => (
                          <Link
                            key={`top-${service.id}`}
                            href={`/app/services/${service.id}`}
                            className="bg-surface-container-lowest shadow-editorial-sm border-outline/5 w-36 flex-shrink-0 overflow-hidden rounded-2xl border transition-transform active:scale-[0.97]"
                          >
                            <div className="relative h-24 overflow-hidden">
                              <BlurImage
                                src={service.image}
                                alt={service.name}
                                fill
                                className="h-full w-full object-cover"
                                sizes="144px"
                                fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80"
                              />
                              <span className="bg-accent absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-black text-white shadow-md">
                                <span className="text-[8px]">★</span> {service.rating}
                              </span>
                            </div>
                            <div className="p-3">
                              <h3 className="text-on-surface truncate text-[11px] font-bold">
                                {service.name}
                              </h3>
                              <p className="text-on-surface mt-0.5 text-[10px] font-bold">
                                ₹{service.price}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              {/* All Services - Vertical Cards */}
              {filteredServices.map((service, index) => (
                <Link key={service.id} href={`/app/services/${service.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.3) }}
                    className="bg-surface-container-lowest shadow-editorial-sm border-outline/5 card-hover overflow-hidden rounded-3xl border"
                  >
                    {/* Image */}
                    <div className="relative h-36 overflow-hidden">
                      <BlurImage
                        src={service.image}
                        alt={service.name}
                        fill
                        className="h-full w-full object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      {service.badge && (
                        <span className="bg-primary text-on-primary absolute top-2 left-2 rounded-full px-2.5 py-1 text-[9px] font-black tracking-wide uppercase shadow-md">
                          {t.services[service.badge as keyof typeof t.services] || service.badge}
                        </span>
                      )}
                      {service.originalPrice && (
                        <span className="bg-status-error absolute top-2 right-2 rounded-full px-2 py-1 text-[9px] font-black text-white shadow-md">
                          {Math.round(
                            ((service.originalPrice - service.price) / service.originalPrice) * 100
                          )}
                          % OFF
                        </span>
                      )}
                      <div className="absolute bottom-2 left-2 flex gap-1.5">
                        <span className="text-on-surface flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-sm dark:bg-[var(--color-surface-container)]/95">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          {service.duration}
                        </span>
                        {service.rating > 0 && (
                          <span className="bg-accent flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                            <span
                              className="material-symbols-outlined text-[12px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                            {service.rating}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      {/* Title & Reviews */}
                      <h3 className="text-on-surface text-base leading-tight font-bold">
                        {service.name}
                      </h3>

                      {/* What's Included */}
                      {service.included.length > 0 && (
                        <div className="bg-surface-container-low mt-3 rounded-xl p-3">
                          <p className="text-on-surface-variant mb-2 text-[9px] font-black tracking-widest uppercase">
                            {t.services.whatIncluded}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {service.included.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <span
                                  className="material-symbols-outlined text-status-success text-[14px]"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  check_circle
                                </span>
                                <span className="text-on-surface text-[11px] font-medium">
                                  {item.trim()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price & CTA */}
                      <div className="border-outline/10 mt-3 flex items-center justify-between border-t pt-3">
                        <div className="flex flex-col items-start leading-tight">
                          <span className="text-on-surface text-xl font-black">
                            {"₹"}
                            {service.price}
                          </span>
                          {service.originalPrice && (
                            <span className="text-on-surface-variant text-xs line-through">
                              {"₹"}
                              {service.originalPrice}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isServiceable) {
                              addToast(t.services.cannotBook, "error");
                            } else {
                              setBookingService(service);
                            }
                            if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
                          }}
                          className={`rounded-xl px-5 py-2 text-xs font-bold transition-all active:scale-95 ${
                            isServiceable
                              ? "bg-primary text-on-primary hover:bg-primary-hover shadow-primary/20 shadow-md"
                              : "bg-surface-container text-on-surface-variant cursor-not-allowed"
                          }`}
                        >
                          {isServiceable ? t.services.bookNow : t.services.unavailable}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </>
          )}
        </main>
      </PullToRefresh>

      {bookingService && (
        <BookingModal service={bookingService} onClose={() => setBookingService(null)} />
      )}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-surface flex min-h-screen items-center justify-center">
          <div className="border-primary/20 border-t-primary h-8 w-8 animate-spin rounded-full border-4" />
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}
