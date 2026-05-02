"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cartStore";

const foodCategories = [
  { id: "pizza", name: "Pizza", icon: "🍕", color: "bg-orange-100" },
  { id: "burgers", name: "Burgers", icon: "🍔", color: "bg-amber-100" },
  { id: "biryani", name: "Biryani", icon: "🍚", color: "bg-yellow-100" },
  { id: "chinese", name: "Chinese", icon: "🥡", color: "bg-red-100" },
  { id: "italian", name: "Italian", icon: "🍝", color: "bg-green-100" },
  { id: "desserts", name: "Desserts", icon: "🍰", color: "bg-pink-100" },
];

const restaurants = [
  {
    id: "r1",
    name: "Pizza Hut",
    rating: 4.2,
    time: "25-35 min",
    delivery: "₹49",
    image: "/images/food_pizza.png",
    category: "pizza",
    menuItems: [
      { id: "p1", name: "Margherita Pizza", price: 299, image: "/images/food_pizza.png" },
      { id: "p2", name: "Pepperoni Pizza", price: 399, image: "/images/food_pizza.png" },
      { id: "p3", name: "BBQ Chicken Pizza", price: 449, image: "/images/food_pizza.png" },
    ],
  },
  {
    id: "r2",
    name: "Domino's Pizza",
    rating: 4.1,
    time: "20-30 min",
    delivery: "₹39",
    image: "/images/food_pizza.png",
    category: "pizza",
    menuItems: [
      { id: "d1", name: "Cheese Burst Pizza", price: 349, image: "/images/food_pizza.png" },
      { id: "d2", name: "Farmhouse Pizza", price: 379, image: "/images/food_pizza.png" },
    ],
  },
  {
    id: "r3",
    name: "McDonald's",
    rating: 4.3,
    time: "15-25 min",
    delivery: "₹29",
    image: "/images/food_burger.png",
    category: "burgers",
    menuItems: [
      { id: "m1", name: "McAloo Tikki Burger", price: 99, image: "/images/food_burger.png" },
      { id: "m2", name: "McSpicy Chicken", price: 179, image: "/images/food_burger.png" },
      { id: "m3", name: "Big Mac", price: 249, image: "/images/food_burger.png" },
    ],
  },
  {
    id: "r4",
    name: "KFC",
    rating: 4.4,
    time: "20-30 min",
    delivery: "₹49",
    image: "/images/food_burger.png",
    category: "burgers",
    menuItems: [
      { id: "k1", name: "Zinger Burger", price: 199, image: "/images/food_burger.png" },
      { id: "k2", name: "Chicken Popcorn", price: 149, image: "/images/food_burger.png" },
    ],
  },
  {
    id: "r5",
    name: "Biryani House",
    rating: 4.5,
    time: "30-40 min",
    delivery: "₹59",
    image: "/images/food_biryani.png",
    category: "biryani",
    menuItems: [
      { id: "b1", name: "Chicken Dum Biryani", price: 249, image: "/images/food_biryani.png" },
      { id: "b2", name: "Mutton Biryani", price: 349, image: "/images/food_biryani.png" },
      { id: "b3", name: "Veg Biryani", price: 199, image: "/images/food_biryani.png" },
    ],
  },
  {
    id: "r6",
    name: "Paradise Biryani",
    rating: 4.3,
    time: "25-35 min",
    delivery: "₹49",
    image: "/images/food_biryani.png",
    category: "biryani",
    menuItems: [
      { id: "pb1", name: "Hyderabadi Biryani", price: 269, image: "/images/food_biryani.png" },
      { id: "pb2", name: "Special Biryani", price: 319, image: "/images/food_biryani.png" },
    ],
  },
  {
    id: "r7",
    name: "Golden Dragon",
    rating: 4.1,
    time: "25-35 min",
    delivery: "₹39",
    image: "/images/food_chinese.png",
    category: "chinese",
    menuItems: [
      { id: "c1", name: "Hakka Noodles", price: 179, image: "/images/food_chinese.png" },
      { id: "c2", name: "Manchurian", price: 149, image: "/images/food_chinese.png" },
      { id: "c3", name: "Fried Rice", price: 159, image: "/images/food_chinese.png" },
    ],
  },
  {
    id: "r8",
    name: "Mainland China",
    rating: 4.2,
    time: "30-40 min",
    delivery: "₹49",
    image: "/images/food_chinese.png",
    category: "chinese",
    menuItems: [
      { id: "mc1", name: "Dimsums (6 pcs)", price: 219, image: "/images/food_chinese.png" },
      { id: "mc2", name: "Kung Pao Chicken", price: 289, image: "/images/food_chinese.png" },
    ],
  },
];

