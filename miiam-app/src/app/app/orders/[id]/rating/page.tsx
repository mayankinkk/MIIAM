"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ratingCategories = [
  { id: "food", label: "Rate Food & Packaging", vendor: "The Burger Project", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBZAFUyMJ1Yjnc2nFqrgxrlBN71Qp0W720WOL9IeQPItwjkmrPRJ7ixuioPYvFZ5YHMzxpMln55UtLNFA7xaw5Saj_Fpx4ICLbxMn83ouJmkQu1AvMoZuFER-jEtQMP40PtZMiHfECS1kJ4Cl5ABD364du1_S8DG2hsiu1bG-HyGxPX-20PldSosrSsWAJigS9GsxJuTqT9NtEtl2DRJtmd2Y9VFWnGR7AdIodaKo2GLvWFPSlSOag36Z_uPtrv74MnitQXMfY2Gew" },
  { id: "rider", label: "Rate Delivery Service", rider: "David Miller", riderImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwQCjB6ppgdCg3zaMieMRydFwvPXFwa_4rOhmebKtVFMaCwEjJVPfFQ2nJtinpsQV3uvEnS4Hzjn4UKf99BftcBRKtCXYyvNvD9AGTC5-_PJVHc1rqKXIamEtkpYvEl8yiaVHuuSC_mDnIpdVXuJJitLhsxlbrMPFtV3qsrhn98n-yzBC1TLzuoLCHbd_alvLkSM_TWUGYOnR8uBjkjViO39G5Vi0e3LWHWWzSI-ZhW2hwdZeCl0WTemp0sJ0eWbORRYedfAt6Uo4" },
];

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

export default function RatingReviewPage() {
  const router = useRouter();
  const [foodRating, setFoodRating] = useState(0);
  const [riderRating, setRiderRating] = useState(0);
  const [hoverFood, setHoverFood] = useState(0);
  const [hoverRider, setHoverRider] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      router.push("/app/orders");
    }, 2000);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-24 h-24 bg-[#c4d0ff] rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="material-symbols-outlined text-[#0b50d5] text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#4d212a] mb-2">Thank You!</h2>
          <p className="text-[#814c55]">Your feedback helps us improve.</p>
        </div>
      </div>
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
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[#ffe1e4]">
              <img alt="Restaurant" className="w-full h-full object-cover" src={ratingCategories[0].image} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold tracking-tight">{ratingCategories[0].vendor}</h2>
              <p className="text-sm text-[#814c55]">{ratingCategories[0].label}</p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverFood(star)}
                  onMouseLeave={() => setHoverFood(0)}
                  onClick={() => setFoodRating(star)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <span
                    className={`material-symbols-outlined text-4xl ${
                      star <= (hoverFood || foodRating) ? "text-[#ba001c]" : "text-[#dd9ca6]"
                    }`}
                    style={{ fontVariationSettings: `'FILL' ${star <= (hoverFood || foodRating) ? 1 : 0}` }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl p-8 shadow-[0px_20px_40px_rgba(77,33,42,0.04)] space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#ffe1e4]">
                <img alt="Rider" className="w-full h-full object-cover" src={ratingCategories[1].riderImage} />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[#0b50d5] text-white rounded-full p-1.5 shadow-md">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>electric_moped</span>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold tracking-tight">{ratingCategories[1].rider}</h2>
              <p className="text-sm text-[#814c55]">{ratingCategories[1].label}</p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRider(star)}
                  onMouseLeave={() => setHoverRider(0)}
                  onClick={() => setRiderRating(star)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <span
                    className={`material-symbols-outlined text-3xl ${
                      star <= (hoverRider || riderRating) ? "text-[#ba001c]" : "text-[#dd9ca6]"
                    }`}
                    style={{ fontVariationSettings: `'FILL' ${star <= (hoverRider || riderRating) ? 1 : 0}` }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>
          </div>
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