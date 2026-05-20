"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/store/cartStore";

const servicesData: Record<string, any> = {
  s1: { 
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
    badge: "Most Popular",
    description: "Get your AC units deep cleaned by certified technicians. Removes dust, mold, and bacteria for cleaner, healthier air."
  },
  s2: { 
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
    description: "Professional AC gas refill service. Restores cooling efficiency and maintains optimal performance."
  },
  s3: { 
    id: "s3", 
    name: "Full Home Cleaning", 
    category: "cleaning",
    rating: 4.8, 
    reviews: 45000, 
    price: 2499, 
    originalPrice: 3499,
    duration: "4-5 hrs", 
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80", 
    included: ["All rooms", "Kitchen", "Bathrooms", "Balcony"],
    warranty_days: 7,
    badge: "Best Seller",
    description: "Complete home cleaning service covering all rooms, kitchen, bathrooms, and balcony. Professional team with eco-friendly products."
  },
  s4: { 
    id: "s4", 
    name: "Bathroom Deep Cleaning", 
    category: "cleaning",
    rating: 4.7, 
    reviews: 32100, 
    price: 799, 
    duration: "2 hrs", 
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80", 
    included: ["Floor cleaning", "Tile cleaning", "Fitting cleaning", "Disinfection"],
    warranty_days: 7,
    description: "Deep cleaning for your bathrooms. Removes stains, mold, and limescale. Sanitization included."
  },
  s5: { 
    id: "s5", 
    name: "Tap & Mixer Repair", 
    category: "plumbing",
    rating: 4.8, 
    reviews: 22300, 
    price: 199, 
    duration: "45 mins", 
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", 
    included: ["Inspection", "Washer replacement", "Thread check"],
    warranty_days: 30,
    description: "Professional plumbing repair service. Fix leaking taps, faulty mixers, and replace washers."
  },
  s6: { 
    id: "s6", 
    name: "Fan Installation", 
    category: "electrical",
    rating: 4.8, 
    reviews: 28900, 
    price: 149, 
    duration: "30 mins", 
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80", 
    included: ["Installation", "Wiring", "Testing"],
    warranty_days: 90,
    description: "Professional fan installation service. Safe and secure installation with testing."
  },
};

const timeSlots = [
  "09:00 AM - 11:00 AM",
  "11:00 AM - 01:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
  "06:00 PM - 08:00 PM",
];

function ServiceDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("id") || "s1";
  const service = servicesData[serviceId] || servicesData.s1;
  
  const { addItem } = useCartStore();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleAddToCart = () => {
    setAdding(true);
    addItem({
      id: `service-${service.id}`,
      name: service.name,
      price: service.price,
      image_url: service.image,
      vendor_name: "MIIAM Services",
      vendor_id: "5e700000-0000-4000-8000-000000000000",
      menu_item_id: service.id,
    }, 1);
    setTimeout(() => {
      setAdding(false);
      router.push("/app/cart");
    }, 500);
  };

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <div className="min-h-screen bg-white pb-24">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-4 py-4 bg-white/80 backdrop-blur-2xl border-b border-gray-100">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100">
          <span className="material-symbols-outlined text-gray-700">arrow_back</span>
        </button>
        <span className="text-xl font-black text-gray-800">MIIAM</span>
        <div className="w-10" />
      </nav>

      <div className="pt-16">
        <img src={service.image} alt={service.name} className="w-full h-64 object-cover" />
      </div>

      <div className="p-4">
        {service.badge && (
          <span className="inline-block text-xs font-bold text-[#5b31fc] bg-purple-100 px-3 py-1 rounded-full mb-3">
            {service.badge}
          </span>
        )}
        
        <h1 className="text-2xl font-black text-gray-800 mb-2">{service.name}</h1>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded">
            <span className="text-xs font-bold text-green-700">{service.rating}</span>
            <span className="text-green-700 text-xs">★</span>
          </div>
          <span className="text-sm text-gray-500">{service.reviews.toLocaleString()} reviews</span>
          <span className="text-gray-300">•</span>
          <span className="text-sm text-gray-500">{service.duration}</span>
        </div>

        <p className="text-gray-600 mb-6">{service.description}</p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-gray-800 mb-3">What's Included</h3>
          <div className="space-y-2">
            {service.included?.map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                <span className="text-sm text-gray-600">{item}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
            <span className="material-symbols-outlined text-blue-600 text-sm">verified</span>
            
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3">Select Schedule</h3>
          
          <div className="mb-3">
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full p-3 border border-gray-200 rounded-xl flex items-center justify-between"
            >
              <span className={selectedDate ? "text-gray-800" : "text-gray-400"}>
                {selectedDate || "Select Date"}
              </span>
              <span className="material-symbols-outlined text-gray-400">calendar_today</span>
            </button>
            
            {showDatePicker && (
              <div className="mt-2 p-3 border border-gray-200 rounded-xl bg-white">
                <div className="flex gap-2 overflow-x-auto">
                  {dates.map((date, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedDate(date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }));
                        setShowDatePicker(false);
                      }}
                      className="flex-shrink-0 p-2 rounded-lg text-sm hover:bg-gray-100"
                    >
                      {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <button 
              onClick={() => setShowTimePicker(!showTimePicker)}
              className="w-full p-3 border border-gray-200 rounded-xl flex items-center justify-between"
            >
              <span className={selectedTime ? "text-gray-800" : "text-gray-400"}>
                {selectedTime || "Select Time Slot"}
              </span>
              <span className="material-symbols-outlined text-gray-400">schedule</span>
            </button>
            
            {showTimePicker && (
              <div className="mt-2 p-3 border border-gray-200 rounded-xl bg-white">
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedTime(slot);
                        setShowTimePicker(false);
                      }}
                      className={`p-2 rounded-lg text-sm ${selectedTime === slot ? 'bg-[#5b31fc] text-white' : 'hover:bg-gray-100'}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl">
          <div>
            <span className="text-2xl font-black text-gray-800">₹{service.price}</span>
            {service.originalPrice && (
              <span className="text-sm text-gray-400 line-through ml-2">₹{service.originalPrice}</span>
            )}
          </div>
          <span className="text-xs text-gray-500">Inclusive of all taxes</span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={adding}
          className="fixed bottom-6 left-4 right-4 bg-[#5b31fc] text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform z-50"
        >
          {adding ? "Adding..." : "Book Now"}
        </button>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#5b31fc] border-t-transparent rounded-full animate-spin" />
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