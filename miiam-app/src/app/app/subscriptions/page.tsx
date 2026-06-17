"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface RecurringSchedule {
  id: string;
  vendor_id: string;
  status: string;
  frequency: string;
  day_of_week: number | null;
  day_of_month: number | null;
  delivery_time: string | null;
  delivery_address: string | null;
  payment_method: string | null;
  items: Array<{ menu_item_id: string; name: string; price: number; quantity: number; image_url?: string }>;
  next_delivery_date: string | null;
  last_order_created_at: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}



const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SubscriptionsPage() {
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
  const { t } = useTranslation();
  const frequencyLabels: Record<string, string> = {
    daily: t.checkout.daily,
    weekly: t.checkout.weekly,
    biweekly: "Every 2 weeks",
    monthly: "Monthly",
  };
  const [vendorNames, setVendorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const { addToast } = useToastStore();
  const { confirm } = useConfirm();

  useEffect(() => {
    loadSchedules();
  }, []);

  async function loadSchedules() {
    setLoading(true);
    const { data, error } = await supabase
      .from("recurring_schedules")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load schedules:", error);
      addToast("Failed to load subscriptions", "error");
    } else {
      setSchedules(data || []);
      const ids = [...new Set((data || []).map((s: RecurringSchedule) => s.vendor_id).filter(Boolean))];
      if (ids.length > 0) {
        const { data: vendors } = await supabase.from("vendors").select("id, shop_name").in("id", ids);
        if (vendors) {
          const map: Record<string, string> = {};
          vendors.forEach((v: { id: string; shop_name: string }) => { map[v.id] = v.shop_name; });
          setVendorNames(map);
        }
      }
    }
    setLoading(false);
  }

  async function toggleStatus(schedule: RecurringSchedule) {
    const newStatus = schedule.status === "active" ? "paused" : "active";
    const { error } = await supabase
      .from("recurring_schedules")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", schedule.id);

    if (error) {
      addToast("Failed to update subscription", "error");
    } else {
      addToast(newStatus === "paused" ? "Subscription paused" : "Subscription resumed", "success");
      loadSchedules();
    }
  }

  async function cancelSchedule(id: string) {
    if (!await confirm({ title: "Cancel Subscription", message: "Cancel this recurring subscription?", variant: "danger" })) return;
    const { error } = await supabase
      .from("recurring_schedules")
      .update({ status: "cancelled", end_date: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      addToast("Failed to cancel subscription", "error");
    } else {
      addToast("Subscription cancelled", "info");
      loadSchedules();
    }
  }

  function getFrequencyLabel(s: RecurringSchedule): string {
    const base = frequencyLabels[s.frequency] || s.frequency;
    if ((s.frequency === "weekly" || s.frequency === "biweekly") && s.day_of_week !== null) {
      return `${base} on ${dayNames[s.day_of_week]}`;
    }
    return base;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="bg-surface-container-lowest px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/app/profile" aria-label="Go back" className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-xl font-black text-on-surface">{t.profile.recurringOrders}</h1>
            <p className="text-xs text-on-surface-variant">Manage your scheduled subscriptions</p>
          </div>
        </div>
      </header>

      <main className="px-6 mt-6 max-w-2xl mx-auto">
        {schedules.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">repeat</span>
            <p className="text-on-surface-variant font-semibold mt-4">{t.profile.scheduledSubscriptions}</p>
            <p className="text-xs text-on-surface-variant/60 mt-1">Set up a recurring order during checkout</p>
            <Link
              href="/app/grocery"
              className="inline-block mt-6 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-all"
            >
              {t.common.seeAll}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => {
              const total = schedule.items.reduce((s, i) => s + i.price * i.quantity, 0);
              return (
                <div
                  key={schedule.id}
                  className={`bg-surface-container-lowest rounded-2xl p-5 shadow-sm border-l-4 ${
                    schedule.status === "active"
                      ? "border-green-500"
                      : schedule.status === "paused"
                      ? "border-amber-400"
                      : "border-[var(--color-outline-variant)]"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-extrabold text-on-surface">
                        {vendorNames[schedule.vendor_id] || "Vendor"}
                      </h3>
                      <p className="text-sm text-on-surface-variant">{getFrequencyLabel(schedule)}</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        schedule.status === "active"
                          ? "bg-green-100 text-green-700"
                          : schedule.status === "paused"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {schedule.status}
                    </span>
                  </div>

                  <div className="bg-surface rounded-xl p-3 space-y-2 mb-3">
                    {schedule.items.map((item) => (
                      <div key={item.menu_item_id} className="flex justify-between text-sm">
                        <span className="text-on-surface font-medium">{item.name} × {item.quantity}</span>
                        <span className="text-on-surface font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-outline-variant/20 pt-2 flex justify-between text-sm font-extrabold text-primary">
                      <span>{t.cart.total}</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-on-surface-variant mb-4">
                    {schedule.next_delivery_date && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                        Next: {new Date(schedule.next_delivery_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                    )}
                    {schedule.delivery_time && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {schedule.delivery_time}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {(schedule.status === "active" || schedule.status === "paused") && (
                      <button
                        onClick={() => toggleStatus(schedule)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          schedule.status === "active"
                            ? "bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100"
                            : "bg-green-50 text-green-700 border border-green-300 hover:bg-green-100"
                        }`}
                      >
                        {schedule.status === "active" ? t.common.cancel : t.common.done}
                      </button>
                    )}
                    <button
                      onClick={() => cancelSchedule(schedule.id)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
                    >
{t.common.cancel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
