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
    gradient: "from-accent to-cyan-400",
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
    gradient: "from-deal to-deal/70",
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
  {
    icon: "verified_user",
    title: "Verified Experts",
    desc: "Background-checked professionals",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: "schedule",
    title: "Flexible Scheduling",
    desc: "Book at your convenience",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: "support_agent",
    title: "24/7 Support",
    desc: "Round-the-clock assistance",
    color: "bg-accent/10 text-accent",
  },
];

export default function ServicesLandingPage() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const handleCardClick = (categoryId: string) => {
    const mapped = MARKETING_TO_APP_CATEGORY[categoryId] || categoryId;
    router.push(`/app/services?category=${mapped}`);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-[var(--color-surface-container-lowest)] to-white">
      {/* Hero Section */}
      <div className="relative px-6 pt-20 pb-12 text-center">
        <div className="translate-y-0 opacity-100 transition-all duration-700">
          <span className="mb-4 inline-block rounded-full bg-[var(--color-primary)]/10 px-4 py-1.5 text-sm font-bold text-[var(--color-accent)]">
            Professional Home Services
          </span>
          <h1 className="mb-3 text-4xl leading-tight font-black text-[var(--color-on-surface)] md:text-5xl">
            Expert Services,
            <br />
            <span className="text-[var(--color-accent)]">At Your Doorstep</span>
          </h1>
          <p className="mx-auto max-w-md text-lg text-[var(--color-outline)]">
            Book trusted professionals for home repair, cleaning, beauty & more
          </p>
        </div>

        {/* Stats Bar */}
        <div className="mt-10 flex translate-y-0 justify-center gap-6 opacity-100 transition-all delay-300 duration-700">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
                <span className="material-symbols-outlined text-lg text-[var(--color-accent)]">
                  {stat.icon}
                </span>
              </div>
              <p className="text-sm font-black text-[var(--color-on-surface)]">{stat.number}</p>
              <p className="text-[10px] font-medium text-[var(--color-outline)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="relative mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-12 translate-y-0 text-center opacity-100 transition-all delay-300 duration-1000">
          <h2 className="mb-3 text-3xl font-black text-[var(--color-on-surface)] md:text-4xl">
            Choose Your Service
          </h2>
          <p className="text-[var(--color-outline)]">Tap a card to explore and book</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {serviceCategories.map((category, index) => (
            <div
              key={category.id}
              className="group relative translate-y-0 cursor-pointer opacity-100 transition-all duration-700"
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
                className={`absolute -inset-0.5 rounded-3xl bg-gradient-to-r opacity-0 blur-xl transition-opacity duration-500 ${category.gradient} ${hoveredCard === index ? "opacity-100" : ""}`}
              />

              {/* Card Content */}
              <div className="relative overflow-hidden rounded-3xl bg-[var(--color-surface-container-lowest)] shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
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
                    className={`absolute top-4 right-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-500 ${hoveredCard === index ? "scale-110 rotate-12" : ""} ${
                      category.color === "pink"
                        ? "bg-pink-500"
                        : category.color === "blue"
                          ? "bg-accent"
                          : category.color === "cyan"
                            ? "bg-cyan-500"
                            : category.color === "amber"
                              ? "bg-amber-500"
                              : category.color === "green"
                                ? "bg-green-500"
                                : "bg-accent"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-white"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {category.icon}
                    </span>
                  </div>

                  {/* Price Tag */}
                  <div className="absolute bottom-4 left-4">
                    <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-bold text-white backdrop-blur">
                      {category.price}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5">
                  <div className="mb-2">
                    <span className="text-xs font-medium tracking-wider text-[var(--color-accent)] uppercase">
                      {category.subtitle}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-black text-[var(--color-on-surface)]">
                    {category.title}
                  </h3>
                  <p className="mb-4 text-sm text-[var(--color-outline)]">{category.description}</p>

                  {/* Tags */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {category.services.slice(0, 3).map((service, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-[var(--color-surface-container)] px-3 py-1 text-xs font-medium text-[var(--color-on-surface-variant)]"
                      >
                        {service}
                      </span>
                    ))}
                    {category.services.length > 3 && (
                      <span className="rounded-full bg-[var(--color-surface-container)] px-3 py-1 text-xs font-medium text-[var(--color-outline-variant)]">
                        +{category.services.length - 3}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div
                    className={`flex items-center gap-2 text-sm font-bold transition-all duration-300 ${hoveredCard === index ? "text-[var(--color-accent)]" : "text-[var(--color-outline-variant)]"}`}
                  >
                    <span>Explore</span>
                    <span
                      className={`material-symbols-outlined transition-transform duration-300 ${hoveredCard === index ? "translate-x-1" : ""}`}
                    >
                      arrow_forward
                    </span>
                  </div>
                </div>

                {/* Hover Border Effect */}
                <div
                  className={`pointer-events-none absolute inset-0 rounded-3xl border-2 border-transparent transition-all duration-500 ${hoveredCard === index ? "border-[var(--color-primary)]/30" : ""}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-[var(--color-surface-container-lowest)] py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-black text-[var(--color-on-surface)]">Why MIIAM?</h2>
            <p className="text-[var(--color-outline)]">
              We bring the best service experience to your home
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {whyChooseUs.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 text-center transition-colors hover:bg-[var(--color-surface-container-lowest)]"
              >
                <div
                  className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${item.color}`}
                >
                  <span
                    className="material-symbols-outlined text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {item.icon}
                  </span>
                </div>
                <h3 className="mb-2 font-bold text-[var(--color-on-surface)]">{item.title}</h3>
                <p className="text-sm text-[var(--color-outline)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl p-12 text-center">
            {/* Background */}
            <div className="from-primary to-primary-dim absolute inset-0 bg-gradient-to-r" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 h-64 w-64 rounded-full border border-white/20" />
              <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full border border-white/20" />
              <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
            </div>

            {/* Content */}
            <div className="relative">
              <h2 className="mb-4 text-3xl font-black text-white md:text-4xl">
                Need something else?
              </h2>
              <p className="mb-8 text-lg text-white/70">
                We constantly add new services. Let us know what you need!
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/app/services"
                  className="rounded-2xl bg-[var(--color-surface-container-lowest)] px-8 py-4 font-bold text-[var(--color-accent)] transition-all hover:scale-105 hover:bg-[var(--color-surface-container-lowest)]/90"
                >
                  Browse All Services
                </Link>
                <Link
                  href="/app/support/chat"
                  className="rounded-2xl border-2 border-white/20 bg-[var(--color-surface-container-lowest)]/10 px-8 py-4 font-bold text-white transition-all hover:bg-[var(--color-surface-container-lowest)]/20"
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
