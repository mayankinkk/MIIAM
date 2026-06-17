"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const supabase = useMemo(() => createClient(), []);

export default function PharmacyAdmin() {
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0, activePartners: 0, totalMedicines: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("vendor_type", "pharmacy");

      const { data: ordersData } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("vendor_type", "pharmacy")
        .gte("placed_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { count: partnersCount } = await supabase
        .from("vendors")
        .select("*", { count: "exact", head: true })
        .eq("type", "pharmacy")
        .eq("status", "active");

      const { count: medicinesCount } = await supabase
        .from("pharmacy_medicines")
        .select("*", { count: "exact", head: true });

      const totalRevenue = ordersData?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0;

      setStats({
        totalOrders: ordersCount || 0,
        revenue: totalRevenue,
        activePartners: partnersCount || 0,
        totalMedicines: medicinesCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)]">
      <main className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[var(--color-on-surface)]">Pharmacy Admin</h1>
          <p className="text-[var(--color-outline)] text-sm">Manage your pharmacy delivery business</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)]">
            <p className="text-[var(--color-outline-variant)] text-sm">Total Orders</p>
            <p className="text-3xl font-black text-[var(--color-on-surface)] mt-1">{loading ? "..." : stats.totalOrders}</p>
            <p className="text-green-600 text-sm mt-2">↑ 15% from last month</p>
          </div>
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)]">
            <p className="text-[var(--color-outline-variant)] text-sm">Revenue</p>
            <p className="text-3xl font-black text-[var(--color-on-surface)] mt-1">{loading ? "..." : `₹${(stats.revenue / 100000).toFixed(1)}L`}</p>
            <p className="text-green-600 text-sm mt-2">↑ 18% from last month</p>
          </div>
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)]">
            <p className="text-[var(--color-outline-variant)] text-sm">Active Partners</p>
            <p className="text-3xl font-black text-[var(--color-on-surface)] mt-1">{loading ? "..." : stats.activePartners}</p>
            <p className="text-green-600 text-sm mt-2">↑ 2 new this month</p>
          </div>
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)]">
            <p className="text-[var(--color-outline-variant)] text-sm">Total Medicines</p>
            <p className="text-3xl font-black text-[var(--color-on-surface)] mt-1">{loading ? "..." : stats.totalMedicines}</p>
            <p className="text-green-600 text-sm mt-2">In inventory</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/pharmacy/orders" className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)] hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-[var(--color-primary)]">receipt_long</span>
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)]">Orders</h3>
                <p className="text-sm text-[var(--color-outline)]">Manage pharmacy orders</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-[var(--color-primary)] text-sm font-bold">
              Go to Orders <span className="material-symbols-outlined text-lg ml-1">arrow_forward</span>
            </div>
          </Link>

          <Link href="/admin/pharmacy/medicines" className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)] hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-blue-600">medication</span>
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)]">Medicines</h3>
                <p className="text-sm text-[var(--color-outline)]">Manage medicine inventory</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-[var(--color-primary)] text-sm font-bold">
              Go to Medicines <span className="material-symbols-outlined text-lg ml-1">arrow_forward</span>
            </div>
          </Link>

          <Link href="/admin/pharmacy/partners" className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)] hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-green-600">store</span>
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)]">Partners</h3>
                <p className="text-sm text-[var(--color-outline)]">Manage store partners</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-[var(--color-primary)] text-sm font-bold">
              Go to Partners <span className="material-symbols-outlined text-lg ml-1">arrow_forward</span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}