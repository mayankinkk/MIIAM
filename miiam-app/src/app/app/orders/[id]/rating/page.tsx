"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import { useTranslation } from "@/lib/i18n/useTranslation";

function AnimatedStarRating({ 
  rating, 
  hover, 
  setHover, 
  setRating, 
  label,
  t 
}: { 
  rating: number; 
  hover: number; 
  setHover: (v: number) => void; 
  setRating: (v: number) => void;
  label: string;
  t: any;
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
                  isActive ? "text-primary" : "text-outline-variant"
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
        <p className="text-sm text-primary font-bold animate-fade-in">
          {rating === 5 ? t.rating.excellent : rating >= 4 ? t.rating.great : rating >= 3 ? t.rating.good : t.rating.okay}
        </p>
      )}
    </div>
  );
}

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      size: Math.random() * 8 + 4,
      color: ["var(--color-primary)", "#ff7670", "#ffd200", "#0b50d5", "#38ef7d"][i % 5],
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <div
          key={i}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animation: `confetti-fall 3s ease-out forwards`,
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              animation: `confetti-spin 1.5s linear infinite`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function getFeedbackTags(t: any) {
  return [
    t.rating.fastDelivery,
    t.rating.friendlyRider,
    t.rating.goodPackaging,
    t.rating.hotFood,
    t.rating.onTime,
    t.rating.freshIngredients,
    t.rating.greatTaste,
    t.rating.carefulHandling,
  ];
}

