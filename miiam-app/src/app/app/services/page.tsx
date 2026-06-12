"use client";

import { useState, useEffect, Suspense } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useServiceSettingsStore, ServiceCategory } from "@/lib/store/serviceSettingsStore";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import { useLocationStore } from "@/lib/store/locationStore";
import { useToastStore } from "@/lib/store/toastStore";
import { createClient } from "@/lib/supabase/client";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import PullToRefresh from "@/components/PullToRefresh";

// ---------- Booking Modal ----------
type Service = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  duration: string;
  image: string;
  included: string[];
  rating: number;
  reviews: number;
  warranty_days: number;
  badge?: string;
  category: string;
};

const timeSlots = [
  "07:00 AM – 09:00 AM",
  "09:00 AM – 11:00 AM",
  "11:00 AM – 01:00 PM",
  "01:00 PM – 03:00 PM",
  "03:00 PM – 05:00 PM",
  "05:00 PM – 07:00 PM",
];

function BookingModal({ service, onClose }: { service: Service; onClose: () => void }) {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const [step, setStep] = useState<"pick" | "confirm" | "done">("pick");
  const [booking, setBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [address, setAddress] = useState("");
  const [dateOptions, setDateOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const options = [0, 1, 2, 3, 4].map((d) => {
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
    setDateOptions(options);
  }, [t]);

  const canProceed = selectedDate && selectedSlot && address.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-t-3xl shadow-2xl p-6 pb-10 max-h-[90vh] overflow-y-auto animate-slide-reveal">
        {/* Handle */}
        <div className="w-12 h-1.5 bg-surface-container-high rounded-full mx-auto mb-5" />

        {step === "pick" && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-surface-container flex-shrink-0">
                <BlurImage src={service.image} alt={service.name} fill className="w-full h-full" sizes="56px" />
              </div>
              <div>
                <h2 className="font-black text-on-surface text-lg">{service.name}</h2>
                <p className="text-primary font-bold">₹{service.price} • {service.duration}</p>
              </div>
            </div>

            <p className="font-bold text-on-surface mb-3">{t.services.selectDate}</p>
            <div className="flex gap-2 flex-wrap mb-5">
              {dateOptions.map((d) => (
                <button
                  key={d.value}
                  onClick={() => { setSelectedDate(d.value); if (navigator.vibrate) navigator.vibrate(10); }}
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
            <div className="grid grid-cols-2 gap-2 mb-5">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => { setSelectedSlot(slot); if (navigator.vibrate) navigator.vibrate(10); }}
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
              className="w-full border-2 border-outline rounded-xl p-3 text-sm focus:border-primary focus:outline-none resize-none mb-5"
              rows={2}
              placeholder={t.services.addressPlaceholder}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <button
              disabled={!canProceed}
              onClick={() => {
                if (!selectedDate) { addToast(t.services.pleaseSelectDate, "error"); return; }
                if (!selectedSlot) { addToast(t.services.pleaseSelectTime, "error"); return; }
                if (!address.trim()) { addToast(t.services.pleaseEnterAddress, "error"); return; }
                setStep("confirm"); if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
              }}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base disabled:opacity-40 hover:bg-primary-dim transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.services.reviewBooking}
            </button>
            <button onClick={() => { onClose(); if (navigator.vibrate) navigator.vibrate(10); }} className="w-full mt-3 py-3 text-on-surface-variant font-semibold text-sm hover:text-on-surface transition-colors">
              {t.common.cancel}
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <h2 className="font-black text-xl text-on-surface mb-6">{t.services.confirmBooking}</h2>
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
              onClick={async () => {
                if (booking) return;
                if (!address.trim()) { addToast(t.services.pleaseEnterAddress, "error"); return; }
                setBooking(true);
                // Simulate booking delay
                await new Promise(resolve => setTimeout(resolve, 500));
                setStep("done"); if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
                setBooking(false);
              }}
              disabled={booking}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-primary-dim transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {booking ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t.services.booking}
                </>
              ) : t.services.confirmAndBook}
            </button>
            <button onClick={() => { setStep("pick"); if (navigator.vibrate) navigator.vibrate(10); }} className="w-full mt-3 py-3 text-on-surface-variant font-semibold text-sm hover:text-on-surface transition-colors">
              {t.services.goBack}
            </button>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-8 animate-pop-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <span className="material-symbols-outlined text-green-600 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h2 className="font-black text-2xl text-on-surface mb-2">{t.services.bookingConfirmed}</h2>
            <p className="text-on-surface-variant mb-1">{service.name}</p>
            <p className="font-bold text-primary mb-1">
              {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-on-surface-variant font-semibold mb-6">{selectedSlot}</p>
            <p className="text-sm text-on-surface-variant mb-8">{t.services.bookingConfirmedDesc}</p>
            <button
              onClick={() => { onClose(); if (navigator.vibrate) navigator.vibrate([20, 10, 20]); }}
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

const serviceCategories = [
  { id: "ac", name: "AC Service", icon: "ac_unit", count: 5, color: "bg-blue-100 text-blue-600" },
  { id: "cleaning", name: "Home Cleaning", icon: "cleaning_services", count: 4, color: "bg-green-100 text-green-600" },
  { id: "plumbing", name: "Plumbing", icon: "plumbing", count: 3, color: "bg-cyan-100 text-cyan-600" },
  { id: "electrical", name: "Electrical", icon: "electrical_services", count: 3, color: "bg-yellow-100 text-yellow-600" },
  { id: "beauty", name: "Beauty & Spa", icon: "spa", count: 6, color: "bg-pink-100 text-pink-600" },
  { id: "pest", name: "Pest Control", icon: "pest_control", count: 3, color: "bg-red-100 text-red-600" },
  { id: "car", name: "Car Care", icon: " directions_car", count: 3, color: "bg-purple-100 text-purple-600" },
  { id: "appliance", name: "Appliances", icon: "kitchen", count: 4, color: "bg-orange-100 text-orange-600" },
];

const services = [
  // AC Services
  { 
    id: "s1", 
    name: "AC Deep Cleaning", 
    category: "ac",
    rating: 4.8, 
    reviews: 28450, 
    price: 599, 
    originalPrice: 799,
    duration: "90 mins", 
    image: "https://images.unsplash.com/photo-1631564591547-4d46fe7c9c0a?w=400&q=80", 
    included: ["Complete interior cleaning", "Filter cleaning", "Coil cleaning", "Gas check"],
    warranty_days: 30,
    badge: "mostPopular"
  },
  { 
    id: "s2", 
    name: "AC Gas Refill", 
    category: "ac",
    rating: 4.7, 
    reviews: 18200, 
    price: 450, 
    duration: "30 mins", 
    image: "https://images.unsplash.com/photo-1631564591547-4d46fe7c9c0a?w=400&q=80", 
    included: ["Gas refill", "Leak check", "Performance test"],
    warranty_days: 90,
  },
  { 
    id: "s3", 
    name: "AC Repair", 
    category: "ac",
    rating: 4.6, 
    reviews: 15400, 
    price: 350, 
    duration: "60 mins", 
    image: "https://images.unsplash.com/photo-1631564591547-4d46fe7c9c0a?w=400&q=80", 
    included: ["Diagnosis", "Repair", "Testing"],
    warranty_days: 30,
  },

  // Cleaning Services
  { 
    id: "s4", 
    name: "Full Home Cleaning", 
    category: "cleaning",
    rating: 4.8, 
    reviews: 45000, 
    price: 2499, 
    originalPrice: 3499,
    duration: "4-5 hrs", 
    image: "/images/service_cleaning.png", 
    included: ["All rooms", "Kitchen", "Bathrooms", "Balcony"],
    warranty_days: 7,
    badge: "bestSeller"
  },
  { 
    id: "s5", 
    name: "Bathroom Deep Cleaning", 
    category: "cleaning",
    rating: 4.7, 
    reviews: 32100, 
    price: 799, 
    duration: "2 hrs", 
    image: "/images/service_cleaning.png", 
    included: ["Floor cleaning", "Tile cleaning", "Fitting cleaning", "Disinfection"],
    warranty_days: 7,
  },
  { 
    id: "s6", 
    name: "Kitchen Cleaning", 
    category: "cleaning",
    rating: 4.6, 
    reviews: 22500, 
    price: 999, 
    duration: "2-3 hrs", 
    image: "/images/service_cleaning.png", 
    included: ["Chimney cleaning", "Stove cleaning", "Countertops", "Tiles"],
    warranty_days: 7,
  },

  // Plumbing Services
  { 
    id: "s7", 
    name: "Tap & Mixer Repair", 
    category: "plumbing",
    rating: 4.8, 
    reviews: 22300, 
    price: 199, 
    duration: "45 mins", 
    image: "/images/service_plumbing.png", 
    included: ["Inspection", "Washer replacement", "Thread check"],
    warranty_days: 30,
  },
  { 
    id: "s8", 
    name: "Toilet Repair", 
    category: "plumbing",
    rating: 4.7, 
    reviews: 18900, 
    price: 299, 
    duration: "60 mins", 
    image: "/images/service_plumbing.png", 
    included: ["Flush repair", "Tank cleaning", "Leak fix"],
    warranty_days: 30,
  },
  { 
    id: "s9", 
    name: "Pipe Leakage Fix", 
    category: "plumbing",
    rating: 4.5, 
    reviews: 12300, 
    price: 399, 
    duration: "90 mins", 
    image: "/images/service_plumbing.png", 
    included: ["Leak detection", "Pipe repair", "Waterproofing"],
    warranty_days: 90,
  },

  // Electrical Services
  { 
    id: "s10", 
    name: "Fan Installation", 
    category: "electrical",
    rating: 4.8, 
    reviews: 28900, 
    price: 149, 
    duration: "30 mins", 
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80", 
    included: ["Installation", "Wiring", "Testing"],
    warranty_days: 90,
  },
  { 
    id: "s11", 
    name: "Switch Board Repair", 
    category: "electrical",
    rating: 4.6, 
    reviews: 19800, 
    price: 99, 
    duration: "20 mins", 
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80", 
    included: ["Inspection", "Switch replacement", "Testing"],
    warranty_days: 30,
  },
  { 
    id: "s12", 
    name: "MCB Repair", 
    category: "electrical",
    rating: 4.7, 
    reviews: 14200, 
    price: 249, 
    duration: "45 mins", 
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80", 
    included: ["MCB check", "Repair", "Safety check"],
    warranty_days: 90,
  },

  // Beauty & Spa
  { 
    id: "s13", 
    name: "Salon at Home - Women", 
    category: "beauty",
    rating: 4.8, 
    reviews: 45200, 
    price: 499, 
    originalPrice: 799,
    duration: "90 mins", 
    image: "/images/service_beauty.png", 
    included: ["Haircut", "Oiling", " blow dry", "Styling"],
    warranty_days: 7,
    badge: "popular"
  },
  { 
    id: "s14", 
    name: "Full Body Spa", 
    category: "beauty",
    rating: 4.9, 
    reviews: 32100, 
    price: 1299, 
    duration: "90 mins", 
    image: "/images/service_beauty.png", 
    included: ["Body massage", "Scrub", "Facial", "Steam"],
    warranty_days: 7,
    badge: "premium"
  },
  { 
    id: "s15", 
    name: "Manicure & Pedicure", 
    category: "beauty",
    rating: 4.7, 
    reviews: 28500, 
    price: 399, 
    duration: "60 mins", 
    image: "/images/service_beauty.png", 
    included: ["Nail paint", "Cuticle care", "Massage", "Polishing"],
    warranty_days: 14,
  },
  { 
    id: "s16", 
    name: "Facial Treatment", 
    category: "beauty",
    rating: 4.6, 
    reviews: 21300, 
    price: 599, 
    duration: "45 mins", 
    image: "/images/service_beauty.png", 
    included: ["Cleansing", "Scrub", "Face pack", "Moisturizer"],
    warranty_days: 14,
  },
  { 
    id: "s17", 
    name: "Hair Spa", 
    category: "beauty",
    rating: 4.8, 
    reviews: 19800, 
    price: 699, 
    duration: "60 mins", 
    image: "/images/service_beauty.png", 
    included: ["Oil massage", "Steam", "Hair mask", "Conditioning"],
    warranty_days: 14,
  },
  { 
    id: "s18", 
    name: "Salon at Home - Men", 
    category: "beauty",
    rating: 4.7, 
    reviews: 35600, 
    price: 349, 
    duration: "45 mins", 
    image: "/images/service_beauty.png", 
    included: ["Haircut", "Shave", "Beard trim", "Styling"],
    warranty_days: 7,
  },

  // Pest Control
  { 
    id: "s19", 
    name: "Cockroach Treatment", 
    category: "pest",
    rating: 4.5, 
    reviews: 18200, 
    price: 499, 
    duration: "60 mins", 
    image: "https://images.unsplash.com/photo-1624355284486-a4de69fc7241?w=400&q=80", 
    included: ["Spray treatment", "Gel application", "Safety coat"],
    warranty_days: 90,
  },
  { 
    id: "s20", 
    name: "Termite Control", 
    category: "pest",
    rating: 4.6, 
    reviews: 12400, 
    price: 1999, 
    duration: "3-4 hrs", 
    image: "https://images.unsplash.com/photo-1624355284486-a4de69fc7241?w=400&q=80", 
    included: ["Inspection", "Chemical treatment", "Barriers"],
    warranty_days: 365,
    badge: "professional"
  },
  { 
    id: "s21", 
    name: "Bed Bug Treatment", 
    category: "pest",
    rating: 4.4, 
    reviews: 8900, 
    price: 1299, 
    duration: "2-3 hrs", 
    image: "https://images.unsplash.com/photo-1624355284486-a4de69fc7241?w=400&q=80", 
    included: ["Heat treatment", "Spray", "Mattress cover"],
    warranty_days: 180,
  },

  // Car Care
  { 
    id: "s22", 
    name: "Car Detailing", 
    category: "car",
    rating: 4.7, 
    reviews: 15600, 
    price: 999, 
    duration: "2-3 hrs", 
    image: "https://images.unsplash.com/photo-1601362840469-51e4d8cb587a?w=400&q=80", 
    included: ["Exterior wash", "Interior cleaning", "Polishing", "Tyre shine"],
    warranty_days: 14,
  },
  { 
    id: "s23", 
    name: "AC Vent Cleaning", 
    category: "car",
    rating: 4.5, 
    reviews: 8200, 
    price: 599, 
    duration: "60 mins", 
    image: "https://images.unsplash.com/photo-1601362840469-51e4d8cb587a?w=400&q=80", 
    included: ["Vent cleaning", "Filter replacement", "Deodorization"],
    warranty_days: 30,
  },
  { 
    id: "s24", 
    name: "Car Waxing", 
    category: "car",
    rating: 4.6, 
    reviews: 11300, 
    price: 799, 
    duration: "90 mins", 
    image: "https://images.unsplash.com/photo-1601362840469-51e4d8cb587a?w=400&q=80", 
    included: ["Wash", "Wax application", "Buffing", " shine"],
    warranty_days: 30,
  },

  // Appliances
  { 
    id: "s25", 
    name: "Washing Machine Repair", 
    category: "appliance",
    rating: 4.7, 
    reviews: 22400, 
    price: 349, 
    duration: "60 mins", 
    image: "https://images.unsplash.com/photo-1556909212-d5b604d0c0d7?w=400&q=80", 
    included: ["Diagnosis", "Repair", "Testing"],
    warranty_days: 30,
  },
  { 
    id: "s26", 
    name: "Refrigerator Repair", 
    category: "appliance",
    rating: 4.6, 
    reviews: 18700, 
    price: 299, 
    duration: "45 mins", 
    image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80", 
    included: ["Cooling check", "Repair", "Gas top-up"],
    warranty_days: 30,
  },
  { 
    id: "s27", 
    name: "Microwave Repair", 
    category: "appliance",
    rating: 4.5, 
    reviews: 10200, 
    price: 249, 
    duration: "45 mins", 
    image: "https://images.unsplash.com/photo-1574269909862-7a39afa545c9?w=400&q=80", 
    included: ["Diagnosis", "Repair", "Testing"],
    warranty_days: 30,
  },
  { 
    id: "s28", 
    name: "Geyser Installation", 
    category: "appliance",
    rating: 4.4, 
    reviews: 7800, 
    price: 399, 
    duration: "60 mins", 
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", 
    included: ["Installation", "Safety check", "Demo"],
    warranty_days: 90,
  },
];

// Map landing-page category IDs → listing-page category IDs
const categoryIdMap: Record<string, string> = {
  ac_repair: "ac",
  beauty: "beauty",
  plumbing: "plumbing",
  electrical: "electrical",
  cleaning: "cleaning",
  appliance: "appliance",
  pest: "pest",
  car: "car",
};

function ServicesContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getSetting } = useServiceSettingsStore();
  const [isServiceable, setIsServiceable] = useState(true);
  const locationStore = useLocationStore();
  const userPincode = locationStore.pincode;
  const userCity = locationStore.city;
  const { addToast } = useToastStore();
  const supabase = createClient();

  // Check individual service categories
  const rawCategory = searchParams.get("category") ?? "all";
  
  // Map raw category to our service setting ID
  const categoryIdMap: Record<string, ServiceCategory> = {
    "ac": "ac",
    "beauty": "beauty",
    "cleaning": "cleaning",
    "plumbing": "plumbing", 
    "electrical": "electrical",
    "pest": "pest",
    "car": "car",
    "appliance": "appliance",
  };
  
  const mappedCategory = categoryIdMap[rawCategory];
  const initialCategory = categoryIdMap[rawCategory] ?? (rawCategory === "all" ? "all" : "all");

  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | "all">(initialCategory as ServiceCategory | "all");
  const [bookingService, setBookingService] = useState<Service | null>(null);

  // Keep in sync if the user navigates directly with a URL change
  useEffect(() => {
    const raw = searchParams.get("category") ?? "all";
    const mapped = categoryIdMap[raw] ?? "all";
    setSelectedCategory(mapped);
  }, [searchParams]);

  useEffect(() => {
    checkServiceability();
  }, [userPincode]);

  const checkServiceability = async () => {
    setIsServiceable(true);
  };

  // Check service availability after hooks
  if (mappedCategory) {
    const setting = getSetting(mappedCategory);
    if (setting && !setting.isEnabled) {
      return <ServiceUnavailable serviceName={setting.name} message={setting.message} icon={setting.icon} />;
    }
  }

  const filteredServices = selectedCategory === "all"
    ? services
    : services.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background text-on-background pb-24">
      {/* Header - Urban Company style */}
      <header className="bg-surface-container-lowest px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/app/explore" className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-on-surface">{t.services.title}</h1>
        </div>
        <p className="text-sm text-on-surface-variant mt-1">{t.services.subtitle}</p>
      </header>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: t.services.homeServices }]} />

      <PullToRefresh onRefresh={async () => {
        await checkServiceability();
      }}>

      {/* Location / Availability Banner */}
      {!isServiceable && (userPincode || userCity) && (
        <div className="bg-surface-container-low border-b border-amber-200 px-6 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-600 text-xl animate-bounce">warning</span>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-800">{t.services.notServiceable} {userPincode ? `Pincode ${userPincode}` : userCity}</p>
            <p className="text-[10px] text-amber-600 font-medium">{t.services.notServiceableDesc}</p>
          </div>
        </div>
      )}
      {isServiceable && (userPincode || userCity) && (
        <div className="bg-surface-container-low border-b border-green-200 px-6 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-green-600 text-sm">location_on</span>
          <p className="text-[11px] font-bold text-green-700">{t.services.providingServices} {userPincode ? `Pincode ${userPincode}` : userCity}</p>
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
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setSelectedCategory("all"); if (navigator.vibrate) navigator.vibrate(10); }}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap active:scale-95 transition-all ${
              selectedCategory === "all" ? "bg-primary text-white" : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-low"
            }`}
          >
            {t.services.all}
          </button>
          {serviceCategories.map((cat, i) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id as ServiceCategory); if (navigator.vibrate) navigator.vibrate(10); }}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap flex items-center gap-1 active:scale-95 transition-all animate-category-slide ${
                selectedCategory === cat.id ? "bg-primary text-white" : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-low"
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
        {filteredServices.map((service, index) => (
          <div key={service.id} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-outline-variant/10 card-lift animate-pop-in" style={{ animationDelay: `${Math.min(index * 80, 500)}ms` }}>
            {/* Image with overlay badges */}
            <div className="relative h-44 overflow-hidden">
              <BlurImage src={service.image} alt={service.name} fill className="w-full h-full" sizes="(max-width: 768px) 100vw, 50vw" fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80" />
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
              {/* Duration floating tag */}
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
              <p className="text-xs text-on-surface-variant/70 mt-0.5">{service.reviews.toLocaleString()} {t.services.reviews}</p>

              {/* What's Included */}
              <div className="mt-3 bg-surface-container-low rounded-xl p-3">
                <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-2">{t.services.whatIncluded}</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {service.included.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-green-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
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
                      setBookingService(service as Service);
                    }
                    if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
                  }}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all shadow-sm ${
                    isServiceable ? "bg-primary text-white hover:bg-primary-dim shadow-primary/20 hover:scale-[1.02]" : "bg-outline text-white cursor-not-allowed shadow-none"
                  }`}
                >
                  {isServiceable ? t.services.bookNow : t.services.unavailable}
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>
      </PullToRefresh>

      {/* Booking Modal */}
      {bookingService && (
        <BookingModal service={bookingService} onClose={() => setBookingService(null)} />
      )}
    </div>
  );
}

export default function ServicesPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-gray-500">{t.services.loadingServices}</span></div>}>
      <ServicesContent />
    </Suspense>
  );
}