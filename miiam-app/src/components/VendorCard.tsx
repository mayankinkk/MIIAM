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
        className="block bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
      >
        {/* Image */}
        <div className="relative h-36 bg-surface-container">
          <BlurImage
            src={vendor.cover_image_url || vendor.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"}
            alt={vendor.shop_name}
            fill
            className="w-full h-full"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            {vendor.is_new && (
              <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">NEW</span>
            )}
            {vendor.delivery_charge === 0 && (
              <span className="bg-primary text-on-primary text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">FREE DEL</span>
            )}
          </div>
          {/* Status */}
          <div className="absolute bottom-2 left-2">
            <OpenClosedBadge isOpen={isOpen} />
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-bold text-on-surface text-sm truncate">{vendor.shop_name}</h3>
          <p className="text-xs text-on-surface-variant/60 truncate mt-0.5">{vendor.cuisine || "Various"}</p>
          <div className="flex items-center gap-3 mt-2">
            {vendor.rating && (
              <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                {typeof vendor.rating === "number" ? vendor.rating.toFixed(1) : vendor.rating}
              </span>
            )}
            {vendor.delivery_time_min && vendor.delivery_time_max && (
              <span className="flex items-center gap-0.5 text-xs text-on-surface-variant">
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
