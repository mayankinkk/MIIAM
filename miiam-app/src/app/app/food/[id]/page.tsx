"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";

const supabase = createClient();

const MENU_CATEGORIES = ["All", "Starters", "Main Course", "Desserts", "Beverages"];

interface Vendor {
  id: string;
  shop_name: string;
  cuisine: string;
  address: string;
  rating: number;
  rating_count: number;
  delivery_time: string;
  delivery_fee: string;
  image_url: string;
  cover_image_url: string;
  description: string;
  opening_hours: string;
  is_featured: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string;
  is_veg: boolean;
  is_featured: boolean;
  description: string;
  vendor_id: string;
}

interface Review {
  id: string;
  user_name: string;
  user_avatar: string;
  rating: number;
  comment: string;
  created_at: string;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const textSize = size === "lg" ? "text-2xl" : "text-base";
  return (
    <div className={`flex items-center gap-0.5 ${textSize}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? "text-amber-400" : "text-slate-200"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function AddToCartButton({ item, vendor }: { item: MenuItem; vendor: Vendor }) {
  const { addItem, items, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.menu_item_id === item.id);
  const qty = cartItem?.quantity ?? 0;

  const handleAdd = () => {
    addItem({
      id: item.id,
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      is_veg: item.is_veg,
      vendor_id: vendor.id,
      vendor_name: vendor.shop_name,
    });
    if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
  };

  if (qty === 0) {
    return (
      <button
        onClick={handleAdd}
        className="px-4 py-1.5 bg-[#ba001c] text-white text-xs font-bold rounded-full hover:bg-[#a40017] active:scale-90 transition-all"
      >
        Add +
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-[#ba001c] rounded-full px-2 py-1">
      <button
        onClick={() => { updateQuantity(item.id, qty - 1); if (navigator.vibrate) navigator.vibrate(10); }}
        className="text-white font-bold w-5 h-5 flex items-center justify-center active:scale-75 transition-transform"
      >
        −
      </button>
      <span className="text-white font-bold text-xs min-w-[16px] text-center">{qty}</span>
      <button
        onClick={handleAdd}
        className="text-white font-bold w-5 h-5 flex items-center justify-center active:scale-125 transition-transform"
      >
        +
      </button>
    </div>
  );
}

function ReviewModal({ vendorId, onClose, onSubmitted }: { vendorId: string; onClose: () => void; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!rating || !comment.trim() || !name.trim()) {
      setError("Please fill in all fields and select a rating.");
      return;
    }
    setSubmitting(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("reviews").insert({
      vendor_id: vendorId,
      user_id: user?.id || null,
      user_name: name,
      rating,
      comment,
    });

    if (insertError) {
      setError("Failed to submit review. Please try again.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    onSubmitted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-black text-slate-800">Write a Review</h3>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Star selector */}
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Your Rating</p>
        <div className="flex gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="text-3xl transition-transform hover:scale-125 active:scale-90"
            >
              <span className={star <= (hoverRating || rating) ? "text-amber-400" : "text-slate-200"}>★</span>
            </button>
          ))}
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Your Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ba001c]/20 resize-none"
              placeholder="Tell others what you think..."
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-gradient-to-r from-[#ba001c] to-[#ff7670] text-white py-4 rounded-xl font-extrabold disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </div>
  );
}

function CartFloater() {
  const { items, totalPrice, totalItems } = useCartStore();
  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-6 left-4 right-4 z-50">
      <Link
        href="/app/cart"
        className="flex items-center justify-between bg-[#ba001c] text-white px-5 py-4 rounded-2xl shadow-2xl shadow-[#ba001c]/40 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-3">
          <span className="bg-white text-[#ba001c] font-black text-xs px-2 py-0.5 rounded-full">
            {totalItems()}
          </span>
          <span className="font-bold">View Cart</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-lg">₹{totalPrice().toFixed(2)}</span>
          <span className="material-symbols-outlined text-white/80">arrow_forward</span>
        </div>
      </Link>
    </div>
  );
}

export default function RestaurantProfilePage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showReviewModal, setShowReviewModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [vendorRes, menuRes, reviewsRes] = await Promise.all([
      supabase.from("vendors").select("*").eq("id", vendorId).single(),
      supabase.from("menu_items").select("*").eq("vendor_id", vendorId).order("name"),
      supabase.from("reviews").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false }),
    ]);
    if (vendorRes.data) setVendor(vendorRes.data);
    if (menuRes.data) setMenuItems(menuRes.data);
    if (reviewsRes.data) setReviews(reviewsRes.data);
    setLoading(false);
  }, [vendorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#ba001c]/20 border-t-[#ba001c] rounded-full animate-spin" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff4f4]">
        <div className="text-center">
          <p className="text-2xl font-black text-slate-800 mb-2">Restaurant not found</p>
          <Link href="/app/food" className="text-[#ba001c] font-bold">← Back to Food</Link>
        </div>
      </div>
    );
  }

  const coverImage = vendor.cover_image_url || vendor.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";
  const specials = menuItems.filter((item) => item.is_featured);
  const filteredMenu = activeCategory === "All" ? menuItems : menuItems.filter((item) => item.category === activeCategory);
  const availableCategories = MENU_CATEGORIES.filter(
    (cat) => cat === "All" || menuItems.some((item) => item.category === cat)
  );

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : (vendor.rating || 0).toFixed(1);

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-32">
      {/* Hero Cover */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img
          src={coverImage}
          alt={vendor.shop_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Floating top nav */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 pt-12 sm:pt-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <Link
              href="/app/cart"
              className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors active:scale-90"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
            </Link>
          </div>
        </div>

        {/* Restaurant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              {vendor.is_featured && (
                <span className="bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block">
                  ⭐ Featured
                </span>
              )}
              <h1 className="text-white font-black text-2xl sm:text-3xl leading-tight">{vendor.shop_name}</h1>
              <p className="text-white/80 text-sm mt-1 font-medium">{vendor.cuisine}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 text-center flex-shrink-0">
              <p className="text-white font-black text-xl">{avgRating}</p>
              <div className="flex text-amber-400 text-xs">{'★'.repeat(5)}</div>
              <p className="text-white/70 text-[10px] mt-0.5">{reviews.length || vendor.rating_count || 0} reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Strip */}
      <div className="bg-white px-5 py-4 flex items-center gap-4 overflow-x-auto no-scrollbar shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-600 flex-shrink-0">
          <span className="material-symbols-outlined text-[#ba001c] text-base">schedule</span>
          <span className="text-sm font-semibold">{vendor.delivery_time || "30-40 min"}</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-1.5 text-slate-600 flex-shrink-0">
          <span className="material-symbols-outlined text-[#ba001c] text-base">delivery_dining</span>
          <span className="text-sm font-semibold">{vendor.delivery_fee || "₹49 delivery"}</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-1.5 text-slate-600 flex-shrink-0">
          <span className="material-symbols-outlined text-[#ba001c] text-base">storefront</span>
          <span className="text-sm font-semibold">{vendor.opening_hours || "10 AM – 11 PM"}</span>
        </div>
        {vendor.address && (
          <>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-1.5 text-slate-600 flex-shrink-0">
              <span className="material-symbols-outlined text-[#ba001c] text-base">location_on</span>
              <span className="text-sm font-semibold truncate max-w-[160px]">{vendor.address}</span>
            </div>
          </>
        )}
      </div>

      {/* Description */}
      {vendor.description && (
        <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed">{vendor.description}</p>
        </div>
      )}

      {/* Chef's Specials */}
      {specials.length > 0 && (
        <section className="mt-5 px-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⭐</span>
            <h2 className="text-lg font-black text-slate-800">Chef's Specials</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {specials.map((item) => (
              <div key={item.id} className="flex-shrink-0 w-40 bg-white rounded-2xl overflow-hidden shadow-sm border border-amber-100">
                <div className="h-28 overflow-hidden bg-slate-100">
                  <img
                    src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"; }}
                  />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <span className={`w-3 h-3 border-2 ${item.is_veg ? "border-green-600" : "border-red-600"} rounded-sm flex items-center justify-center flex-shrink-0`}>
                      <span className={`w-1.5 h-1.5 ${item.is_veg ? "bg-green-600" : "bg-red-600"} rounded-full`} />
                    </span>
                    <p className="font-bold text-slate-800 text-xs truncate">{item.name}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-black text-[#ba001c] text-sm">₹{item.price}</span>
                    <AddToCartButton item={item} vendor={vendor} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Menu Tabs */}
      <section className="mt-5">
        <div className="px-4 mb-3">
          <h2 className="text-lg font-black text-slate-800">Full Menu</h2>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-2">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); if (navigator.vibrate) navigator.vibrate(10); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all active:scale-95 ${
                activeCategory === cat
                  ? "bg-[#ba001c] text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="px-4 mt-3 space-y-3">
          {filteredMenu.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 shadow-sm">
              No items in this category
            </div>
          ) : (
            filteredMenu.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <img
                    src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`w-3.5 h-3.5 border-2 ${item.is_veg ? "border-green-600" : "border-red-600"} rounded-sm flex items-center justify-center flex-shrink-0`}>
                      <span className={`w-1.5 h-1.5 ${item.is_veg ? "bg-green-600" : "bg-red-600"} rounded-full`} />
                    </span>
                    <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                    {item.is_featured && (
                      <span className="text-amber-500 text-xs flex-shrink-0">⭐</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-[#ba001c] text-base">₹{item.price}</span>
                    <AddToCartButton item={item} vendor={vendor} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Reviews */}
      <section className="mt-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-800">Reviews & Ratings</h2>
          <button
            onClick={() => setShowReviewModal(true)}
            className="text-sm font-bold text-[#ba001c] bg-[#fff4f4] px-3 py-1.5 rounded-lg hover:bg-[#ffe4e7] transition-colors active:scale-95"
          >
            + Write a Review
          </button>
        </div>

        {reviews.length > 0 ? (
          <>
            {/* Rating Summary Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-5xl font-black text-slate-800">{avgRating}</p>
                  <StarRating rating={parseFloat(avgRating)} size="sm" />
                  <p className="text-xs text-slate-500 mt-1">{reviews.length} reviews</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {ratingBreakdown.map(({ star, count, pct }) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-3">{star}</span>
                      <span className="text-amber-400 text-xs">★</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-5 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Review cards */}
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ba001c] to-[#ff7670] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {review.user_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-800 text-sm truncate">{review.user_name || "Anonymous"}</p>
                        <p className="text-[10px] text-slate-400 flex-shrink-0">
                          {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                      {review.comment && (
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <p className="text-3xl mb-2">💬</p>
            <p className="font-bold text-slate-700 mb-1">No reviews yet</p>
            <p className="text-sm text-slate-400 mb-4">Be the first to review this restaurant!</p>
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-[#ba001c] to-[#ff7670] text-white font-bold rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Write a Review
            </button>
          </div>
        )}
      </section>

      <CartFloater />

      {showReviewModal && (
        <ReviewModal
          vendorId={vendorId}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={fetchData}
        />
      )}
    </div>
  );
}
