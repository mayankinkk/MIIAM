"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import BlurImage from "@/components/BlurImage";
import { LandingNavbar, LandingFooter } from "@/components/layout/LandingNavbar";
import LandingClient from "@/components/LandingClient";
import LandingBottomNav from "@/components/layout/LandingBottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import { createClient } from "@/lib/supabase/client";

const quickServices = [
  { icon: "restaurant", label: "Food", href: "/app/food", color: "from-[var(--color-primary)] to-[var(--color-primary-light)]" },
  { icon: "home_repair_service", label: "Services", href: "/services", color: "from-brand-secondary to-[#667eea]" },
  { icon: "local_grocery_store", label: "Grocery", href: "/app/grocery", color: "from-[#11998e] to-[#38ef7d]" },
  { icon: "print", label: "Printing", href: "/app/printing", color: "from-[#6366f1] to-[#8b5cf6]" },
];

interface LandingVendor {
  id: string;
  shop_name: string;
  name?: string;
  cuisine?: string;
  type?: string;
  image_url?: string;
  cover_image_url?: string;
  rating?: string | number;
  review_count?: number;
  delivery_time_min?: number;
  delivery_time_max?: number;
  delivery_time?: string;
  is_featured?: boolean;
  is_promoted?: boolean;
  status?: string;
  description?: string;
  address?: string;
}