export default function RatingReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const { id } = use(params);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [foodRating, setFoodRating] = useState(0);
  const [riderRating, setRiderRating] = useState(0);
  const [dimTaste, setDimTaste] = useState(0);
  const [dimPackaging, setDimPackaging] = useState(0);
  const [dimDelivery, setDimDelivery] = useState(0);
  const [hoverFood, setHoverFood] = useState(0);
  const [hoverRider, setHoverRider] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const { addToast } = useToastStore();

  useEffect(() => {
    async function loadOrder() {
      try {
        const { data: orderData } = await supabase
          .from("orders")
          .select("*, vendor:vendors(name, cover_image_url), rider:riders(name, profile_image)")
          .eq("id", id)
          .single();
        
        if (orderData) setOrder(orderData);
      } catch (err) {
        console.error("Failed to load order:", err);
      }
      setLoading(false);
    }
    loadOrder();
  }, [id]);

  const handleSubmit = async () => {
    if (!order) return;

    try {
      // Save rating to reviews table
      if (foodRating > 0) {
        const reviewData: Record<string, any> = {
          order_id: id,
          user_id: order.user_id,
          vendor_id: order.vendor_id,
          rating: foodRating,
          review_text: feedback,
          tags: selectedTags,
          type: "food",
        };
        if (dimTaste > 0) reviewData.food_quality = dimTaste;
        if (dimPackaging > 0) reviewData.packaging = dimPackaging;
        if (dimDelivery > 0) reviewData.delivery_time = dimDelivery;
        await supabase.from("reviews").insert(reviewData);
      }

      // Update rider rating atomically via RPC
      if (riderRating > 0 && order.rider_id) {
        const { error: rpcErr } = await supabase.rpc("update_rider_rating", {
          p_rider_id: order.rider_id,
          p_rating: riderRating,
        });
        if (rpcErr) {
          // Fallback: read-update with retry
          for (let attempt = 0; attempt < 3; attempt++) {
            const { data: rider, error: fetchErr } = await supabase
              .from("riders")
              .select("rating, total_ratings")
              .eq("id", order.rider_id)
              .single();
            if (fetchErr || !rider) break;
            const newRating = ((rider.rating || 0) * (rider.total_ratings || 0) + riderRating) / ((rider.total_ratings || 0) + 1);
            const { error: updateErr } = await supabase
              .from("riders")
              .update({ rating: Math.round(newRating * 10) / 10, total_ratings: (rider.total_ratings || 0) + 1 })
              .eq("id", order.rider_id)
              .eq("total_ratings", rider.total_ratings || 0);
            if (!updateErr) break;
          }
        }
      }

      // Mark order as rated
      const { error: markErr } = await supabase.from("orders").update({ rating_submitted: true }).eq("id", id);
      if (markErr) console.warn("rating_submitted column may not exist:", markErr.message);

      setSubmitted(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([50, 30, 100]);
      }
      setTimeout(() => router.push("/app/orders"), 2500);
    } catch (err) {
      console.error("Error submitting rating:", err);
      addToast(t.rating.ratingFailed, "error");
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <>
        <Confetti />
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
          <div className="text-center animate-bounce-in">
            <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary-container rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
              <span className="material-symbols-outlined text-white text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </div>
            <h2 className="text-3xl font-extrabold text-on-surface mb-2">{t.rating.thanksForRating}</h2>
            <p className="text-on-surface-variant font-medium">{t.rating.feedbackHelps}</p>
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
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
        <div className="flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} aria-label="Close" className="hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined text-on-surface">close</span>
            </button>
            <span className="text-2xl font-extrabold tracking-tighter text-primary">MIIAM</span>
          </div>
        </div>
      </header>
      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'My Orders', href: '/app/orders' }, { label: t.rating.rateAndReview }]} />
      <main className="pt-24 pb-12 px-6 max-w-md mx-auto space-y-6">
        <section className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-surface-container-highest rounded-full mb-4">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">{t.rating.title}</h1>
          <p className="text-on-surface-variant font-medium">{t.rating.subtitle}</p>
        </section>

        <section className="bg-[var(--color-surface-container-lowest)] rounded-xl p-8 shadow-[0px_20px_40px_rgba(77,33,42,0.04)] space-y-6">
          <AnimatedStarRating
            rating={foodRating}
            hover={hoverFood}
            setHover={setHoverFood}
            setRating={setFoodRating}
            label={order?.vendor?.name || "Restaurant"}
            t={t}
          />
        </section>

        <section className="bg-[var(--color-surface-container-lowest)] rounded-xl p-6 shadow-[0px_20px_40px_rgba(77,33,42,0.04)] space-y-4">
          <h3 className="text-sm font-bold text-on-surface-variant text-center uppercase tracking-wider">{t.rating.rateInDetail}</h3>
          <div className="space-y-3">
            {[
              { label: t.rating.tasteQuality, state: dimTaste, setter: setDimTaste },
              { label: t.rating.packaging, state: dimPackaging, setter: setDimPackaging },
              { label: t.rating.deliveryTime, state: dimDelivery, setter: setDimDelivery },
            ].map((dim) => (
              <div key={dim.label} className="flex items-center justify-between">
                <span className="text-sm font-medium text-on-surface">{dim.label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => dim.setter(star)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <span
                        className={`material-symbols-outlined text-xl transition-all ${
                          star <= dim.state ? "text-primary" : "text-outline-variant"
                        }`}
                        style={{ fontVariationSettings: `'FILL' ${star <= dim.state ? 1 : 0}` }}
                      >
                        star
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[var(--color-surface-container-lowest)] rounded-xl p-8 shadow-[0px_20px_40px_rgba(77,33,42,0.04)] space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-surface-container">
                <BlurImage 
                  alt="Rider" 
                  fill
                  className="w-full h-full"
                  sizes="80px"
                  src={order?.rider?.profile_image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23e0e0e0'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='32' fill='%239e9e9e'%3E%F0%9F%9A%B5%3C/text%3E%3C/svg%3E"} 
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-secondary text-white rounded-full p-1.5 shadow-md">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>electric_moped</span>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant">{t.rating.rateDelivery}</p>
          </div>
          <AnimatedStarRating
            rating={riderRating}
            hover={hoverRider}
            setHover={setHoverRider}
            setRating={setRiderRating}
            label={order?.rider?.full_name || "Rider"}
            t={t}
          />
        </section>

        <section className="space-y-4">
          <label className="block text-lg font-semibold px-2">{t.rating.tellUsMore}</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full bg-[var(--color-surface-container-lowest)] rounded-xl border-none focus:ring-2 focus:ring-primary/40 p-6 min-h-[120px] text-on-surface shadow-[0px_10px_20px_rgba(77,33,42,0.02)] resize-none"
            placeholder={t.rating.shareExperience}
          />
        </section>

        <section className="flex flex-wrap gap-2">
          {getFeedbackTags(t).map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95 ${
                selectedTags.includes(tag)
                  ? "bg-primary text-white"
                  : "bg-[var(--color-surface-container-lowest)] text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {tag}
            </button>
          ))}
        </section>

        <button
          onClick={handleSubmit}
          disabled={foodRating === 0 || riderRating === 0}
          className="w-full bg-gradient-to-r from-primary to-[#a40017] text-white rounded-xl py-5 text-lg font-bold shadow-[0px_15px_30px_rgba(186,0,28,0.2)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t.rating.submitReview}
        </button>

        <p className="text-center text-on-surface-variant text-xs px-8 leading-relaxed">
          {t.rating.feedbackImprove}
        </p>
      </main>
    </>
  );
}