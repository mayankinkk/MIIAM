"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";
import { useLocationStore } from "@/lib/store/locationStore";
import { useServiceSettingsStore, ServiceCategory } from "@/lib/store/serviceSettingsStore";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import { CardSkeleton } from "@/components/Skeleton";
import ServiceUnavailable from "@/components/ServiceUnavailable";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  image_url: string;
  image?: string;
  stock?: number;
}

interface ServiceProductGridProps {
  serviceName: string;
  supabaseTable: string;
  vendorType: string;
  title: string;
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  categories: Category[];
  emptyIcon: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  serviceUnavailableIcon: string;
  serviceSettingKey: ServiceCategory;
  priceLabel?: string;
  filterTransform?: (value: string) => string;
  productImageFallback?: string;
  serviceablePrefix: string;
  deliveryNoun: string;
  vendorNameDefault: string;
  checkoutUnserviceableMsg: string;
  showVendorBreadcrumb?: boolean;
}

export default function ServiceProductGrid({
  serviceName,
  supabaseTable,
  vendorType,
  title,
  heroImage,
  heroTitle,
  heroSubtitle,
  categories,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyActionLabel = "Browse All",
  serviceUnavailableIcon,
  serviceSettingKey,
  priceLabel = "\u20B9",
  filterTransform = (v: string) => v,
  productImageFallback,
  serviceablePrefix,
  deliveryNoun,
  vendorNameDefault,
  checkoutUnserviceableMsg,
  showVendorBreadcrumb = false,
}: ServiceProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isServiceable, setIsServiceable] = useState(true);
  const [locationRequired, setLocationRequired] = useState(false);
  const [vendor, setVendor] = useState<{
    id: string;
    shop_name: string;
    pincode?: string;
    city?: string;
    [key: string]: unknown;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("default");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { items, addItem, updateQuantity, totalItems } = useCartStore();
  const { addToast } = useToastStore();
  const locationStore = useLocationStore();
  const userPincode = locationStore.pincode;
  const userCity = locationStore.city;
  const serviceSetting = useServiceSettingsStore().getSetting(serviceSettingKey);

  useEffect(() => {
    loadVendorAndProducts();
  }, [userPincode, userCity]);

  async function loadVendorAndProducts() {
    setLoading(true);
    setIsServiceable(true);
    setLocationRequired(false);

    if (!userPincode && !userCity) {
      setIsServiceable(false);
      setLocationRequired(true);
      setVendor(null);
      setProducts([]);
      setLoading(false);
      return;
    }

    const { data: vendors } = await supabase
      .from("vendors")
      .select("id, shop_name, pincode, city")
      .eq("type", vendorType)
      .eq("status", "active");

    let matchedVendor = null;

    if (vendors && vendors.length > 0) {
      const cityLower = (userCity || "").toLowerCase();
      const localVendors = vendors.filter(
        (v: {
          id: string;
          shop_name: string;
          pincode?: string;
          city?: string;
          [key: string]: unknown;
        }) => {
          const pincodeMatch = userPincode && v.pincode === userPincode;
          const cityMatch = cityLower && v.city?.toLowerCase() === cityLower;
          return pincodeMatch || cityMatch;
        }
      );

      if (localVendors.length > 0) {
        matchedVendor = localVendors[0];
      } else {
        setIsServiceable(false);
      }
    } else {
      setIsServiceable(false);
    }

    setVendor(matchedVendor);

    if (matchedVendor) {
      const { data, error } = await supabase
        .from(supabaseTable)
        .select("*")
        .eq("vendor_id", matchedVendor.id)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error(
          { err: error instanceof Error ? error : new Error(String(error)) },
          "Error fetching products"
        );
        addToast("Failed to load data. Please try again.", "error");
      } else {
        setProducts(data || []);
      }
    } else {
      setProducts([]);
    }
    setLoading(false);
  }

  const hasStock = vendorType === "grocery";
  const categoryIcon = (product: Product) => {
    const cat = (product.category || "").toLowerCase();
    if (cat.includes("fruit")) return "🍎";
    if (cat.includes("vegetable") || cat.includes("veg")) return "🥬";
    if (cat.includes("dairy") || cat.includes("milk") || cat.includes("egg")) return "🥛";
    if (cat.includes("bakery") || cat.includes("bread")) return "🍞";
    if (cat.includes("spice")) return "🌶️";
    if (
      cat.includes("pulse") ||
      cat.includes("rice") ||
      cat.includes("dal") ||
      cat.includes("grain")
    )
      return "🌾";
    if (cat.includes("oil")) return "🫒";
    if (cat.includes("beverage") || cat.includes("tea") || cat.includes("drink")) return "🧃";
    if (vendorType === "flower" || vendorType === "flowers") return "🌸";
    return "🛒";
  };

  const filteredProducts = (() => {
    let result =
      selectedCategory === "all"
        ? products
        : products.filter(
            (p) => filterTransform(p.category?.toLowerCase() || "") === selectedCategory
          );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    if (inStockOnly && hasStock) {
      result = result.filter((p) => p.stock === undefined || p.stock > 0);
    }

    switch (sortBy) {
      case "price_asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "name_asc":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        result = [...result].sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return result;
  })();

  if (serviceSetting && !serviceSetting.isEnabled) {
    return (
      <ServiceUnavailable
        serviceName={serviceName}
        message={serviceSetting.message}
        icon={serviceUnavailableIcon}
      />
    );
  }

  const addToCart = (product: Product) => {
    if (!isServiceable) {
      addToast(`${serviceName} delivery is not available at your location!`, "error");
      return;
    }
    addItem({
      id: product.id,
      menu_item_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      vendor_id: vendor?.id || vendorType,
      vendor_name: vendor?.shop_name || vendorNameDefault,
    });
  };

  const getItemQuantity = (productId: string) => {
    const item = (items || []).find((i) => i.menu_item_id === productId);
    return item?.quantity || 0;
  };

  const AddButton = ({ product }: { product: Product }) => {
    const quantity = getItemQuantity(product.id);
    if (quantity === 0) {
      return (
        <button
          onClick={() => {
            addToCart(product);
            if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
          }}
          className="text-on-primary animate-glow-pulse flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary)] transition-all hover:scale-110 active:scale-90"
        >
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      );
    }
    return (
      <div className="bg-surface-container-lowest border-primary animate-cart-pop flex items-center gap-1 rounded-lg border px-1">
        <button
          onClick={() => {
            updateQuantity(product.id, quantity - 1);
            if (navigator.vibrate) navigator.vibrate(10);
          }}
          className="bg-primary text-on-primary flex h-9 w-9 items-center justify-center rounded-md transition-all hover:brightness-95 active:scale-90"
        >
          <span className="material-symbols-outlined text-lg">remove</span>
        </button>
        <span className="text-on-surface min-w-[22px] text-center text-sm font-extrabold">
          {quantity}
        </span>
        <button
          onClick={() => {
            addToCart(product);
            if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
          }}
          className="bg-primary text-on-primary flex h-9 w-9 items-center justify-center rounded-md transition-all hover:brightness-95 active:scale-90"
        >
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      </div>
    );
  };

  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: "Home", href: "/app/home" },
    { label: title },
  ];
  if (showVendorBreadcrumb && vendor) {
    breadcrumbItems.push({ label: vendor.shop_name });
  }

  return (
    <div className="bg-surface min-h-screen pb-24">
      {/* Header */}
      <header className="bg-surface-container-lowest sticky top-0 z-10 px-6 py-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/app/home"
            className="bg-surface-container flex h-10 w-10 items-center justify-center rounded-full"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-on-surface text-xl font-black">{title}</h1>
          <Link
            href="/app/cart"
            className="bg-surface-container relative flex h-10 w-10 items-center justify-center rounded-full"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {totalItems() > 0 && (
              <span className="text-on-primary absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs">
                {totalItems()}
              </span>
            )}
          </Link>
        </div>
      </header>

      <Breadcrumbs items={breadcrumbItems} />

      {/* Location / Availability Banner */}
      {!isServiceable && (userPincode || userCity) && (
        <div className="bg-surface-container-low flex items-center gap-3 border-b border-amber-200 px-6 py-3">
          <span className="material-symbols-outlined animate-bounce text-xl text-amber-600">
            warning
          </span>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-800">
              Not serviceable at {userPincode ? `Pincode ${userPincode}` : userCity}
            </p>
            <p className="text-[10px] font-medium text-amber-600">
              {deliveryNoun} delivery is not yet available in your area. You can still browse our
              catalog!
            </p>
          </div>
        </div>
      )}
      {isServiceable && (userPincode || userCity) && (
        <div className="bg-surface-container-low flex items-center gap-2 border-b border-green-200 px-6 py-2">
          <span className="material-symbols-outlined text-sm text-green-600">location_on</span>
          <p className="text-[11px] font-bold text-green-700">
            {serviceablePrefix} {userPincode ? `Pincode ${userPincode}` : userCity}
          </p>
        </div>
      )}

      {/* Hero Banner */}
      <div className="mt-4 px-6">
        <div className="relative h-40 overflow-hidden rounded-2xl shadow-sm">
          <BlurImage src={heroImage} alt={heroTitle} fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-4">
            <h2 className="text-xl font-black text-white">{heroTitle}</h2>
            <p className="text-sm text-white/90">{heroSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-surface-container-lowest px-6 py-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined text-on-surface-variant absolute top-1/2 left-4 -translate-y-1/2 text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${serviceName.toLowerCase()}...`}
            className="bg-surface-container text-on-surface placeholder:text-on-surface-variant/60 h-12 w-full rounded-2xl pr-4 pl-11 text-sm font-medium transition-shadow focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-on-surface-variant hover:text-on-surface absolute top-1/2 right-4 -translate-y-1/2"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>
        <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => {
              setSelectedCategory("all");
              if (navigator.vibrate) navigator.vibrate(10);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap ${
              selectedCategory === "all"
                ? "text-on-primary bg-[var(--color-primary)]"
                : "bg-surface-container text-on-surface-variant"
            } transition-all active:scale-95`}
          >
            All
          </button>
          {categories.map((cat, i) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(filterTransform(cat.id));
                if (navigator.vibrate) navigator.vibrate(10);
              }}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap ${
                selectedCategory === filterTransform(cat.id)
                  ? "text-on-primary bg-[var(--color-primary)]"
                  : "bg-surface-container text-on-surface-variant"
              } animate-category-slide transition-all active:scale-95`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sort & Filter Bar */}
      <div className="border-outline-variant/20 flex items-center gap-3 border-b px-6 py-3">
        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="bg-surface-container-lowest text-on-surface hover:bg-surface-container flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-lg">sort</span>
            {sortBy === "default"
              ? "Sort"
              : sortBy === "price_asc"
                ? "Price: Low"
                : sortBy === "price_desc"
                  ? "Price: High"
                  : sortBy === "name_asc"
                    ? "A-Z"
                    : "Z-A"}
          </button>
          {showSort && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
              <div className="bg-surface-container-lowest border-outline-variant/30 absolute top-full left-0 z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl border shadow-xl">
                {[
                  { value: "default", label: "Default" },
                  { value: "price_asc", label: "Price: Low to High" },
                  { value: "price_desc", label: "Price: High to Low" },
                  { value: "name_asc", label: "Name: A-Z" },
                  { value: "name_desc", label: "Name: Z-A" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setShowSort(false);
                    }}
                    className={`hover:bg-surface-container w-full px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      sortBy === opt.value
                        ? "bg-[var(--color-surface-container)] text-[var(--color-accent)]"
                        : "text-on-surface"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {hasStock && (
          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              inStockOnly
                ? "text-on-primary bg-[var(--color-primary)]"
                : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-lg">inventory_2</span>
            In Stock
          </button>
        )}
      </div>

      {/* Products Grid */}
      <main className="animate-in fade-in p-6 duration-500">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : locationRequired ? (
          <div className="bg-surface-container-lowest border-outline-variant animate-reveal-up mx-2 rounded-3xl border py-16 text-center shadow-sm">
            <div className="animate-glow-pulse mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
              <span className="material-symbols-outlined text-4xl text-[var(--color-accent)]">
                location_on
              </span>
            </div>
            <h3 className="text-on-surface text-lg font-black">Location Required</h3>
            <p className="text-on-surface-variant mx-auto mt-2 max-w-[240px] text-sm">
              Please set your delivery location to view available products in your area.
            </p>
            <button
              onClick={() => {
                router.push("/app/home?selectLocation=true");
              }}
              className="bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary mt-6 rounded-full px-6 py-2.5 text-sm font-bold shadow-md transition-all active:scale-95"
            >
              Set Location
            </button>
          </div>
        ) : !isServiceable && products.length === 0 ? (
          <div className="bg-surface-container-lowest border-outline-variant animate-reveal-up mx-2 rounded-3xl border py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
              <span className="material-symbols-outlined text-4xl text-amber-500">
                location_off
              </span>
            </div>
            <h3 className="text-on-surface text-lg font-black">Not Serviceable</h3>
            <p className="text-on-surface-variant mx-auto mt-2 max-w-[240px] text-sm">
              {serviceName} delivery is not yet available in your area. Try a nearby pincode!
            </p>
            <button
              onClick={() => {
                router.push("/app/home?selectLocation=true");
              }}
              className="mt-6 rounded-full bg-amber-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-amber-700 active:scale-95"
            >
              Change Location
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-surface-container-lowest border-outline-variant mx-2 rounded-3xl border py-16 text-center shadow-sm">
            <span
              className={`${/^[a-z_]/.test(emptyIcon) ? "material-symbols-outlined" : ""} text-outline text-6xl`}
            >
              {emptyIcon}
            </span>
            <h3 className="text-on-surface mt-4 text-lg font-black">{emptyTitle}</h3>
            <p className="text-on-surface-variant mx-auto mt-2 max-w-[200px] text-sm">
              {emptyDescription}
            </p>
            <button
              onClick={() => setSelectedCategory("all")}
              className="bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary mt-6 rounded-full px-6 py-2 text-sm font-bold transition-colors"
            >
              {emptyActionLabel}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product: Product, index) => (
              <div
                key={product.id}
                className="bg-surface-container-lowest card-lift animate-in fade-in slide-in-from-bottom-4 overflow-hidden rounded-2xl shadow-sm duration-500"
                style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
              >
                <div className="relative h-32 w-full bg-[var(--color-surface-container)]">
                  {product.image_url || product.image ? (
                    <BlurImage
                      src={product.image_url || product.image || ""}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">
                      {categoryIcon(product)}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-on-surface text-sm font-bold">{product.name}</p>
                  <p className="text-on-surface-variant text-xs">
                    {product.category || product.description || ""}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-black text-[var(--color-accent)]">
                      {priceLabel}
                      {product.price}
                    </span>
                    <AddButton product={product} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Checkout Button */}
      {totalItems() > 0 && (
        <button
          onClick={() => {
            if (!isServiceable) {
              addToast(checkoutUnserviceableMsg, "error");
            } else {
              router.push("/app/cart");
            }
          }}
          className={`text-on-primary animate-slide-reveal fixed right-4 bottom-6 left-4 z-50 flex items-center justify-between rounded-2xl px-5 py-4 shadow-2xl transition-transform active:scale-[0.98] ${
            isServiceable
              ? "shadow-primary/40 bg-[var(--color-primary)]"
              : "bg-outline cursor-not-allowed shadow-none"
          }`}
          style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="flex items-center gap-3">
            <span className="bg-surface-container-lowest rounded-full px-2 py-0.5 text-xs font-black text-[var(--color-accent)]">
              {totalItems()}
            </span>
            <span className="font-bold">View Cart</span>
          </div>
          <span className="text-lg font-black">{isServiceable ? "Checkout" : "Unserviceable"}</span>
        </button>
      )}
    </div>
  );
}