export default function LandingPage() {
  const supabase = useMemo(() => createClient(), []);
  const [vendors, setVendors] = useState<LandingVendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVendors() {
      const { data } = await supabase
        .from("vendors")
        .select("id, shop_name, name, cuisine, type, image_url, cover_image_url, rating, review_count, delivery_time_min, delivery_time_max, delivery_time, is_featured, is_promoted, status, description, address")
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);

      if (data) setVendors(data);
      setLoading(false);
    }
    fetchVendors();
  }, [supabase]);

  const featuredVendor = vendors.find((v) => v.is_featured || v.is_promoted) || vendors[0] || null;
  const serviceVendor = vendors.find((v) => v.type !== "food" && v.type !== "restaurant") || null;
  const foodVendors = vendors.filter((v) => v.type === "food" || v.type === "restaurant");

  return (
    <>
      <LandingNavbar />

      <main className="pt-[72px] pb-20 md:pb-0 overflow-x-hidden">
        <LandingClient>
          {(t) => (
            <>
              {/* Hero Section */}
              <section className="relative min-h-[60vh] sm:min-h-[70vh] lg:min-h-[85vh] flex items-center">
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f0f] via-[#1a0a0e] to-[#0a0a0a]" />
                  <BlurImage
                    src="/images/food_hero.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-[0.12] mix-blend-luminosity"
                    fallbackSrc="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80"
                  />
                </div>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-primary)]/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--color-secondary)]/15 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-[var(--color-surface-container-lowest)]/10 backdrop-blur-md px-4 py-2 rounded-full mb-5 sm:mb-8 border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-white/80 text-xs font-semibold tracking-wide">Now serving your city</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-4 sm:mb-6">
                      {t.heroTitle1}<br />
                      <span className="bg-gradient-to-r from-[var(--color-primary-light)] to-[#ffc371] bg-clip-text text-transparent">{t.heroTitle2}</span>
                    </h1>
                    <p className="text-white/50 text-base sm:text-xl max-w-lg mb-6 sm:mb-10 leading-relaxed font-medium">{t.heroDesc}</p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <Link href="/app/food" className="group flex items-center gap-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dim)] text-white pl-5 pr-4 py-3 sm:pl-7 sm:pr-5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base shadow-xl shadow-[var(--color-primary)]/25 hover:shadow-[var(--color-primary)]/40 active:scale-[0.97] transition-all duration-200">
                        {t.orderFood}
                        <span className="material-symbols-outlined text-lg sm:text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </Link>
                      <Link href="/services" className="group flex items-center gap-3 bg-[var(--color-surface-container-lowest)]/10 hover:bg-white/15 backdrop-blur-md text-white border border-white/20 pl-5 pr-4 py-3 sm:pl-7 sm:pr-5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base active:scale-[0.97] transition-all duration-200">
                        {t.bookService}
                        <span className="material-symbols-outlined text-lg sm:text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              {/* Quick Services Grid */}
              <section className="relative z-20 -mt-8 sm:-mt-12 lg:-mt-16 max-w-5xl mx-auto px-6 lg:px-8">
                <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-[var(--color-border-subtle)] p-5 sm:p-8">
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
                    {quickServices.map((svc) => (
                      <Link key={svc.label} href={svc.href} className="group flex flex-col items-center gap-2.5 py-3 sm:py-3 rounded-2xl hover:bg-[var(--color-surface-subtle)] active:scale-95 transition-all duration-200">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${svc.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
                          <span className="material-symbols-outlined text-white text-xl sm:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{svc.icon}</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] transition-colors">{svc.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>

              {/* Features Strip */}
              <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { icon: "shopping_cart_checkout", label: t.featureCart, sub: "Easy ordering", color: "bg-red-50 text-[var(--color-primary)]" },
                    { icon: "bolt", label: t.featureDelivery, sub: "Under 25 mins", color: "bg-amber-50 text-amber-600" },
                    { icon: "verified_user", label: t.featurePros, sub: "Background verified", color: "bg-blue-50 text-[var(--color-secondary)]" },
                    { icon: "support_agent", label: t.featureSupport, sub: "Always available", color: "bg-green-50 text-green-600" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3 group">
                      <div className={`${item.color} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                      </div>
                      <div>
                        <p className="font-bold text-[var(--color-on-surface)] text-sm leading-tight">{item.label}</p>
                        <p className="text-xs text-[var(--color-outline-variant)] mt-0.5">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Popular Near You */}
              {!loading && vendors.length > 0 && (
                <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-20">
                  <div className="flex justify-between items-end mb-10">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-on-surface)]">{t.popularNearYou}</h2>
                      <p className="text-[var(--color-outline-variant)] font-medium mt-1.5">{t.popularDesc}</p>
                    </div>
                    <Link href="/app/explore" className="text-[var(--color-primary)] font-bold text-sm flex items-center gap-1.5 hover:gap-3 transition-all duration-200">
                      {t.viewAll} <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Featured Vendor - Large Card */}
                    {featuredVendor && (
                      <Link href={`/app/vendor/${featuredVendor.id}`} className="md:col-span-2 group relative overflow-hidden rounded-2xl bg-[var(--color-surface-container-lowest)] shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[var(--color-border-subtle)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-all duration-500">
                        <div className="aspect-[16/9] overflow-hidden">
                          <BlurImage
                            src={featuredVendor.cover_image_url || featuredVendor.image_url || ""}
                            alt={featuredVendor.shop_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            fallbackSrc="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80"
                          />
                        </div>
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-black px-3 py-1 rounded-full mb-3 inline-block uppercase tracking-wider">
                                {featuredVendor.is_featured ? t.trendingFood : "New"}
                              </span>
                              <h3 className="text-xl font-bold text-[var(--color-on-surface)]">{featuredVendor.shop_name}</h3>
                              <div className="flex items-center gap-2 mt-1.5 text-[var(--color-outline)] text-sm font-medium">
                                {featuredVendor.rating && (
                                  <span className="flex items-center gap-1 text-green-600 font-bold">
                                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    {Number(featuredVendor.rating).toFixed(1)}
                                  </span>
                                )}
                                {featuredVendor.review_count !== undefined && (
                                  <>
                                    <span className="text-[var(--color-outline-variant)]/60">•</span>
                                    <span>{featuredVendor.review_count}+ reviews</span>
                                  </>
                                )}
                                {featuredVendor.delivery_time_min && (
                                  <>
                                    <span className="text-[var(--color-outline-variant)]/60">•</span>
                                    <span>{featuredVendor.delivery_time_min}-{featuredVendor.delivery_time_max || featuredVendor.delivery_time_min + 10} mins</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span className="bg-[var(--color-primary)] p-3 rounded-xl text-white shadow-lg shadow-[var(--color-primary)]/20">
                              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_shopping_cart</span>
                            </span>
                          </div>
                        </div>
                      </Link>
                    )}

                    {/* Service or Second Food Vendor - Small Card */}
                    {serviceVendor && (
                      <Link href={`/app/vendor/${serviceVendor.id}`} className="group relative overflow-hidden rounded-2xl bg-[var(--color-surface-container-lowest)] shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[var(--color-border-subtle)] flex flex-col hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-all duration-500">
                        <div className="aspect-square overflow-hidden">
                          <BlurImage
                            src={serviceVendor.cover_image_url || serviceVendor.image_url || ""}
                            alt={serviceVendor.shop_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80"
                          />
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <span className="bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] text-[10px] font-black px-3 py-1 rounded-full mb-3 self-start uppercase tracking-wider">
                            {serviceVendor.type || "Service"}
                          </span>
                          <h3 className="text-xl font-bold text-[var(--color-on-surface)]">{serviceVendor.shop_name}</h3>
                          <div className="mt-auto pt-4 flex justify-between items-center">
                            {serviceVendor.cuisine && (
                              <span className="text-[var(--color-outline)] font-bold text-sm">{serviceVendor.cuisine}</span>
                            )}
                            {serviceVendor.rating && (
                              <span className="flex items-center gap-1.5 font-bold text-sm text-[var(--color-on-surface)]">
                                <span className="material-symbols-outlined text-[var(--color-secondary)] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                {Number(serviceVendor.rating).toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )}

                    {/* Fallback: Show first food vendor if no service vendor */}
                    {!serviceVendor && foodVendors.length > 1 && (
                      <Link href={`/app/vendor/${foodVendors[1].id}`} className="group relative overflow-hidden rounded-2xl bg-[var(--color-surface-container-lowest)] shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[var(--color-border-subtle)] flex flex-col hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-all duration-500">
                        <div className="aspect-square overflow-hidden">
                          <BlurImage
                            src={foodVendors[1].cover_image_url || foodVendors[1].image_url || ""}
                            alt={foodVendors[1].shop_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80"
                          />
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                          <span className="bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] text-[10px] font-black px-3 py-1 rounded-full mb-3 self-start uppercase tracking-wider">
                            {foodVendors[1].cuisine || "Food"}
                          </span>
                          <h3 className="text-xl font-bold text-[var(--color-on-surface)]">{foodVendors[1].shop_name}</h3>
                          <div className="mt-auto pt-4 flex justify-between items-center">
                            {foodVendors[1].cuisine && (
                              <span className="text-[var(--color-outline)] font-bold text-sm">{foodVendors[1].cuisine}</span>
                            )}
                            {foodVendors[1].rating && (
                              <span className="flex items-center gap-1.5 font-bold text-sm text-[var(--color-on-surface)]">
                                <span className="material-symbols-outlined text-[var(--color-secondary)] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                {Number(foodVendors[1].rating).toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </LandingClient>
      </main>

      <LandingFooter />
      <LandingBottomNav />
      <InstallPrompt />
    </>
  );
}
