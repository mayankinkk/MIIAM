"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import BlurImage from "@/components/BlurImage";

interface FoodCategory {
  id: string;
  name: string;
  image: string;
  href: string;
}

const defaultCategories: FoodCategory[] = [
  { id: "pizza", name: "Pizza", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80", href: "/app/food?category=pizza" },
  { id: "biryani", name: "Biryani", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80", href: "/app/food?category=biryani" },
  { id: "burger", name: "Burgers", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80", href: "/app/food?category=burger" },
  { id: "cake", name: "Cakes", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80", href: "/app/food?category=cake" },
  { id: "roll", name: "Rolls", image: "https://images.unsplash.com/photo-1626700051117-518f18965737?w=200&q=80", href: "/app/food?category=roll" },
  { id: "dosa", name: "Dosa", image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=200&q=80", href: "/app/food?category=dosa" },
  { id: "noodles", name: "Noodles", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&q=80", href: "/app/food?category=noodles" },
  { id: "icecream", name: "Ice Cream", image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=200&q=80", href: "/app/food?category=icecream" },
];

interface FoodCategoryGridProps {
  categories?: FoodCategory[];
}

export default function FoodCategoryGrid({ categories = defaultCategories }: FoodCategoryGridProps) {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
      {categories.map((cat, i) => (
        <motion.div
          key={cat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Link
            href={cat.href}
            className="flex flex-col items-center gap-2 w-16 shrink-0 group"
          >
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface-container group-hover:scale-105 transition-transform shadow-sm">
              <BlurImage src={cat.image} alt={cat.name} fill className="w-full h-full" sizes="56px" />
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant group-hover:text-primary transition-colors text-center leading-tight">
              {cat.name}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