type Restaurant = typeof restaurants[0];

function AddToCartButton({
  item,
  restaurant,
}: {
  item: { id: string; name: string; price: number; image: string };
  restaurant: Restaurant;
}) {
  const { addItem, items, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.menu_item_id === item.id);
  const qty = cartItem?.quantity ?? 0;

  const add = () => {
    addItem({
      id: item.id,
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image,
      vendor_id: restaurant.id,
      vendor_name: restaurant.name,
    });
  };

  if (qty === 0) {
    return (
      <button
        onClick={add}
        className="px-4 py-1.5 bg-[#ba001c] text-white text-xs font-bold rounded-full hover:bg-[#a40017] active:scale-95 transition-all"
      >
        Add +
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-[#ba001c] rounded-full px-2 py-1">
      <button
        onClick={() => updateQuantity(item.id, qty - 1)}
        className="text-white font-bold w-5 h-5 flex items-center justify-center"
      >
        −
      </button>
      <span className="text-white font-bold text-xs min-w-[16px] text-center">{qty}</span>
      <button
        onClick={add}
        className="text-white font-bold w-5 h-5 flex items-center justify-center"
      >
        +
      </button>
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
        className="flex items-center justify-between bg-[#ba001c] text-white px-5 py-4 rounded-2xl shadow-2xl shadow-[#ba001c]/40"
      >
        <div className="flex items-center gap-3">
          <span className="bg-white text-[#ba001c] font-black text-xs px-2 py-0.5 rounded-full">
            {totalItems()}
          </span>
          <span className="font-bold">View Cart</span>
        </div>
        <span className="font-black text-lg">₹{totalPrice().toFixed(2)}</span>
      </Link>
    </div>
  );
}

export default function FoodPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedRestaurant, setExpandedRestaurant] = useState<string | null>(null);

  const filteredRestaurants =
    selectedCategory === "all"
      ? restaurants
      : restaurants.filter((r) => r.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-32">
      {/* Header */}
      <header className="bg-white px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/app/explore"
            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-[#4d212a]">Food Delivery</h1>
          <Link
            href="/app/cart"
            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center relative"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="px-6 mt-4">
        <div className="rounded-2xl overflow-hidden relative h-44 shadow-sm">
          <img
            src="/images/food_hero.png"
            alt="Premium Food"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-5">
            <h2 className="text-white text-2xl font-black">Gourmet Selection</h2>
            <p className="text-white/90 text-sm mt-1">Order food from top restaurants near you</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white px-6 py-4 mt-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-[#ba001c] text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            🍽 All
          </button>
          {foodCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? "bg-[#ba001c] text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Restaurants */}
      <main className="p-6 space-y-4">
        {filteredRestaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className="bg-white rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Restaurant Header */}
            <div className="flex">
              <div className="w-32 h-32 flex-shrink-0 overflow-hidden bg-slate-100">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div className="p-4 flex-1">
                <h3 className="font-bold text-slate-800 text-base">{restaurant.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                    ★ {restaurant.rating}
                  </span>
                  <span className="text-xs text-slate-500">{restaurant.time}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Delivery: {restaurant.delivery}</p>
                <button
                  onClick={() =>
                    setExpandedRestaurant(
                      expandedRestaurant === restaurant.id ? null : restaurant.id
                    )
                  }
                  className="mt-2 text-sm font-bold text-[#ba001c] flex items-center gap-1"
                >
                  {expandedRestaurant === restaurant.id ? "Hide Menu" : "View Menu"}
                  <span className="material-symbols-outlined text-sm">
                    {expandedRestaurant === restaurant.id ? "expand_less" : "expand_more"}
                  </span>
                </button>
              </div>
            </div>

            {/* Inline Menu */}
            {expandedRestaurant === restaurant.id && (
              <div className="border-t border-slate-100 px-4 pb-4 space-y-3 bg-slate-50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-3 mb-1">
                  Menu
                </p>
                {restaurant.menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                        <p className="font-black text-[#ba001c] text-sm">₹{item.price}</p>
                      </div>
                    </div>
                    <AddToCartButton item={item} restaurant={restaurant} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </main>

      <CartFloater />
    </div>
  );
}