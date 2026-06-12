"use client";

import dynamic from "next/dynamic";
import { HomeSkeleton } from "@/components/Skeleton";

const HomeContent = dynamic(() => import("./HomeContent"), {
  loading: () => <HomeSkeleton />,
  ssr: false,
});

export default function HomePage() {
  return <HomeContent />;
}
