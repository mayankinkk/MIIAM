"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
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
import { services, SERVICE_CATEGORIES, SERVICE_TIME_SLOTS, type ServiceData } from "@/lib/data/services";

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

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-t-3xl shadow-2xl p-6 pb-10 max-h-[90vh] overflow-y-auto animate-slide-reveal">
        {/* Handle */}
        <div className="w-12 h-1.5 bg-surface-container-high rounded-full mx-auto mb-5" aria-hidden="true" />

        {step === "pick" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-surface-container flex-shrink-0">
                <BlurImage src={service.image} alt={service.name} fill className="w-full h-full" sizes="56px" />
              </div>
              <div>
                <h2 id="booking-modal-title" className="font-black text-on-surface text-lg">{service.name}</h2>
                <p className="text-primary font-bold">
                  ₹{service.price} • {service.duration}
                </p>
              </div>
            </div>

            <p className="font-bold text-on-surface mb-3">{t.services.selectDate}</p>
            <div className="flex gap-2 flex-wrap mb-5" role="radiogroup" aria-label="Select date">
              {dateOptions.map((d) => (
                <button
                  key={d.value}
                  role="radio"
                  aria-checked={selectedDate === d.value}
                  onClick={() => {
                    setSelectedDate(d.value);
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all hover:scale-105 active:scale-95 ${
                    selectedDate === d.value
                      ? "bg-primary text-white border-primary"
                      : "border-outline text-on-surface-variant hover:border-primary"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <p className="font-bold text-on-surface mb-3">{t.services.selectTimeSlot}</p>
            <div className="grid grid-cols-2 gap-2 mb-5" role="radiogroup" aria-label="Select time slot">
              {SERVICE_TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  role="radio"
                  aria-checked={selectedSlot === slot}
                  onClick={() => {
                    setSelectedSlot(slot);
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  className={`p-3 rounded-xl text-xs font-bold border-2 transition-all text-left hover:scale-[1.02] active:scale-[0.98] ${
                    selectedSlot === slot
                      ? "bg-primary text-white border-primary"
                      : "border-outline text-on-surface-variant hover:border-primary"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>

            <p className="font-bold text-on-surface mb-2">{t.services.serviceAddress}</p>
            <textarea
              className="w-full border-2 border-outline rounded-xl p-3 text-sm focus:border-primary focus:outline-none resize-none mb-4"
              rows={2}
              placeholder={t.services.addressPlaceholder}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              aria-label={t.services.serviceAddress}
            />

            <p className="font-bold text-on-surface mb-2">{t.services.phoneNumber || "Phone Number"}</p>
            <input
              type="tel"
              className="w-full border-2 border-outline rounded-xl p-3 text-sm focus:border-primary focus:outline-none mb-5"
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
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base disabled:opacity-40 hover:bg-primary-dim transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.services.reviewBooking}
            </button>
            <button
              onClick={() => {
                onClose();
                if (navigator.vibrate) navigator.vibrate(10);
              }}
              className="w-full mt-3 py-3 text-on-surface-variant font-semibold text-sm hover:text-on-surface transition-colors"
            >
              {t.common.cancel}
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <h2 id="booking-modal-title" className="font-black text-xl text-on-surface mb-6">
              {t.services.confirmBooking}
            </h2>
            <div className="bg-surface-container-low rounded-2xl p-4 space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-on-surface-variant text-sm">{t.services.service}</span>
                <span className="font-bold text-on-surface text-sm text-right">{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant text-sm">{t.services.date}</span>
                <span className="font-bold text-on-surface text-sm">
                  {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant text-sm">{t.services.time}</span>
                <span className="font-bold text-on-surface text-sm">{selectedSlot}</span>
              </div>
              {address && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant text-sm">{t.services.address}</span>
                  <span className="font-bold text-on-surface text-sm text-right max-w-[60%]">{address}</span>
                </div>
              )}
              <div className="border-t border-outline pt-3 flex justify-between">
                <span className="font-bold text-on-surface">{t.services.total}</span>
                <span className="font-black text-primary text-lg">₹{service.price}</span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2 mb-5">
              <span className="material-symbols-outlined text-blue-600 text-sm mt-0.5">info</span>
              <p className="text-xs text-blue-700">{t.services.paymentAfterService}</p>
            </div>
            <button
              onClick={handleConfirmBooking}
              disabled={booking}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-dim transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {booking ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              className="w-full mt-3 py-3 text-on-surface-variant font-semibold text-sm hover:text-on-surface transition-colors"
            >
              {t.services.goBack}
            </button>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-8 animate-pop-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <span
                className="material-symbols-outlined text-green-600 text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <h2 className="font-black text-2xl text-on-surface mb-2">{t.services.bookingConfirmed}</h2>
            <p className="text-on-surface-variant mb-1">{service.name}</p>
            <p className="font-bold text-primary mb-1">
              {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-on-surface-variant font-semibold mb-6">{selectedSlot}</p>
            <p className="text-sm text-on-surface-variant mb-8">{t.services.bookingConfirmedDesc}</p>
            <button
              onClick={() => {
                onClose();
                if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
              }}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-dim transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.common.done}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ServicesContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { getSetting } = useServiceSettingsStore();
  const [isServiceable, setIsServiceable] = useState(true);
  const locationStore = useLocationStore();
  const userPincode = locationStore.pincode;
  const userCity = locationStore.city;
  const { addToast } = useToastStore();

  const rawCategory = searchParams.get("category") ?? "all";

  const categoryIdMap: Record<string, ServiceCategory> = useMemo(
    () => ({
      ac: "ac",
      beauty: "beauty",
      cleaning: "cleaning",
      plumbing: "plumbing",
      electrical: "electrical",
      pest: "pest",
      car: "car",
      appliance: "appliance",
    }),
    [],
  );

  const mappedCategory = categoryIdMap[rawCategory];

  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | "all">(
    (categoryIdMap[rawCategory] ?? "all") as ServiceCategory | "all",
  );
  const [bookingService, setBookingService] = useState<ServiceData | null>(null);

  const checkServiceability = useCallback(async () => {
    setIsServiceable(true);
  }, []);

  // Check service availability after hooks
  if (mappedCategory) {
    const setting = getSetting(mappedCategory);
    if (setting && !setting.isEnabled) {
      return <ServiceUnavailable serviceName={setting.name} message={setting.message} icon={setting.icon} />;
    }
  }

  const filteredServices = selectedCategory === "all" ? services : services.filter((s) => s.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background text-on-background pb-24">
      {/* Header */}
      <header className="bg-surface-container-lowest px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Link
            href="/app/explore"
            aria-label="Back to explore"
            className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-sm">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-on-surface">{t.services.title}</h1>
        </div>
        <p className="text-sm text-on-surface-variant mt-1">{t.services.subtitle}</p>
      </header>

      <Breadcrumbs items={[{ label: "Home", href: "/app/explore" }, { label: t.services.homeServices }]} />

      <PullToRefresh onRefresh={checkServiceability}>
        {/* Location / Availability Banner */}
        {!isServiceable && (userPincode || userCity) && (
          <div className="bg-surface-container-low border-b border-amber-200 px-6 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-xl animate-bounce">warning</span>
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-800">
                {t.services.notServiceable} {userPincode ? `Pincode ${userPincode}` : userCity}
              </p>
              <p className="text-[10px] text-amber-600 font-medium">{t.services.notServiceableDesc}</p>
            </div>
          </div>
        )}
        {isServiceable && (userPincode || userCity) && (
          <div className="bg-surface-container-low border-b border-green-200 px-6 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-green-600 text-sm">location_on</span>
            <p className="text-[11px] font-bold text-green-700">
              {t.services.providingServices} {userPincode ? `Pincode ${userPincode}` : userCity}
            </p>
          </div>
        )}

        {/* Hero Banner */}
        <div className="px-4 mt-4">
          <div className="rounded-2xl overflow-hidden relative h-40 shadow-sm">
            <BlurImage src="/images/services_hero.png" alt="Professional Services" fill className="w-full h-full" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
              <h2 className="text-white text-xl font-black">{t.services.expertProfessionals}</h2>
              <p className="text-white/90 text-sm">{t.services.expertDesc}</p>
            </div>
          </div>
        </div>

        {/* Service Categories */}
        <div className="px-4 py-4">
          <div className="flex gap-3 overflow-x-auto no-scrollbar" role="tablist" aria-label="Service categories">
            <button
              role="tab"
              aria-selected={selectedCategory === "all"}
              onClick={() => {
                setSelectedCategory("all");
                if (navigator.vibrate) navigator.vibrate(10);
              }}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap active:scale-95 transition-all ${
                selectedCategory === "all"
                  ? "bg-primary text-white"
                  : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-low"
              }`}
            >
              {t.services.all}
            </button>
            {SERVICE_CATEGORIES.map((cat, i) => (
              <button
                key={cat.id}
                role="tab"
                aria-selected={selectedCategory === cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id as ServiceCategory);
                  if (navigator.vibrate) navigator.vibrate(10);
                }}
                className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap flex items-center gap-1 active:scale-95 transition-all animate-category-slide ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white"
                    : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-low"
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Services List */}
        <main className="px-4 space-y-5 pb-10">
          {filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-outline text-5xl mb-3">search_off</span>
              <p className="font-bold text-on-surface text-lg mb-1">{t.services.noServices || "No services found"}</p>
              <p className="text-sm text-on-surface-variant mb-4">{t.services.tryDifferentCategory || "Try selecting a different category"}</p>
              <button
                onClick={() => setSelectedCategory("all")}
                className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all"
              >
                {t.services.showAll || "Show All Services"}
              </button>
            </div>
          ) : (
            filteredServices.map((service, index) => (
              <div
                key={service.id}
                className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-outline-variant/10 card-lift animate-pop-in"
                style={{ animationDelay: `${Math.min(index * 80, 500)}ms` }}
              >
                {/* Image with overlay badges */}
                <div className="relative h-44 overflow-hidden">
                  <BlurImage
                    src={service.image}
                    alt={service.name}
                    fill
                    className="w-full h-full"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  {service.badge && (
                    <span className="absolute top-3 left-3 bg-surface-container-lowest/95 backdrop-blur-sm text-green-600 dark:text-green-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">
                      {t.services[service.badge as keyof typeof t.services] || service.badge}
                    </span>
                  )}
                  {service.originalPrice && (
                    <span className="absolute top-3 right-3 bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                      {Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)}% OFF
                    </span>
                  )}
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface-variant text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {service.duration}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  {/* Title & Rating */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-on-surface text-lg leading-tight">{service.name}</h3>
                    <div className="flex items-center gap-1 bg-surface-container-low border border-green-500/20 px-2 py-0.5 rounded-lg flex-shrink-0">
                      <span className="text-green-600 dark:text-green-400 text-xs font-black">★ {service.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant/70 mt-0.5">
                    {service.reviews.toLocaleString()} {t.services.reviews}
                  </p>

                  {/* What's Included */}
                  <div className="mt-3 bg-surface-container-low rounded-xl p-3">
                    <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-2">
                      {t.services.whatIncluded}
                    </p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {service.included.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span
                            className="material-symbols-outlined text-green-500 text-[14px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                          <span className="text-xs text-on-surface-variant font-medium">{item.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/10">
                    <div>
                      {service.originalPrice && (
                        <span className="text-sm text-on-surface-variant/60 line-through mr-2">₹{service.originalPrice}</span>
                      )}
                      <span className="font-black text-2xl text-on-surface animate-price-tag">₹{service.price}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (!isServiceable) {
                          addToast(t.services.cannotBook, "error");
                        } else {
                          setBookingService(service);
                        }
                        if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
                      }}
                      className={`px-6 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all shadow-sm ${
                        isServiceable
                          ? "bg-primary text-white hover:bg-primary-dim shadow-primary/20 hover:scale-[1.02]"
                          : "bg-outline text-white cursor-not-allowed shadow-none"
                      }`}
                    >
                      {isServiceable ? t.services.bookNow : t.services.unavailable}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </main>
      </PullToRefresh>

      {/* Booking Modal */}
      {bookingService && <BookingModal service={bookingService} onClose={() => setBookingService(null)} />}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}
