"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import BlurImage from "@/components/BlurImage";

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    price: number;
    priceMin?: number;
    priceMax?: number;
    duration?: string;
    image?: string;
    rating?: number;
    reviews?: number;
    badge?: string;
  };
  index?: number;
}

export default memo(function ServiceCard({ service, index = 0 }: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/app/services/${service.id}`}
        className="bg-surface-container-lowest block overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
      >
        <div className="bg-surface-container relative h-32">
          <BlurImage
            src={
              service.image ||
              "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80"
            }
            alt={service.name}
            fill
            className="h-full w-full"
            sizes="(max-width: 640px) 50vw, 25vw"
            fallbackSrc="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80"
          />
          {service.badge && (
            <span className="bg-primary text-on-primary absolute top-2 left-2 rounded-full px-2 py-0.5 text-[9px] font-black shadow-sm">
              {service.badge}
            </span>
          )}
        </div>

        <div className="p-3">
          <h3 className="text-on-surface truncate text-sm font-bold">{service.name}</h3>
          <p className="text-on-surface-variant/60 mt-0.5 text-xs">{service.duration}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-accent text-sm font-black">
              ₹
              {service.priceMin && service.priceMax
                ? `${service.priceMin}–${service.priceMax}`
                : service.price}
            </span>
            {service.rating != null && (
              <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                {typeof service.rating === "number" ? service.rating.toFixed(1) : service.rating}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
