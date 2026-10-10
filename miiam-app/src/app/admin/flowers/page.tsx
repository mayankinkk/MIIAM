"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";

export default function FlowersAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    activePartners: 0,
    totalItems: 0,
    lastMonthOrders: 0,
    lastMonthRevenue: 0,
    newPartnersThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("vendor_type", "flowers");

      const { data: ordersData } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("vendor_type", "flowers")
        .gte("placed_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { count: partnersCount } = await supabase
        .from("vendors")
        .select("*", { count: "exact", head: true })
        .eq("type", "flowers")
        .eq("status", "active");

      const { count: itemsCount } = await supabase
        .from("flower_items")
        .select("*", { count: "exact", head: true });

      const totalRevenue =
        ordersData?.reduce(
          (sum: number, o: { total_amount?: number | null }) => sum + (o.total_amount || 0),
          0
        ) || 0;

      // Last month data for comparison
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString();

      const { count: lastMonthOrdersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("vendor_type", "flowers")
        .gte("placed_at", sixtyDaysAgo)
        .lt("placed_at", thirtyDaysAgo);

      const { data: lastMonthOrdersData } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("vendor_type", "flowers")
        .gte("placed_at", sixtyDaysAgo)
        .lt("placed_at", thirtyDaysAgo);

      const lastMonthRevenue =
        lastMonthOrdersData?.reduce(
          (sum: number, o: { total_amount?: number | null }) => sum + (o.total_amount || 0),
          0
        ) || 0;

      const { count: newPartnersCount } = await supabase
        .from("vendors")
        .select("*", { count: "exact", head: true })
        .eq("type", "flowers")
        .gte("created_at", startOfMonth);

      setStats({
        totalOrders: ordersCount || 0,
        revenue: totalRevenue,
        activePartners: partnersCount || 0,
        totalItems: itemsCount || 0,
        lastMonthOrders: lastMonthOrdersCount || 0,
        lastMonthRevenue,
        newPartnersThisMonth: newPartnersCount || 0,
      });
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "Error loading stats"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)]">
      <main className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[var(--color-on-surface)]">
            Flowers & Gifts Admin
          </h1>
          <p className="text-sm text-[var(--color-outline)]">
            Manage your flower delivery business
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
            <p className="text-sm text-[var(--color-outline-variant)]">Total Orders</p>
            <p className="mt-1 text-3xl font-black text-[var(--color-on-surface)]">
              {loading ? "..." : stats.totalOrders}
            </p>
            {stats.lastMonthOrders > 0 ? (
              <p
                className={`mt-2 text-sm ${stats.totalOrders >= stats.lastMonthOrders ? "text-green-600" : "text-red-500"}`}
              >
                {stats.totalOrders >= stats.lastMonthOrders ? "↑" : "↓"}{" "}
                {Math.abs(
                  Math.round(
                    ((stats.totalOrders - stats.lastMonthOrders) / stats.lastMonthOrders) * 100
                  )
                )}
                % from last month
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--color-outline-variant)]">No prior data</p>
            )}
          </div>
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
            <p className="text-sm text-[var(--color-outline-variant)]">Revenue</p>
            <p className="mt-1 text-3xl font-black text-[var(--color-on-surface)]">
              {loading ? "..." : `₹${(stats.revenue / 100000).toFixed(1)}L`}
            </p>
            {stats.lastMonthRevenue > 0 ? (
              <p
                className={`mt-2 text-sm ${stats.revenue >= stats.lastMonthRevenue ? "text-green-600" : "text-red-500"}`}
              >
                {stats.revenue >= stats.lastMonthRevenue ? "↑" : "↓"}{" "}
                {Math.abs(
                  Math.round(
                    ((stats.revenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100
                  )
                )}
                % from last month
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--color-outline-variant)]">No prior data</p>
            )}
          </div>
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
            <p className="text-sm text-[var(--color-outline-variant)]">Active Partners</p>
            <p className="mt-1 text-3xl font-black text-[var(--color-on-surface)]">
              {loading ? "..." : stats.activePartners}
            </p>
            <p className="mt-2 text-sm text-green-600">
              {stats.newPartnersThisMonth > 0
                ? `↑ ${stats.newPartnersThisMonth} new this month`
                : "No new partners"}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
            <p className="text-sm text-[var(--color-outline-variant)]">Total Items</p>
            <p className="mt-1 text-3xl font-black text-[var(--color-on-surface)]">
              {loading ? "..." : stats.totalItems}
            </p>
            <p className="mt-2 text-sm text-[var(--color-outline-variant)]">In catalog</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Link
            href="/admin/flowers/orders"
            className="group rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 transition-all hover:border-[var(--color-primary)] hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
                <span className="material-symbols-outlined text-2xl text-[var(--color-primary)]">
                  receipt_long
                </span>
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)]">
                  Orders
                </h3>
                <p className="text-sm text-[var(--color-outline)]">Manage flower orders</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-[var(--color-primary)]">
              Go to Orders{" "}
              <span className="material-symbols-outlined ml-1 text-lg">arrow_forward</span>
            </div>
          </Link>

          <Link
            href="/admin/flowers/items"
            className="group rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 transition-all hover:border-[var(--color-primary)] hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="bg-accent/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <span className="material-symbols-outlined text-accent text-2xl">
                  local_florist
                </span>
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)]">
                  Items
                </h3>
                <p className="text-sm text-[var(--color-outline)]">Manage flower products</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-[var(--color-primary)]">
              Go to Items{" "}
              <span className="material-symbols-outlined ml-1 text-lg">arrow_forward</span>
            </div>
          </Link>

          <Link
            href="/admin/flowers/partners"
            className="group rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 transition-all hover:border-[var(--color-primary)] hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <span className="material-symbols-outlined text-2xl text-green-600">store</span>
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)]">
                  Partners
                </h3>
                <p className="text-sm text-[var(--color-outline)]">Manage store partners</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-[var(--color-primary)]">
              Go to Partners{" "}
              <span className="material-symbols-outlined ml-1 text-lg">arrow_forward</span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
