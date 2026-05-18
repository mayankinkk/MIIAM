"use client";

import { useState, useEffect } from "react";
import { useRouter, use } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AnimatedStarRating({ 
  rating, 
  hover, 
  setHover, 
  setRating, 
  label 
}: { 
  rating: number; 
  hover: number; 
  setHover: (v: number) => void; 
  setRating: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      {label && (
        <div className="text-center">
          <h2 className="text-xl font-bold tracking-tight">{label}</h2>
        </div>
      )}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hover || rating);
          return (
            <button
              key={star}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => {
                setRating(star);
                if (typeof navigator !== "undefined" && navigator.vibrate) {
                  navigator.vibrate(20);
                }
              }}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <span
                className={`material-symbols-outlined text-5xl transition-all duration-300 ${
                  isActive ? "text-[#ba001c]" : "text-[#dd9ca6]"
                } ${hover === star ? "scale-110" : ""}`}
                style={{ 
                  fontVariationSettings: `'FILL' ${isActive ? 1 : 0}`,
                  filter: isActive ? "drop-shadow(0 0 8px rgba(186, 0, 28, 0.5))" : "none",
                }}
              >
                star
              </span>
            </button>
          );
        })}
      </div>
      {rating > 0 && (
        <p className="text-sm text-[#ba001c] font-bold animate-fade-in">
          {rating === 5 ? "🌟 Excellent!" : rating >= 4 ? "⭐ Great!" : rating >= 3 ? "👍 Good" : "💫 Okay"}
        </p>
      )}
    </div>
  );
}

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-0"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            animation: `confetti-fall 3s ease-out forwards`,
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: Math.random() * 8 + 4,
              height: Math.random() * 8 + 4,
              backgroundColor: ["#ba001c", "#ff7670", "#ffd200", "#0b50d5", "#38ef7d"][i % 5],
              animation: `confetti-spin 1.5s linear infinite`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

const feedbackTags = [
  "Fast Delivery",
  "Friendly Rider",
  "Good Packaging",
  "Hot Food",
  "On Time",
  "Fresh Ingredients",
  "Great Taste",
  "Careful Handling",
];

export default function RatingReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [foodRating, setFoodRating] = useState(0);
  const [riderRating, setRiderRating] = useState(0);
  const [hoverFood, setHoverFood] = useState(0);
  const [hoverRider, setHoverRider] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      const { data: orderData } = await supabase
        .from("orders")
        .select("*, vendor:vendors(name, image_url), rider:riders(name, profile_image)")
        .eq("id", id)
        .single();
      
      if (orderData) setOrder(orderData);
      setLoading(false);
    }
    loadOrder();
  }, [id, supabase]);

  const handleSubmit = async () => {
    if (!order) return;

    try {
      // Save rating to reviews table
      if (foodRating > 0) {
        await supabase.from("reviews").insert({
          order_id: id,
          user_id: order.user_id,
          vendor_id: order.vendor_id,
          rating: foodRating,
          review_text: feedback,
          tags: selectedTags,
          type: "food",
        });
      }

      // Update rider rating
      if (riderRating > 0 && order.rider_id) {
        const { data: rider } = await supabase
          .from("riders")
          .select("rating, total_ratings")
          .eq("id", order.rider_id)
          .single();
        
        if (rider) {
          const newRating = ((rider.rating || 0) * (rider.total_ratings || 0) + riderRating) / ((rider.total_ratings || 0) + 1);
          await supabase.from("riders").update({ 
            rating: Math.round(newRating * 10) / 10,
            total_ratings: (rider.total_ratings || 0) + 1
          }).eq("id", order.rider_id);
        }
      }

      // Mark order as rated
      await supabase.from("orders").update({ rating_submitted: true }).eq("id", id);

      setSubmitted(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([50, 30, 100]);
      }
      setTimeout(() => router.push("/app/orders"), 2500);
    } catch (err) {
      console.error("Error submitting rating:", err);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <>
        <Confetti />
        <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center p-6">
          <div className="text-center animate-bounce-in">
            <div className="w-32 h-32 bg-gradient-to-br from-[#ba001c] to-[#ff7670] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#ba001c]/30">
              <span className="material-symbols-outlined text-white text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </div>
            <h2 className="text-3xl font-extrabold text-[#4d212a] mb-2">Thanks for rating! 💖</h2>
            <p className="text-[#814c55] font-medium">Your feedback helps us serve you better</p>
            <div className="mt-8 flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="text-2xl animate-bounce-in" style={{ animationDelay: `${i * 0.1}s` }}>⭐</span>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[#fff4f4]/80 backdrop-blur-xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
        <div className="flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-[#4d212a]">close</span>
            </button>
            <span className="text-2xl font-extrabold tracking-tighter text-[#ba001c]">MIIAM</span>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-md mx-auto space-y-6">
        <section className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#ffd2d7] rounded-full mb-4">
            <span className="material-symbols-outlined text-[#ba001c] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#4d212a]">Delivered!</h1>
          <p className="text-[#814c55] font-medium">How was your experience today?</p>
        </section>

        <section className="bg-white rounded-xl p-8 shadow-[0px_20px_40px_rgba(77,33,42,0.04)] space-y-6">
          <AnimatedStarRating
            rating={foodRating}
            hover={hoverFood}
            setHover={setHoverFood}
            setRating={setFoodRating}
            label={order?.vendor?.name || "Restaurant"}
          />
        </section>

        <section className="bg-white rounded-xl p-8 shadow-[0px_20px_40px_rgba(77,33,42,0.04)] space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#ffe1e4]">
                <img 
                  alt="Rider" 
                  className="w-full h-full object-cover" 
                  src={order?.rider?.profile_image || "https://via.placeholder.com/80"} 
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[#0b50d5] text-white rounded-full p-1.5 shadow-md">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>electric_moped</span>
              </div>
            </div>
            <p className="text-sm text-[#814c55]">Rate Delivery Service</p>
          </div>
          <AnimatedStarRating
            rating={riderRating}
            hover={hoverRider}
            setHover={setHoverRider}
            setRating={setRiderRating}
          />
        </section>

        <section className="space-y-4">
          <label className="block text-lg font-semibold px-2">Tell us more...</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full bg-white rounded-xl border-none focus:ring-2 focus:ring-[#ba001c]/40 p-6 min-h-[120px] text-[#4d212a] shadow-[0px_10px_20px_rgba(77,33,42,0.02)] resize-none"
            placeholder="Share your experience (optional)"
          />
        </section>

        <section className="flex flex-wrap gap-2">
          {feedbackTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95 ${
                selectedTags.includes(tag)
                  ? "bg-[#ba001c] text-white"
                  : "bg-white text-[#814c55] hover:bg-[#ffe1e4]"
              }`}
            >
              {tag}
            </button>
          ))}
        </section>

        <button
          onClick={handleSubmit}
          disabled={foodRating === 0 || riderRating === 0}
          className="w-full bg-gradient-to-r from-[#ba001c] to-[#a40017] text-white rounded-xl py-5 text-lg font-bold shadow-[0px_15px_30px_rgba(186,0,28,0.2)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Review
        </button>

        <p className="text-center text-[#814c55] text-xs px-8 leading-relaxed">
          Your feedback helps us improve our service and rewards our best performing vendors and riders.
        </p>
      </main>
    </>
  );
}