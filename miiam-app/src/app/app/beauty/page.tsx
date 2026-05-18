"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cartStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import ServiceUnavailable from "@/components/ServiceUnavailable";

const categories = [
  { id: "salon", label: "Salon at Home", icon: "content_cut", color: "from-pink-500 to-pink-400", emoji: "💇‍♀️" },
  { id: "spa", label: "Spa & Massage", icon: "spa", color: "from-purple-500 to-purple-400", emoji: "💆‍♀️" },
  { id: "nails", label: "Nail Care", icon: "brush", color: "from-rose-500 to-rose-400", emoji: "💅" },
  { id: "makeup", label: "Makeup", icon: "face", color: "from-amber-500 to-amber-400", emoji: "💄" },
  { id: "threading", label: "Threading", icon: "clear", color: "from-orange-500 to-orange-400", emoji: "✨" },
  { id: "facial", label: "Facials", icon: "auto_awesome", color: "from-green-500 to-green-400", emoji: "🌸" },
];

const BEAUTY_VENDOR_ID = "00000000-0000-4000-8000-000000000004";

const services = {
  "salon": [
    { id: "s1", name: "Haircut & Styling", price: 299, original: 499, duration: "45 min", rating: 4.8, reviews: 12400, image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&q=80", popular: true, description: "Professional haircut with styling" },
    { id: "s2", name: "Hair Spa", price: 499, duration: "60 min", rating: 4.7, reviews: 8900, image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&q=80", description: "Deep conditioning hair treatment" },
    { id: "s3", name: "Full Body Waxing", price: 699, original: 899, duration: "90 min", rating: 4.9, reviews: 15600, image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=300&q=80", popular: true, description: "Complete body waxing service" },
    { id: "s4", name: "Hair Straightening", price: 1299, duration: "120 min", rating: 4.6, reviews: 5600, image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300&q=80", description: "Professional hair straightening" },
    { id: "s5", name: "Keratin Treatment", price: 2499, duration: "180 min", rating: 4.8, reviews: 3200, image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=300&q=80", description: "Smooth & shiny hair treatment" },
  ],
  "spa": [
    { id: "sp1", name: "Swedish Massage (60 min)", price: 799, original: 999, duration: "60 min", rating: 4.9, reviews: 23400, image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300&q=80", popular: true, description: "Relaxing full body massage" },
    { id: "sp2", name: "Deep Tissue Massage", price: 999, duration: "75 min", rating: 4.8, reviews: 18200, image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=300&q=80", description: "Intensive muscle massage" },
    { id: "sp3", name: "Aromatherapy Massage", price: 899, duration: "60 min", rating: 4.7, reviews: 15600, image: "https://images.unsplash.com/photo-1600334089648-b0d9d7028bc3?w=300&q=80", description: "Scented oil relaxation therapy" },
    { id: "sp4", name: "Balinese Massage", price: 1099, duration: "90 min", rating: 4.9, reviews: 9800, image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=300&q=80", description: "Traditional Indonesian massage" },
    { id: "sp5", name: "Foot Reflexology", price: 399, duration: "45 min", rating: 4.6, reviews: 12400, image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=300&q=80", description: "Relaxing foot massage" },
  ],
  "nails": [
    { id: "n1", name: "Classic Manicure", price: 199, duration: "30 min", rating: 4.7, reviews: 8900, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&q=80", description: "Basic nail care & polish" },
    { id: "n2", name: "Gel Manicure", price: 399, duration: "45 min", rating: 4.8, reviews: 15600, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&q=80", popular: true, description: "Long-lasting gel polish" },
    { id: "n3", name: "Classic Pedicure", price: 249, duration: "45 min", rating: 4.7, reviews: 7800, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&q=80", description: "Foot care & nail polish" },
    { id: "n4", name: "Gel Pedicure", price: 499, duration: "60 min", rating: 4.8, reviews: 11200, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&q=80", description: "Gel polish for feet" },
    { id: "n5", name: "Nail Art", price: 299, duration: "30 min", rating: 4.9, reviews: 6200, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&q=80", description: "Creative nail designs" },
    { id: "n6", name: "Nail Fill & Polish", price: 349, duration: "40 min", rating: 4.6, reviews: 5400, image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&q=80", description: "Fill in & repaint" },
  ],
  "makeup": [
    { id: "m1", name: "Party Makeup", price: 799, original: 999, duration: "60 min", rating: 4.8, reviews: 11200, image: "https://images.unsplash.com/photo-1487412947147-5cebf96a999c?w=300&q=80", popular: true, description: "Glamorous party look" },
    { id: "m2", name: "Bridal Makeup", price: 2999, original: 4999, duration: "120 min", rating: 4.9, reviews: 8900, image: "https://images.unsplash.com/photo-1487412947147-5cebf96a999c?w=300&q=80", description: "Complete bridal makeup" },
    { id: "m3", name: "HD Makeup", price: 1999, duration: "90 min", rating: 4.8, reviews: 6700, image: "https://images.unsplash.com/photo-1487412947147-5cebf96a999c?w=300&q=80", description: "High definition makeup" },
    { id: "m4", name: "Simple Makeup", price: 499, duration: "45 min", rating: 4.7, reviews: 9800, image: "https://images.unsplash.com/photo-1487412947147-5cebf96a999c?w=300&q=80", description: "Natural everyday look" },
  ],
  "threading": [
    { id: "t1", name: "Eyebrow Threading", price: 49, duration: "10 min", rating: 4.8, reviews: 23400, image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&q=80", description: "Perfect shaped brows" },
    { id: "t2", name: "Full Face Threading", price: 199, original: 249, duration: "30 min", rating: 4.9, reviews: 18200, image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&q=80", popular: true, description: "Complete facial threading" },
    { id: "t3", name: "Upper Lip Threading", price: 29, duration: "5 min", rating: 4.7, reviews: 15600, image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&q=80", description: "Quick lip threading" },
    { id: "t4", name: "Full Body Threading", price: 599, duration: "60 min", rating: 4.8, reviews: 8900, image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&q=80", description: "Complete body threading" },
  ],
  "facial": [
    { id: "f1", name: "Classic Facial", price: 399, duration: "45 min", rating: 4.7, reviews: 12400, image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&q=80", description: "Basic facial treatment" },
    { id: "f2", name: "Anti-Aging Facial", price: 799, duration: "60 min", rating: 4.8, reviews: 8900, image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&q=80", description: "Reduce fine lines & wrinkles" },
    { id: "f3", name: "Glow Facial", price: 599, original: 799, duration: "45 min", rating: 4.9, reviews: 15600, image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&q=80", popular: true, description: "Instant radiant glow" },
    { id: "f4", name: "Hydrating Facial", price: 699, duration: "50 min", rating: 4.8, reviews: 11200, image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&q=80", description: "Deep moisturizing treatment" },
    { id: "f5", name: "Detox Facial", price: 899, duration: "60 min", rating: 4.7, reviews: 7800, image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&q=80", description: "Deep cleansing & purification" },
  ],
};

const experts = [
  { name: "Priya Sharma", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80", rating: 4.9, services: 456, experience: "8 years", specialist: "Bridal Makeup" },
  { name: "Anjali Gupta", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80", rating: 4.8, services: 389, experience: "6 years", specialist: "Hair Styling" },
  { name: "Meera Patel", photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80", rating: 4.9, services: 567, experience: "10 years", specialist: "Spa & Massage" },
];

const packages = [
  { id: "p1", name: "Bridal Gold Package", price: 9999, original: 14999, services: ["Bridal Makeup", "Mehendi", "Facial", "Hair Styling"], savings: "33%", color: "from-amber-500 to-yellow-400" },
  { id: "p2", name: "Complete Spa Day", price: 1999, original: 2999, services: ["Swedish Massage", "Aromatherapy", "Foot Reflexology"], savings: "33%", color: "from-purple-500 to-pink-400" },
  { id: "p3", name: "Glam Package", price: 1499, original: 2499, services: ["Party Makeup", "Hair Styling", "Nail Art"], savings: "40%", color: "from-rose-500 to-pink-400" },
];

const trending = ["Hair rebonding", "Keratin treatment", "Bridal makeup", "Hot oil massage", "Gel manicure"];

function getNextDays(n: number) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({ label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" }), date: d.toISOString().split("T")[0] });
  }
  return days;
}

const timeSlots = ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM", "07:00 PM"];

export default function BeautyPage() {
  const { getSetting } = useServiceSettingsStore();
  const [activeCategory, setActiveCategory] = useState("salon");
  const beautySetting = getSetting("beauty");

  if (beautySetting && !beautySetting.isEnabled) {
    return <ServiceUnavailable serviceName="Beauty & Wellness" message={beautySetting.message} icon="spa" />;
  }
  const [bookingService, setBookingService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [location, setLocation] = useState<"home" | "salon">("home");
  const { addItem, items, updateQuantity } = useCartStore();

  const days = getNextDays(7);

  const getQty = (id: string) => items.filter(i => i.menu_item_id === id).reduce((s, i) => s + i.quantity, 0);

  const handleBook = (service: any) => {
    setBookingService(service);
    setSelectedDate(0);
    setSelectedTime(null);
  };

  const confirmBooking = () => {
    if (!bookingService || !selectedTime) return;
    
    addItem({
      id: bookingService.id + Date.now(),
      menu_item_id: bookingService.id,
      vendor_id: BEAUTY_VENDOR_ID,
      vendor_name: "MIIAM Beauty",
      name: `${bookingService.name} - ${days[selectedDate].label}, ${selectedTime}`,
      price: bookingService.price,
      image_url: bookingService.image,
    });
    
    setBookingService(null);
  };

  const currentServices = services[activeCategory as keyof typeof services] || [];

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-24">
      {/* Header */}
      <header className="bg-gradient-to-br from-pink-500 to-rose-500 text-white p-6 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black">Beauty & Wellness</h1>
          <button className="p-2 bg-white/20 rounded-full">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
        <p className="text-white/90 mb-4">Professional beauty services at your home</p>
        
        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input type="text" placeholder="Search for services..." className="w-full pl-10 pr-4 py-3 rounded-xl text-slate-800" />
        </div>
      </header>

      {/* Categories */}
      <div className="px-4 -mt-6">
        <div className="bg-white rounded-2xl p-2 shadow-lg">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); if (navigator.vibrate) navigator.vibrate(10); }}
                className={`flex-shrink-0 px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 ${
                  activeCategory === cat.id
                    ? "bg-gradient-to-r " + cat.color + " text-white"
                    : "bg-slate-100 text-slate-600"
                } animate-category-slide`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="px-4 py-6 space-y-8">
        {/* Expert Stylists */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-slate-800">Top Stylists</h2>
            <span className="text-xs font-bold text-pink-500">View All</span>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {experts.map((expert, i) => (
              <div key={i} className="flex-shrink-0 w-40 bg-white rounded-2xl p-4 shadow-sm text-center card-lift animate-pop-in" style={{ animationDelay: `${i * 80}ms` }}>
                <img src={expert.photo} alt={expert.name} className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-pink-200" />
                <p className="font-bold text-slate-800 mt-3 text-sm">{expert.name}</p>
                <p className="text-xs text-slate-500">{expert.specialist}</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-xs font-bold">{expert.rating}</span>
                  <span className="text-xs text-slate-400">({expert.services})</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Services List */}
        <section>
          <h2 className="text-lg font-black text-slate-800 mb-4">{categories.find(c => c.id === activeCategory)?.label}</h2>
          <div className="space-y-4">
            {currentServices.map((service: any, index) => {
              const qty = getQty(service.id);
              const discount = service.original ? Math.round(((service.original - service.price) / service.original) * 100) : 0;
              
              return (
                <div key={service.id} className="bg-white rounded-2xl p-4 shadow-sm flex gap-4 card-lift animate-pop-in" style={{ animationDelay: `${Math.min(index * 80, 500)}ms` }}>
                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                    <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800">{service.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">{service.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="flex items-center gap-0.5 text-xs font-bold">
                            <span className="material-symbols-outlined text-amber-500 text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            {service.rating}
                          </span>
                          <span className="text-xs text-slate-400">({service.reviews.toLocaleString()})</span>
                        </div>
                      </div>
                      {service.popular && (
                        <span className="bg-pink-100 text-pink-600 text-[10px] font-bold px-2 py-1 rounded-full">Popular</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg text-[#ba001c]">₹{service.price}</span>
                        {service.original && (
                          <>
                            <span className="text-sm text-slate-400 line-through">₹{service.original}</span>
                            <span className="text-xs bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full">{discount}% OFF</span>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        {service.duration}
                      </span>
                    </div>
                    <div className="mt-3">
                      {qty === 0 ? (
                        <button onClick={() => { handleBook(service); if (navigator.vibrate) navigator.vibrate([20, 10, 20]); }} className="w-full bg-[#ba001c] text-white font-bold py-2 rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all animate-glow-pulse">
                          Book Now
                        </button>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-[#ba001c] rounded-xl px-2 animate-cart-pop">
                            <button onClick={() => { updateQuantity(service.id, qty - 1); if (navigator.vibrate) navigator.vibrate(10); }} className="w-6 h-6 flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-transform">
                              <span className="material-symbols-outlined text-sm">remove</span>
                            </button>
                            <span className="font-bold text-white">{qty}</span>
                            <button onClick={() => { addItem({ id: service.id + Date.now(), menu_item_id: service.id, vendor_id: BEAUTY_VENDOR_ID, vendor_name: "MIIAM Beauty", name: service.name, price: service.price, image_url: service.image }); if (navigator.vibrate) navigator.vibrate([20, 10, 20]); }} className="w-6 h-6 flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-transform">
                              <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Packages */}
        <section>
          <h2 className="text-lg font-black text-slate-800 mb-4">Special Packages</h2>
          <div className="space-y-4">
            {packages.map((pkg, i) => (
              <div key={pkg.id} className={`bg-gradient-to-r ${pkg.color} rounded-2xl p-5 text-white card-lift animate-pop-in`} style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold opacity-80">Save {pkg.savings}</p>
                    <h3 className="font-black text-xl mt-1">{pkg.name}</h3>
                    <ul className="mt-2 space-y-1">
                      {pkg.services.map((s, i) => (
                        <li key={i} className="text-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">check</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black">₹{pkg.price}</span>
                    <span className="text-sm opacity-80 line-through ml-2">₹{pkg.original}</span>
                  </div>
                </div>
                <button onClick={() => { if (navigator.vibrate) navigator.vibrate(10); }} className="w-full mt-4 bg-white text-slate-900 font-bold py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Trending */}
        <section>
          <h2 className="text-lg font-black text-slate-800 mb-4">Trending Searches</h2>
          <div className="flex flex-wrap gap-2">
            {trending.map((item, i) => (
              <button key={i} onClick={() => { if (navigator.vibrate) navigator.vibrate(10); }} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:border-pink-300 hover:text-pink-600 hover:scale-105 active:scale-95 transition-all animate-category-slide" style={{ animationDelay: `${i * 50}ms` }}>
                {item}
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Booking Modal */}
      {bookingService && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Book {bookingService.name}</h3>
              <button onClick={() => { setBookingService(null); if (navigator.vibrate) navigator.vibrate(10); }} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Location */}
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Service Location</p>
            <div className="flex gap-3 mb-6">
              <button onClick={() => { setLocation("home"); if (navigator.vibrate) navigator.vibrate(10); }} className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 hover:scale-[1.02] active:scale-[0.98] transition-all ${location === "home" ? "border-[#ba001c] bg-pink-50" : "border-slate-200"}`}>
                🏠 Home
              </button>
              <button onClick={() => { setLocation("salon"); if (navigator.vibrate) navigator.vibrate(10); }} className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 hover:scale-[1.02] active:scale-[0.98] transition-all ${location === "salon" ? "border-[#ba001c] bg-pink-50" : "border-slate-200"}`}>
                🏪 Salon Visit
              </button>
            </div>

            {/* Date */}
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Select Date</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
              {days.map((day, i) => (
                <button key={i} onClick={() => { setSelectedDate(i); if (navigator.vibrate) navigator.vibrate(10); }} className={`flex-shrink-0 px-4 py-3 rounded-xl font-bold text-sm border-2 hover:scale-105 active:scale-95 transition-all ${selectedDate === i ? "border-[#ba001c] bg-[#ba001c] text-white" : "border-slate-200"}`}>
                  {day.label}
                </button>
              ))}
            </div>

            {/* Time */}
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Select Time</p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {timeSlots.map((time) => (
                <button key={time} onClick={() => { setSelectedTime(time); if (navigator.vibrate) navigator.vibrate(10); }} className={`py-3 rounded-xl font-bold text-sm border-2 hover:scale-105 active:scale-95 transition-all ${selectedTime === time ? "border-slate-800 bg-slate-800 text-white" : "border-slate-200"}`}>
                  {time}
                </button>
              ))}
            </div>

            {/* Price */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-600">Service Price</span>
                <span className="font-bold">₹{bookingService.price}</span>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t border-slate-200">
                <span className="font-bold">Total</span>
                <span className="font-black text-[#ba001c] text-xl">₹{bookingService.price}</span>
              </div>
            </div>

            <button onClick={() => { confirmBooking(); if (navigator.vibrate) navigator.vibrate([20, 10, 20]); }} disabled={!selectedTime} className="w-full bg-gradient-to-r from-[#ba001c] to-[#ff7670] text-white py-4 rounded-xl font-extrabold disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all">
              Confirm Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}