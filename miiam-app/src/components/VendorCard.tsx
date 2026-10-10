"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import BlurImage from "@/components/BlurImage";
import OpenClosedBadge from "@/components/OpenClosedBadge";

interface VendorCardProps {
  vendor: {
    id: string;
    shop_name: string;
    cuisine?: string;
    rating?: number;
    delivery_time_min?: number;
    delivery_time_max?: number;
    image_url?: string;
    cover_image_url?: string;
    is_new?: boolean;
    opening_hours?: unknown;
    delivery_charge?: number;
  };
  index?: number;
}

function parseIsOpen(openingHours: unknown): boolean {
  if (!openingHours || typeof openingHours !== "object") return true;
  const hours = openingHours as Record<string, { open?: string; close?: string }>;
  const now = new Date();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = dayNames[now.getDay()];
  const todayHours = hours[today];
  if (!todayHours?.open || !todayHours?.close) return true;
  const [oh, om] = todayHours.open.split(":").map(Number);
  const [ch, cm] = todayHours.close.split(":").map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= oh * 60 + om && mins <= ch * 60 + cm;
}

export default memo(function VendorCard({ vendor, index = 0 }: VendorCardProps) {
  const isOpen = parseIsOpen(vendor.opening_hours);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/app/food/${vendor.id}`}
        className="bg-surface-container-lowest border-border-subtle block overflow-hidden rounded-xl border shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
      >
        {/* Image */}
        <div className="bg-surface-container relative h-36">
          <BlurImage
            src={
              vendor.cover_image_url ||
              vendor.image_url ||
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
            }
            alt={vendor.shop_name}
            fill
            className="h-full w-full"
            sizes="(max-width: 640px) 50vw, 25vw"
            fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            {vendor.is_new && (
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
                NEW
              </span>
            )}
            {vendor.delivery_charge === 0 && (
              <span className="bg-primary text-on-primary rounded-full px-2 py-0.5 text-[9px] font-black shadow-sm">
                FREE DEL
              </span>
            )}
          </div>
          {/* Status */}
          <div className="absolute bottom-2 left-2">
            <OpenClosedBadge isOpen={isOpen} />
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="text-on-surface truncate text-sm font-bold">{vendor.shop_name}</h3>
          <p className="text-on-surface-variant/60 mt-0.5 truncate text-xs">
            {vendor.cuisine || "Various"}
          </p>
          <div className="mt-2 flex items-center gap-3">
            {vendor.rating && (
              <span className="bg-accent flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-bold text-white">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                {typeof vendor.rating === "number" ? vendor.rating.toFixed(1) : vendor.rating}
              </span>
            )}
            {vendor.delivery_time_min && vendor.delivery_time_max && (
              <span className="text-on-surface-variant flex items-center gap-0.5 text-xs">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {vendor.delivery_time_min}–{vendor.delivery_time_max} min
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
