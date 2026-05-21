"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useToastStore } from "@/lib/store/toastStore";
import { useLocationStore } from "@/lib/store/locationStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import { CardSkeleton } from "@/components/Skeletons";
import ServiceUnavailable from "@/components/ServiceUnavailable";

const supabase = createClient();

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
  serviceSettingKey: string;
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
  const [vendor, setVendor] = useState<any>(null);
  const { items, addItem, updateQuantity, totalItems } = useCartStore();
  const { addToast } = useToastStore();
  const locationStore = useLocationStore();
  const userPincode = locationStore.pincode;
  const userCity = locationStore.city;
  const serviceSetting = useServiceSettingsStore().getSetting(serviceSettingKey);

  useEffect(() => {
    loadVendorAndProducts();
  }, [userPincode]);

  async function loadVendorAndProducts() {
    setLoading(true);
    setIsServiceable(true);

    const { data: vendors } = await supabase
      .from("vendors")
      .select("id, shop_name, pincode, city")
      .eq("type", vendorType)
      .eq("status", "active");

    let matchedVendor = null;

    if (vendors && vendors.length > 0) {
      if (userPincode || userCity) {
        const cityLower = (userCity || "").toLowerCase();
        const localVendors = vendors.filter((v: any) => {
          const pincodeMatch = userPincode && v.pincode === userPincode;
          const cityMatch = cityLower && v.city?.toLowerCase() === cityLower;
          return pincodeMatch || cityMatch;
        });

        if (localVendors.length > 0) {
          matchedVendor = localVendors[0];
        } else {
          setIsServiceable(false);
        }
      } else {
        matchedVendor = vendors[0];
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
        console.error("Error fetching products:", error);
        addToast("Failed to load data. Please try again.", "error");
      } else {
        setProducts(data || []);
      }
    } else {
      setProducts([]);
    }
    setLoading(false);
  }

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter(
          (p) => filterTransform(p.category?.toLowerCase() || "") === selectedCategory
        );

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
    addToast(`${product.name} added to cart!`, "success");
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
          className="w-8 h-8 bg-[#ba001c] text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all animate-glow-pulse"
        >
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      );
    }
    return (
      <div className="flex items-center gap-2 bg-[#ba001c] rounded-full px-2 animate-cart-pop">
        <button
          onClick={() => {
            updateQuantity(product.id, quantity - 1);
            if (navigator.vibrate) navigator.vibrate(10);
          }}
          className="w-6 h-6 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-lg">remove</span>
        </button>
        <span className="text-white font-bold text-sm min-w-[20px] text-center">
          {quantity}
        </span>
        <button
          onClick={() => {
            addToCart(product);
            if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
          }}
          className="w-6 h-6 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      </div>
    );
  };

  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: "Home", href: "/app/explore" },
    { label: title },
  ];
  if (showVendorBreadcrumb && vendor) {
    breadcrumbItems.push({ label: vendor.shop_name });
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <header className="bg-surface-container-lowest px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/app/explore"
            className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-on-surface">{title}</h1>
          <Link
            href="/app/cart"
            className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center relative"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            {totalItems() > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ba001c] text-white text-xs rounded-full flex items-center justify-center">
                {totalItems()}
              </span>
            )}
          </Link>
        </div>
      </header>

      <Breadcrumbs items={breadcrumbItems} />

      {/* Location / Availability Banner */}
      {!isServiceable && (userPincode || userCity) && (
        <div className="bg-surface-container-low border-b border-amber-200 px-6 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-600 text-xl animate-bounce">
            warning
          </span>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-800">
              Not serviceable at{" "}
              {userPincode ? `Pincode ${userPincode}` : userCity}
            </p>
            <p className="text-[10px] text-amber-600 font-medium">
              {deliveryNoun} delivery is coming soon to your area. You can still
              browse our catalog!
            </p>
          </div>
        </div>
      )}
      {isServiceable && (userPincode || userCity) && (
        <div className="bg-surface-container-low border-b border-green-200 px-6 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-green-600 text-sm">
            location_on
          </span>
          <p className="text-[11px] font-bold text-green-700">
            {serviceablePrefix}{" "}
            {userPincode ? `Pincode ${userPincode}` : userCity}
          </p>
        </div>
      )}

      {/* Hero Banner */}
      <div className="px-6 mt-4">
        <div className="rounded-2xl overflow-hidden relative h-40 shadow-sm">
          <BlurImage
            src={heroImage}
            alt={heroTitle}
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
            <h2 className="text-white text-xl font-black">{heroTitle}</h2>
            <p className="text-white/90 text-sm">{heroSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-surface-container-lowest px-6 py-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => {
              setSelectedCategory("all");
              if (navigator.vibrate) navigator.vibrate(10);
            }}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-[#ba001c] text-white"
                : "bg-surface-container text-on-surface-variant"
            } active:scale-95 transition-all`}
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
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === filterTransform(cat.id)
                  ? "bg-[#ba001c] text-white"
                  : "bg-surface-container text-on-surface-variant"
              } active:scale-95 transition-all animate-category-slide`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <main className="p-6 animate-in fade-in duration-500">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant mx-2">
            <span className={`${/^[a-z_]/.test(emptyIcon) ? 'material-symbols-outlined' : ''} text-6xl text-outline`}>{emptyIcon}</span>
            <h3 className="text-lg font-black text-on-surface mt-4">{emptyTitle}</h3>
            <p className="text-on-surface-variant text-sm mt-2 max-w-[200px] mx-auto">{emptyDescription}</p>
            <button 
              onClick={() => setSelectedCategory("all")}
              className="mt-6 px-6 py-2 bg-[#ba001c] text-white rounded-full font-bold text-sm hover:bg-[#a40017] transition-colors"
            >
              {emptyActionLabel}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product: any, index) => (
              <div
                key={product.id}
                className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm card-lift animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
              >
                <div className="relative w-full h-32">
                  <BlurImage
                    src={product.image_url || productImageFallback || product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <div className="p-3">
                  <p className="font-bold text-on-surface text-sm">
                    {product.name}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {product.category || product.description || ""}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-[#ba001c]">
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
              window.location.href = "/app/cart";
            }
          }}
          className={`fixed bottom-6 left-4 right-4 z-50 flex items-center justify-between text-white px-5 py-4 rounded-2xl shadow-2xl active:scale-[0.98] transition-transform animate-slide-reveal ${
            isServiceable
              ? "bg-[#ba001c] shadow-primary/40"
              : "bg-outline cursor-not-allowed shadow-none"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="bg-surface-container-lowest text-[#ba001c] font-black text-xs px-2 py-0.5 rounded-full">
              {totalItems()}
            </span>
            <span className="font-bold">View Cart</span>
          </div>
          <span className="font-black text-lg">
            {isServiceable ? "Checkout" : "Unserviceable"}
          </span>
        </button>
      )}
    </div>
  );
}
