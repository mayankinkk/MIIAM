"use client";

import dynamic from "next/dynamic";
import { RiderDashboardSkeleton } from "@/components/Skeleton";

const DashboardContent = dynamic(() => import("./DashboardContent"), {
  loading: () => <RiderDashboardSkeleton />,
  ssr: false,
});

export default function RiderDashboardPage() {
  return <DashboardContent />;
}
