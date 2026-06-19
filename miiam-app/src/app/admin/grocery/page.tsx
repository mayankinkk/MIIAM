"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";


export default function GroceryAdmin() {
  const supabase = useMemo(() => createClient(), []);
  const [stats, setStats] = useState({ totalOrders: 0, revenue: 0, activePartners: 0, totalProducts: 0, lastMonthOrders: 0, lastMonthRevenue: 0, newPartnersThisMonth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("vendor_type", "grocery");

      const { data: ordersData } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("vendor_type", "grocery")
        .gte("placed_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { count: partnersCount } = await supabase
        .from("vendors")
        .select("*", { count: "exact", head: true })
        .eq("type", "grocery")
        .eq("status", "active");

      const { count: productsCount } = await supabase
        .from("grocery_products")
        .select("*", { count: "exact", head: true });

      const totalRevenue = ordersData?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const { count: lastMonthOrdersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("vendor_type", "grocery")
        .gte("placed_at", sixtyDaysAgo)
        .lt("placed_at", thirtyDaysAgo);

      const { data: lastMonthOrdersData } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("vendor_type", "grocery")
        .gte("placed_at", sixtyDaysAgo)
        .lt("placed_at", thirtyDaysAgo);

      const lastMonthRevenue = lastMonthOrdersData?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0;

      const { count: newPartnersCount } = await supabase
        .from("vendors")
        .select("*", { count: "exact", head: true })
        .eq("type", "grocery")
        .gte("created_at", startOfMonth);

      setStats({
        totalOrders: ordersCount || 0,
        revenue: totalRevenue,
        activePartners: partnersCount || 0,
        totalProducts: productsCount || 0,
        lastMonthOrders: lastMonthOrdersCount || 0,
        lastMonthRevenue,
        newPartnersThisMonth: newPartnersCount || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)]">
      <main className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[var(--color-on-surface)]">Grocery Admin</h1>
          <p className="text-[var(--color-outline)] text-sm">Manage your grocery delivery business</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)]">
            <p className="text-[var(--color-outline-variant)] text-sm">Total Orders</p>
            <p className="text-3xl font-black text-[var(--color-on-surface)] mt-1">{loading ? "..." : stats.totalOrders}</p>
            {stats.lastMonthOrders > 0 ? (
              <p className={`text-sm mt-2 ${stats.totalOrders >= stats.lastMonthOrders ? 'text-green-600' : 'text-red-500'}`}>
                {stats.totalOrders >= stats.lastMonthOrders ? '↑' : '↓'} {Math.abs(Math.round(((stats.totalOrders - stats.lastMonthOrders) / stats.lastMonthOrders) * 100))}% from last month
              </p>
            ) : (
              <p className="text-[var(--color-outline-variant)] text-sm mt-2">No prior data</p>
            )}
          </div>
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)]">
            <p className="text-[var(--color-outline-variant)] text-sm">Revenue</p>
            <p className="text-3xl font-black text-[var(--color-on-surface)] mt-1">{loading ? "..." : `₹${(stats.revenue / 100000).toFixed(1)}L`}</p>
            {stats.lastMonthRevenue > 0 ? (
              <p className={`text-sm mt-2 ${stats.revenue >= stats.lastMonthRevenue ? 'text-green-600' : 'text-red-500'}`}>
                {stats.revenue >= stats.lastMonthRevenue ? '↑' : '↓'} {Math.abs(Math.round(((stats.revenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100))}% from last month
              </p>
            ) : (
              <p className="text-[var(--color-outline-variant)] text-sm mt-2">No prior data</p>
            )}
          </div>
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)]">
            <p className="text-[var(--color-outline-variant)] text-sm">Active Partners</p>
            <p className="text-3xl font-black text-[var(--color-on-surface)] mt-1">{loading ? "..." : stats.activePartners}</p>
            <p className="text-green-600 text-sm mt-2">{stats.newPartnersThisMonth > 0 ? `↑ ${stats.newPartnersThisMonth} new this month` : "No new partners"}</p>
          </div>
          <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)]">
            <p className="text-[var(--color-outline-variant)] text-sm">Total Products</p>
            <p className="text-3xl font-black text-[var(--color-on-surface)] mt-1">{loading ? "..." : stats.totalProducts}</p>
            <p className="text-[var(--color-outline-variant)] text-sm mt-2">In inventory</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/grocery/orders" className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)] hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-[var(--color-primary)]">receipt_long</span>
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)]">Orders</h3>
                <p className="text-sm text-[var(--color-outline)]">Manage grocery orders</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-[var(--color-primary)] text-sm font-bold">
              Go to Orders <span className="material-symbols-outlined text-lg ml-1">arrow_forward</span>
            </div>
          </Link>

          <Link href="/admin/grocery/inventory" className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)] hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-blue-600">inventory_2</span>
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)]">Inventory</h3>
                <p className="text-sm text-[var(--color-outline)]">Manage products & stock</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-[var(--color-primary)] text-sm font-bold">
              Go to Inventory <span className="material-symbols-outlined text-lg ml-1">arrow_forward</span>
            </div>
          </Link>

          <Link href="/admin/grocery/partners" className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)] hover:shadow-lg transition-all group">
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