"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cartStore";
import { useDiningStore } from "/lib/store/diningStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Vendor, MenuItem } from "@/lib/types";

export default function VendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addItem, items, updateQuantityByMenuItemByMenuItem } = useCartStore();
  const supabase = createClient();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingGuests, setBookingGuests] = useState(2);
  const [bookingDate, setBookingDate] = useState(0);
  const [bookingTime, setBookingTime] = useState("19:00");
  const { addBooking } = useDiningStore();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      // In a real app we'd fetch from supabase. For now if we don't have it, we use sample data.
      const { data: vData } = await supabase.from("vendors").select("*").eq("id", id).single();
      const { data: mData } = await supabase.from("menu_items").select("*").eq("vendor_id", id);
      
      if (vData) {
        setVendor(vData);
        setMenuItems(mData || []);
      } else {
        // Fallback sample to match design
        setVendor({
          id: "sample", name: "The Burger Alchemist", category: "Gourmet Fast Food", 
          description: "Turning basic ingredients into culinary gold. Artisanal burgers, hand-cut fries, and secret sauces.",
          image_url: "https://lh3.googleusercontent.com/aida-public/AEd_1E-i-qQ9J8Dpw924vVvVnOq86W-05QG5i7kX14mBqW92G31P3X126_Vw9O7yYqO6O78_ZqV6R892O21Ww9W_7ZzZ7Y7w10q28WqQy_09V74z1V70Q219w2w9y0VwVwW1Z1W2347Z6W2vOq7Z6Yq6y182W7qO6Ww1Oq98wQvYQ19y08wW9V71Z02Y9w",
          banner_url: null, is_active: true, rating: 4.8, review_count: 1240, delivery_time_min: 20, delivery_time_max: 30, min_order_amount: 15, created_at: ""
        });
        setMenuItems([
          { id: "1", vendor_id: "sample", name: "The Alchemist Special", description: "Double Wagyu, melted Gorgonzola, truffle honey, and crispy leeks on charcoal brioche.", price: 249, image_url: "https://lh3.googleusercontent.com/aida-public/AEd_1E-i-qQ9J8Dpw924vVvVnOq86W-05QG5i7kX14mBqW92G31P3X126_Vw9O7yYqO6O78_ZqV6R892O21Ww9W_7ZzZ7Y7w10q28WqQy_09V74z1V70Q219w2w9y0VwVwW1Z1W2347Z6W2vOq7Z6Yq6y182W7qO6Ww1Oq98wQvYQ19y08wW9V71Z02Y9w", category: "Burgers", is_available: true, is_featured: true, created_at: "" },
          { id: "2", vendor_id: "sample", name: "Philosopher's Stone", description: "Smoked Portobello, herbed goat cheese, roasted red pepper, and arugula pesto.", price: 199, image_url: "https://lh3.googleusercontent.com/aida-public/AEd_1E-i-qQ9J8Dpw924vVvVnOq86W-05QG5i7kX14mBqW92G31P3X126_Vw9O7yYqO6O78_ZqV6R892O21Ww9W_7ZzZ7Y7w10q28WqQy_09V74z1V70Q219w2w9y0VwVwW1Z1W2347Z6W2vOq7Z6Yq6y182W7qO6Ww1Oq98wQvYQ19y08wW9V71Z02Y9w", category: "Burgers", is_available: true, is_featured: true, created_at: "" },
          { id: "3", vendor_id: "sample", name: "Truffle Fries", description: "Hand-cut fries tossed in truffle oil and parmesan.", price: 149, image_url: null, category: "Sides", is_available: true, is_featured: false, created_at: "" },
          { id: "4", vendor_id: "sample", name: "Alchemy Shake", description: "Vanilla bean ice cream, gold leaf, caramel.", price: 99, image_url: null, category: "Drinks", is_available: true, is_featured: false, created_at: "" },
        ]);
      }
      setLoading(false);
    }
    loadData();
  }, [id, supabase]);

  if (loading) return <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" /></div>;
  if (!vendor) return <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center">Vendor not found</div>;

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.id + Date.now(), // temp unique ID for cart
      menu_item_id: item.id,
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      name: item.name,
      price: item.price,
      image_url: item.image_url || undefined,
    });
  };

  const getQuantity = (menuItemId: string) => {
    return items.filter((i) => i.menu_item_id === menuItemId).reduce((sum, item) => sum + item.quantity, 0);
  };

  const getCartItemPrice = (menuItemId: string) => {
    const item = items.find((i) => i.menu_item_id === menuItemId);
    if (!item) return 0;
    return (item.price * getQuantity(menuItemId)).toFixed(2);
  };

  const popularItems = menuItems.filter(item => item.is_featured).slice(0, 2);
  const otherItems = menuItems.filter(item => !item.is_featured);

  return (
    <div className="bg-[#fff4f4] min-h-screen pb-32">
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-transparent">
        <Link href="/app/explore" className="w-10 h-10 bg-white shadow-lg flex items-center justify-center rounded-full hover:scale-105 transition-all text-[#ba001c]">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </Link>
        <div className="text-xl font-black tracking-tighter text-[#ba001c] bg-white px-4 py-2 rounded-full shadow-lg">MIIAM</div>
        <div className="flex gap-3">
          <Link href="/app/cart" className="w-10 h-10 bg-white shadow-lg flex items-center justify-center rounded-full hover:scale-105 transition-all text-slate-800 relative">
            <span className="material-symbols-outlined text-xl">shopping_cart</span>
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ba001c] rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {items.length}
              </span>
            )}
          </Link>
          <Link href="/app/profile" className="w-10 h-10 bg-white shadow-lg flex items-center justify-center rounded-full hover:scale-105 transition-all text-slate-800">
            <span className="material-symbols-outlined text-xl">person</span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="px-6 pt-20">
        <div className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
          <img 
            src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=2000&auto=format&fit=crop" 
            alt={vendor.name} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2a1317] via-[#2a1317]/60 to-transparent" />
          
          {/* Cursive Background Text (Decorative) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none overflow-hidden mix-blend-overlay">
            <h1 className="text-[#e2b67d] text-[150px] md:text-[200px] whitespace-nowrap transform -rotate-12 font-signature tracking-widest">
              {vendor.name}
            </h1>
          </div>

          {/* Top Right Floating Tags */}
          <div className="absolute top-6 right-6 flex flex-col gap-3 items-end">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              <span className="material-symbols-outlined text-[#ba001c] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-bold text-[#4d212a] text-sm">{vendor.rating}</span>
            </div>
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              <span className="material-symbols-outlined text-[#0b50d5] text-sm">schedule</span>
              <span className="font-bold text-[#4d212a] text-sm">{vendor.delivery_time_min}-{vendor.delivery_time_max} min</span>
            </div>
          </div>

          {/* Bottom Content */}
          <div className="absolute bottom-10 left-10 right-10">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4 drop-shadow-xl">{vendor.name}</h1>
            <p className="text-white/90 text-lg md:text-xl font-medium max-w-2xl drop-shadow-md">
              {vendor.description}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex gap-3 px-6 mt-8 overflow-x-auto no-scrollbar">
        <button className="bg-[#ba001c] text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-[#ba001c]/20 whitespace-nowrap">Full Menu</button>
        <button className="bg-[#ffe1e4] text-[#ba001c] hover:bg-[#ffcfd5] px-6 py-2.5 rounded-full font-bold transition-colors whitespace-nowrap">Info</button>
        <button className="bg-[#ffe1e4] text-[#ba001c] hover:bg-[#ffcfd5] px-6 py-2.5 rounded-full font-bold transition-colors whitespace-nowrap">Reviews</button>
        <button className="bg-[#ffe1e4] text-[#ba001c] hover:bg-[#ffcfd5] px-6 py-2.5 rounded-full font-bold transition-colors whitespace-nowrap">Photos</button>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Content Column */}
        <div className="lg:col-span-2 space-y-16">
          
          {/* Popular Choice Horizontal Scroll */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-3xl font-extrabold text-[#4d212a] tracking-tight">Popular Choice</h2>
                <p className="text-[#814c55] font-medium">The favorites of our alchemists.</p>
              </div>
              <button onClick={() => document.getElementById('full-menu')?.scrollIntoView({ behavior: 'smooth' })} className="text-[#ba001c] font-bold hover:underline flex items-center text-sm">View all <span className="material-symbols-outlined text-sm ml-1">chevron_right</span></button>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar snap-x">
              {popularItems.map((item) => {
                const qty = getQuantity(item.id);
                return (
                  <div key={item.id} className="min-w-[300px] md:min-w-[350px] bg-white rounded-3xl overflow-hidden shadow-editorial snap-start flex flex-col">
                    <div className="h-48 relative bg-slate-900">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover opacity-90" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#ffe1e4] text-[#ba001c]">
                          <span className="material-symbols-outlined text-4xl">restaurant</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4 bg-[#ba001c] text-white text-[10px] font-bold px-3 py-1.5 rounded-full tracking-widest uppercase">
                        BEST SELLER
                      </div>
                      {qty > 0 && (
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg">
                          <div className="w-6 h-6 bg-[#ba001c] rounded-full text-white flex items-center justify-center text-xs font-bold shadow-sm">
                            <span className="material-symbols-outlined text-[14px]">shopping_bag</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#814c55] uppercase tracking-wider leading-none">YOUR ORDER</p>
                            <p className="text-sm font-extrabold text-[#4d212a] leading-none mt-1">₹{getCartItemPrice(item.id)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-extrabold text-[#4d212a] text-xl">{item.name}</h3>
                        <span className="font-extrabold text-[#ba001c] text-lg">₹{item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-[#814c55] text-sm mb-6 flex-1">{item.description}</p>
                      
                      {qty === 0 ? (
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="w-full bg-[#ff7670] hover:bg-[#ba001c] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#ba001c]/20"
                        >
                          <span className="material-symbols-outlined text-lg">add_shopping_cart</span> Add to Cart
                        </button>
                      ) : (
                        <div className="w-full flex items-center justify-between bg-[#ffe1e4] p-1 rounded-xl border border-[#ba001c]/20">
                          <button
                            onClick={() => updateQuantityByMenuItem(item.id, qty - 1)}
                            className="w-12 h-10 flex items-center justify-center rounded-lg hover:bg-white text-[#ba001c] transition-colors"
                          >
                            <span className="material-symbols-outlined">remove</span>
                          </button>
                          <span className="font-extrabold text-[#4d212a] text-lg">{qty}</span>
                          <button
                            onClick={() => updateQuantityByMenuItem(item.id, qty + 1)}
                            className="w-12 h-10 flex items-center justify-center rounded-lg hover:bg-white text-[#ba001c] transition-colors"
                          >
                            <span className="material-symbols-outlined">add</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Guest Gallery */}
          <section>
            <h2 className="text-3xl font-extrabold text-[#4d212a] tracking-tight mb-6">Guest Gallery</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-sm relative group">
                <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop" alt="Gallery" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-[10px] font-bold">@foodie_jen</p>
                </div>
              </div>
              <div className="aspect-square rounded-2xl overflow-hidden shadow-sm relative group">
                <img src="https://images.unsplash.com/photo-1627308595229-7830f5c9100f?q=80&w=600&auto=format&fit=crop" alt="Gallery" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-[10px] font-bold">@mike_eats</p>
                </div>
              </div>
              <div className="aspect-square rounded-2xl overflow-hidden shadow-sm relative group">
                <img src="https://images.unsplash.com/photo-1594212812282-3d8b13684d0b?q=80&w=600&auto=format&fit=crop" alt="Gallery" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-[10px] font-bold">@sarah_l</p>
                </div>
              </div>
              <div className="aspect-square rounded-2xl overflow-hidden shadow-sm relative group cursor-pointer">
                <img src="https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?q=80&w=600&auto=format&fit=crop" alt="Gallery" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm group-hover:bg-black/40 transition-all">
                  <span className="text-white font-bold text-xl">+42</span>
                </div>
              </div>
            </div>
          </section>

          {/* Reviews Section */}
          <section className="bg-[#ffe1e4] rounded-3xl p-8 mb-16">
            <div className="flex justify-between items-start mb-10 border-b border-[#ba001c]/10 pb-8">
              <div className="flex items-center gap-12">
                <div className="text-center">
                  <div className="text-7xl font-extrabold text-[#ba001c] leading-none mb-2">{vendor.rating}</div>
                  <div className="flex text-[#ba001c] justify-center mb-1">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
                  </div>
                  <div className="text-[#814c55] text-sm font-medium">{vendor.review_count.toLocaleString()} Ratings</div>
                </div>
                
                <div className="flex gap-8">
                  <div className="space-y-3 w-48">
                    {[
                      { stars: 5, fill: "w-[85%]" },
                      { stars: 4, fill: "w-[10%]" },
                      { stars: 3, fill: "w-[3%]" },
                      { stars: 2, fill: "w-[1%]" },
                      { stars: 1, fill: "w-[1%]" },
                    ].map((row) => (
                      <div key={row.stars} className="flex items-center gap-3">
                        <span className="text-[#814c55] text-xs font-bold w-2">{row.stars}</span>
                        <div className="h-2 flex-1 bg-white rounded-full overflow-hidden">
                          <div className={`h-full bg-[#ba001c] rounded-full ${row.fill}`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden sm:block w-px bg-[#ba001c]/10 h-24"></div>

                  <div className="hidden sm:flex flex-col justify-center space-y-2 text-sm text-[#4d212a] font-medium">
                    <p className="flex items-center gap-2"><span className="material-symbols-outlined text-green-600 text-[18px]">check_circle</span> Great Packaging</p>
                    <p className="flex items-center gap-2"><span className="material-symbols-outlined text-green-600 text-[18px]">check_circle</span> Fast Delivery</p>
                    <p className="flex items-center gap-2"><span className="material-symbols-outlined text-green-600 text-[18px]">check_circle</span> Worth the Price</p>
                  </div>
                </div>
              </div>

              <button onClick={() => setIsReviewModalOpen(true)} className="bg-[#ba001c] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#ba001c]/20 hover:bg-[#a40017] transition-all whitespace-nowrap hidden md:block">
                Write a Review
              </button>
            </div>

            <div className="space-y-4">
              {[
                { name: "Julian Sterling", init: "JS", color: "bg-[#cce4ff] text-[#003dac]", time: "2 days ago", text: "Absolutely life-changing. The Philosopher's Stone burger actually made me contemplate my existence. Best vegetarian burger in the city by far.", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80" },
                { name: "Maya Patel", init: "MP", color: "bg-[#ffe1e4] text-[#ba001c]", time: "1 week ago", text: "Truffle fries were out of this world! Perfect crispiness. The delivery was incredibly fast too, arrived hot.", img: null },
                { name: "David Chen", init: "DC", color: "bg-[#dcfce7] text-[#166534]", time: "2 weeks ago", text: "The alchemy shake is a must try. A bit pricey but definitely a premium experience.", img: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=200&q=80" }
              ].map((rev, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-[#ba001c]/5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3 items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${rev.color}`}>
                        {rev.init}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#4d212a] leading-tight">{rev.name}</h4>
                        <p className="text-[#814c55] text-xs">{rev.time}</p>
                      </div>
                    </div>
                    <div className="flex text-[#ba001c]">
                      {[1,2,3,4,5].map(n => (
                        <span key={n} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[#4d212a] text-sm leading-relaxed mb-3">
                    {rev.text}
                  </p>
                  {rev.img && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-100">
                      <img src={rev.img} className="w-full h-full object-cover" alt="Review Photo" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 text-[#ba001c] font-bold text-sm hover:underline">
              View All 1,240 Reviews
            </button>
          </section>

          {/* Full Menu (Other items) */}
          <section id="full-menu">
            <h2 className="text-3xl font-extrabold text-[#4d212a] tracking-tight mb-6">Other Menu Items</h2>
            <div className="space-y-4">
              {otherItems.map((item) => {
                const qty = getQuantity(item.id);
                return (
                  <div key={item.id} className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow border border-[#dd9ca6]/10">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#ffecee] flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#dd9ca6] text-3xl">restaurant</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center py-1">
                      <h3 className="font-bold text-[#4d212a] mb-1">{item.name}</h3>
                      <p className="text-[#814c55] text-xs line-clamp-2 mb-2">{item.description}</p>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="font-extrabold text-[#ba001c]">₹{item.price.toFixed(2)}</span>
                        
                        {qty === 0 ? (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="bg-[#ffecee] text-[#ba001c] hover:bg-[#ba001c] hover:text-white px-4 py-1.5 rounded-full font-bold text-xs transition-colors"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center bg-[#ffe1e4] rounded-full p-1 border border-[#ba001c]/20">
                            <button onClick={() => updateQuantityByMenuItem(item.id, qty - 1)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white text-[#ba001c] transition-colors">
                              <span className="material-symbols-outlined text-[14px]">remove</span>
                            </button>
                            <span className="w-6 text-center font-bold text-[#4d212a] text-xs">{qty}</span>
                            <button onClick={() => updateQuantityByMenuItem(item.id, qty + 1)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white text-[#ba001c] transition-colors">
                              <span className="material-symbols-outlined text-[14px]">add</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* Right Sidebar - About the Lab */}
        <div className="lg:col-span-1 relative">
          <div className="sticky top-28 bg-white rounded-3xl p-8 shadow-editorial border border-[#ba001c]/5">
            <h3 className="text-2xl font-extrabold text-[#4d212a] mb-8">About the Lab</h3>
            
            <div className="flex gap-4 items-start mb-6">
              <div className="w-12 h-12 bg-[#ff7670] rounded-full flex items-center justify-center text-[#4e0006] flex-shrink-0 shadow-lg shadow-[#ff7670]/20">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
              </div>
              <div>
                <h4 className="font-bold text-[#4d212a]">Location</h4>
                <p className="text-[#814c55] text-sm mt-1">123 Gastronomy Lane, Downtown Innovation District</p>
              </div>
            </div>

            <div className="flex gap-4 items-start mb-8">
              <div className="w-12 h-12 bg-[#cce4ff] rounded-full flex items-center justify-center text-[#0b50d5] flex-shrink-0 shadow-lg shadow-[#0b50d5]/20">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
              </div>
              <div>
                <h4 className="font-bold text-[#4d212a]">Opening Hours</h4>
                <p className="text-[#814c55] text-sm mt-1">Mon - Sat: 11:00 AM - 11:00 PM</p>
                <p className="text-[#814c55] text-sm">Sun: 12:00 PM - 09:00 PM</p>
                <span className="inline-block mt-2 bg-[#dcfce7] text-[#166534] text-[10px] font-bold px-2 py-1 rounded-sm tracking-wider">OPEN NOW</span>
              </div>
            </div>

            <p className="text-[#814c55] text-sm mb-8 leading-relaxed">
              The Burger Alchemist isn't just a restaurant; it's a laboratory of taste. We specialize in fusion burgers that combine traditional techniques with avant-garde flavor profiles.
            </p>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsBookingModalOpen(true)}
                className="flex-1 bg-[#0b50d5] hover:bg-[#003dac] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#0b50d5]/30 transition-all hover:scale-105 active:scale-95"
              >
                Book a Table
              </button>
              <button className="w-14 h-14 bg-[#ffecee] text-[#ba001c] rounded-xl flex items-center justify-center hover:bg-[#ffcfd5] transition-colors">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>share</span>
              </button>
            </div>
            
            {items.length > 0 && (
              <Link href="/app/cart" className="mt-4 w-full bg-[#ba001c] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#ba001c]/30 flex justify-center items-center gap-2 hover:scale-105 transition-transform active:scale-95">
                <span className="material-symbols-outlined text-xl">shopping_cart</span>
                View Cart ({items.reduce((s, i) => s + i.quantity, 0)})
              </Link>
            )}

          </div>
        </div>

      </div>

      {/* Write a Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)} />
          <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-extrabold text-[#4d212a]">Write a Review</h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="w-9 h-9 rounded-full bg-[#ffecee] text-[#ba001c] flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="mb-6 flex justify-center">
              <div className="flex gap-2">
                {[1,2,3,4,5].map(star => (
                  <button key={star} onClick={() => setReviewRating(star)} className="text-4xl text-[#ba001c] hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: star <= reviewRating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                  </button>
                ))}
              </div>
            </div>

            <textarea 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#ba001c]/30 text-slate-800 mb-4"
              placeholder="Share your experience with The Burger Alchemist..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            <div className="flex gap-4 mb-6">
              <button className="flex-1 border-2 border-dashed border-slate-300 text-slate-500 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50">
                <span className="material-symbols-outlined text-[18px]">add_a_photo</span> Add Photos
              </button>
            </div>

            <button 
              onClick={() => setIsReviewModalOpen(false)}
              className="w-full bg-gradient-to-r from-[#ba001c] to-[#ff7670] text-white py-4 rounded-xl font-extrabold shadow-lg shadow-[#ba001c]/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Post Review
            </button>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsBookingModalOpen(false)} />
          <div className="relative z-10 bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-extrabold text-[#4d212a]">Book a Table</h3>
                <p className="text-sm font-medium text-[#0b50d5] flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[16px]">local_activity</span>
                  MIIAM Dine-out: Flat 15% off bill
                </p>
              </div>
              <button onClick={() => setIsBookingModalOpen(false)} className="w-9 h-9 rounded-full bg-[#ffecee] text-[#ba001c] flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Guests */}
            <div className="mb-6">
              <h4 className="font-bold text-[#4d212a] mb-3">Number of Guests</h4>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <button
                    key={num}
                    onClick={() => setBookingGuests(num)}
                    className={`min-w-[48px] h-12 rounded-xl font-bold border-2 transition-all ${
                      bookingGuests === num ? "border-[#0b50d5] bg-[#cce4ff] text-[#003dac]" : "border-slate-200 text-slate-500 hover:border-[#0b50d5]/50"
                    }`}
                  >
                    {num}{num === 6 ? '+' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="mb-6">
              <h4 className="font-bold text-[#4d212a] mb-3">Date</h4>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                  const d = new Date();
                  d.setDate(d.getDate() + offset);
                  const isSelected = bookingDate === offset;
                  return (
                    <button
                      key={offset}
                      onClick={() => setBookingDate(offset)}
                      className={`flex-shrink-0 w-20 p-3 rounded-2xl border-2 text-center transition-all ${
                        isSelected ? "border-[#0b50d5] bg-[#cce4ff]" : "border-slate-200 hover:border-[#0b50d5]/50"
                      }`}
                    >
                      <p className={`text-xs mb-1 ${isSelected ? "text-[#003dac]" : "text-slate-500"}`}>
                        {offset === 0 ? "Today" : offset === 1 ? "Tmrw" : d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className={`text-lg font-bold ${isSelected ? "text-[#003dac]" : "text-slate-800"}`}>
                        {d.getDate()}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time */}
            <div className="mb-8">
              <h4 className="font-bold text-[#4d212a] mb-3">Time</h4>
              <div className="grid grid-cols-4 gap-2">
                {["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"].map(t => (
                  <button
                    key={t}
                    onClick={() => setBookingTime(t)}
                    className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                      bookingTime === t ? "border-[#0b50d5] bg-[#cce4ff] text-[#003dac]" : "border-slate-200 text-slate-600 hover:border-[#0b50d5]/50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + bookingDate);
                addBooking({
                  vendorId: vendor.id,
                  vendorName: vendor.name,
                  date: d.toISOString(),
                  time: bookingTime,
                  guests: bookingGuests,
                });
                setIsBookingModalOpen(false);
                router.push('/app/bookings');
              }}
              className="w-full bg-[#0b50d5] text-white py-4 rounded-xl font-extrabold shadow-lg shadow-[#0b50d5]/20 hover:bg-[#003dac] active:scale-95 transition-all"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
