"use client";

import dynamic from "next/dynamic";
import { FoodSkeleton } from "@/components/Skeleton";

const FoodContent = dynamic(() => import("./FoodContent"), {
  loading: () => <FoodSkeleton />,
  ssr: false,
});

export default function FoodPage() {
  return <FoodContent />;
}
