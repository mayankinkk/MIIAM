"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNavBar from "@/components/layout/BottomNavBar";
import BlurImage from "@/components/BlurImage";
import { MARKETING_TO_APP_CATEGORY } from "@/lib/data/services";

const serviceCategories = [
  {
    id: "beauty",
    title: "Beauty & Wellness",
    subtitle: "Pamper yourself at home",
    icon: "spa",
    description: "Salon, Spa, Nails & Makeup at your doorstep",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80",
    services: ["Hair Styling", "Massage", "Manicure", "Bridal Makeup"],
    color: "pink",
    gradient: "from-pink-500 to-rose-400",
    price: "From ₹299",
  },
  {
    id: "ac_repair",
    title: "AC Repair & Service",
    subtitle: "Cool comfort restored",
    icon: "ac_unit",
    description: "Installation, Repair & Deep Cleaning",
    image: "https://images.unsplash.com/photo-1631564591547-4d46fe7c9c0a?w=600&q=80",
    services: ["Gas Refill", "Deep Cleaning", "Installation", "Repair"],
    color: "blue",
    gradient: "from-blue-500 to-cyan-400",
    price: "From ₹199",
  },
  {
    id: "plumbing",
    title: "Plumbing Services",
    subtitle: "Leak-free living",
    icon: "plumbing",
    description: "Expert plumbers for all your needs",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80",
    services: ["Tap Repair", "Drain Cleaning", "Tank Cleaning", "Pipes"],
    color: "cyan",
    gradient: "from-cyan-500 to-teal-400",
    price: "From ₹149",
  },
  {
    id: "electrical",
    title: "Electrical Services",
    subtitle: "Safe & certified",
    icon: "electrical_services",
    description: "Safe & certified electricians",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80",
    services: ["Fan Installation", "Wiring", "Switch Repair", "MCB"],
    color: "amber",
    gradient: "from-amber-500 to-orange-400",
    price: "From ₹99",
  },
  {
    id: "cleaning",
    title: "Home Cleaning",
    subtitle: "Sparkling clean home",
    icon: "cleaning_services",
    description: "Deep cleaning for your entire home",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80",
    services: ["Full Home", "Bathroom", "Sofa", "Kitchen"],
    color: "green",
    gradient: "from-green-500 to-emerald-400",
    price: "From ₹499",
  },
  {
    id: "appliance",
    title: "Appliance Repair",
    subtitle: "All brands serviced",
    icon: "kitchen",
    description: "All major appliances serviced",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
    services: ["Refrigerator", "Washing Machine", "Microwave", "TV"],
    color: "purple",
    gradient: "from-purple-500 to-violet-400",
    price: "From ₹249",
  },
];

const stats = [
  { number: "4.8★", label: "Avg Rating", icon: "star" },
  { number: "100+", label: "Expert Pros", icon: "groups" },
  { number: "12+", label: "Service Types", icon: "category" },
  { number: "Growing", label: "In Gauripur", icon: "location_on" },
];

const whyChooseUs = [
  { icon: "verified_user", title: "Verified Experts", desc: "Background-checked professionals", color: "bg-green-100 text-green-600" },
  { icon: "schedule", title: "Flexible Scheduling", desc: "Book at your convenience", color: "bg-blue-100 text-blue-600" },
  { icon: "support_agent", title: "24/7 Support", desc: "Round-the-clock assistance", color: "bg-purple-100 text-purple-600" },
];

