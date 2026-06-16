"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

interface TechnicianTrackerProps {
  orderId: string;
}

export default function TechnicianTracker({ orderId }: TechnicianTrackerProps) {
  const supabase = useMemo(() => createClient(), []);
  const [assigned, setAssigned] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const { data } = await supabase
          .from("rider_locations")
          .select("id")
          .eq("order_id", orderId)
          .limit(1)
          .maybeSingle();
        setAssigned(!!data?.id);
      } catch {
        setAssigned(false);
      }
    }
    check();
  }, [orderId, supabase]);

  if (assigned === null) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-container rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-surface-container rounded w-24 mb-2" />
            <div className="h-3 bg-surface-container rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!assigned) {
    return (
      <div className="bg-surface-container-lowest rounded-2xl p-6 text-center border border-outline-variant/10">
        <span className="material-symbols-outlined text-5xl text-amber-500 mb-3 block">person_off</span>
        <h2 className="text-lg font-bold text-on-surface mb-2">Technician Not Assigned</h2>
        <p className="text-on-surface-variant text-sm">A service technician has not been assigned to your booking yet. You will be notified once one is assigned.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 text-center border border-outline-variant/10">
      <span className="material-symbols-outlined text-5xl text-blue-500 mb-3 block">engineering</span>
      <h2 className="text-lg font-bold text-on-surface mb-2">Technician Assigned</h2>
      <p className="text-on-surface-variant text-sm">Your service technician is on the way.</p>
    </div>
  );
}