export default function ServicesLandingPage() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const handleCardClick = (categoryId: string) => {
    const mapped = MARKETING_TO_APP_CATEGORY[categoryId] || categoryId;
    router.push(`/app/services?category=${mapped}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-surface-container-lowest)] to-white overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative pt-20 pb-12 px-6 text-center">
        <div className="transition-all duration-700 opacity-100 translate-y-0">
          <span className="inline-block text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-4 py-1.5 rounded-full mb-4">
            Professional Home Services
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[var(--color-on-surface)] mb-3 leading-tight">
            Expert Services,
            <br />
            <span className="text-[var(--color-primary)]">At Your Doorstep</span>
          </h1>
          <p className="text-[var(--color-outline)] text-lg max-w-md mx-auto">
            Book trusted professionals for home repair, cleaning, beauty & more
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex justify-center gap-6 mt-10 transition-all duration-700 delay-300 opacity-100 translate-y-0">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-lg">{stat.icon}</span>
              </div>
              <p className="font-black text-[var(--color-on-surface)] text-sm">{stat.number}</p>
              <p className="text-[10px] text-[var(--color-outline)] font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="relative max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center mb-12 transition-all duration-1000 delay-300 opacity-100 translate-y-0">
          <h2 className="text-3xl md:text-4xl font-black text-[var(--color-on-surface)] mb-3">Choose Your Service</h2>
          <p className="text-[var(--color-outline)]">Tap a card to explore and book</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceCategories.map((category, index) => (
            <div
              key={category.id}
              className="group relative transition-all duration-700 cursor-pointer opacity-100 translate-y-0"
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleCardClick(category.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(category.id);
                }
              }}
              tabIndex={0}
              role="link"
              aria-label={`Browse ${category.title}`}
            >
              {/* Card Glow */}
              <div
                className={`absolute -inset-0.5 rounded-3xl opacity-0 transition-opacity duration-500 blur-xl bg-gradient-to-r ${category.gradient} ${hoveredCard === index ? "opacity-100" : ""}`}
              />

              {/* Card Content */}
              <div className="relative bg-[var(--color-surface-container-lowest)] rounded-3xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2">
                {/* Image Section */}
                <div className="relative h-48 overflow-hidden">
                  <BlurImage
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Floating Icon */}
                  <div
                    className={`absolute top-4 right-4 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${hoveredCard === index ? "scale-110 rotate-12" : ""} ${
                      category.color === "pink"
                        ? "bg-pink-500"
                        : category.color === "blue"
                          ? "bg-blue-500"
                          : category.color === "cyan"
                            ? "bg-cyan-500"
                            : category.color === "amber"
                              ? "bg-amber-500"
                              : category.color === "green"
                                ? "bg-green-500"
                                : "bg-purple-500"
                    }`}
                  >
                    <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {category.icon}
                    </span>
                  </div>

                  {/* Price Tag */}
                  <div className="absolute bottom-4 left-4">
                    <span className="text-sm font-bold text-white bg-black/40 backdrop-blur px-3 py-1 rounded-full">{category.price}</span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5">
                  <div className="mb-2">
                    <span className="text-xs font-medium text-[var(--color-primary)] uppercase tracking-wider">{category.subtitle}</span>
                  </div>
                  <h3 className="text-xl font-black text-[var(--color-on-surface)] mb-2">{category.title}</h3>
                  <p className="text-sm text-[var(--color-outline)] mb-4">{category.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {category.services.slice(0, 3).map((service, i) => (
                      <span key={i} className="text-xs font-medium text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] px-3 py-1 rounded-full">
                        {service}
                      </span>
                    ))}
                    {category.services.length > 3 && (
                      <span className="text-xs font-medium text-[var(--color-outline-variant)] bg-[var(--color-surface-container)] px-3 py-1 rounded-full">
                        +{category.services.length - 3}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div className={`flex items-center gap-2 text-sm font-bold transition-all duration-300 ${hoveredCard === index ? "text-[var(--color-primary)]" : "text-[var(--color-outline-variant)]"}`}>
                    <span>Explore</span>
                    <span className={`material-symbols-outlined transition-transform duration-300 ${hoveredCard === index ? "translate-x-1" : ""}`}>arrow_forward</span>
                  </div>
                </div>

                {/* Hover Border Effect */}
                <div className={`absolute inset-0 rounded-3xl border-2 border-transparent transition-all duration-500 pointer-events-none ${hoveredCard === index ? "border-[var(--color-primary)]/30" : ""}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-[var(--color-surface-container-lowest)] py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[var(--color-on-surface)] mb-3">Why MIIAM?</h2>
            <p className="text-[var(--color-outline)]">We bring the best service experience to your home</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {whyChooseUs.map((item, i) => (
              <div key={i} className="text-center p-6 rounded-2xl hover:bg-[var(--color-surface-container-lowest)] transition-colors">
                <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${item.color}`}>
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {item.icon}
                  </span>
                </div>
                <h3 className="font-bold text-[var(--color-on-surface)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--color-outline)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-12 rounded-3xl overflow-hidden text-center">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dim" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 border border-white/20 rounded-full" />
              <div className="absolute bottom-0 left-0 w-48 h-48 border border-white/20 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/10 rounded-full" />
            </div>

            {/* Content */}
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Need something else?</h2>
              <p className="text-white/70 mb-8 text-lg">We constantly add new services. Let us know what you need!</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/app/services"
                  className="px-8 py-4 bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] rounded-2xl font-bold hover:bg-[var(--color-surface-container-lowest)]/90 transition-all hover:scale-105"
                >
                  Browse All Services
                </Link>
                <Link
                  href="/app/support/chat"
                  className="px-8 py-4 bg-[var(--color-surface-container-lowest)]/10 text-white border-2 border-white/20 rounded-2xl font-bold hover:bg-[var(--color-surface-container-lowest)]/20 transition-all"
                >
                  Request a Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNavBar />
    </div>
  );
}
