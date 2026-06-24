"use client";

import { createClient } from "@/lib/supabase/client";
import { getVendorMenuTable } from "@/lib/vendor";
import type { Order } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useCartStore } from "@/lib/store/cartStore";
import { useToastStore } from "@/lib/store/toastStore";
import { OrderSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import PullToRefresh from "@/components/PullToRefresh";
import { PRINTING_VENDOR_ID } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/useTranslation";
import logger from "@/lib/logger";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  accepted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  preparing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  picking_up: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  on_the_way: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  arrived: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function OrdersPage() {
  const { t } = useTranslation();
  const [reordering, setReordering] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // assume true until proven otherwise
  const router = useRouter();
  const { addItem } = useCartStore();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`orders-list-${userId}`)
      .on('postgres_changes', {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${userId}`,
      }, (payload: { eventType: string; new?: Record<string, unknown>; old?: Record<string, unknown> }) => {
        if (payload.eventType === 'UPDATE' && payload.new) {
          const updated = payload.new as { id: string };
          setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...payload.new } : o));
        } else if (payload.eventType === 'INSERT' && payload.new) {
          // Re-fetch to get full order with vendor details
          fetchOrders();
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const deleted = payload.old as { id: string };
          setOrders(prev => prev.filter(o => o.id !== deleted.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchOrders = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      setIsAuthenticated(true);
      setUserId(authUser.id);

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, user_id, vendor_id, status, total_amount, delivery_fee, discount_amount, placed_at, delivered_at")
        .eq("user_id", authUser.id)
        .order("placed_at", { ascending: false });

      if (ordersError) {
        logger.error({ err: ordersError }, "Fetch orders error");
        addToast(t.orders.loadFailed, "error");
        throw ordersError;
      }
      
      // Fetch vendors separately
      if (ordersData && ordersData.length > 0) {
        const vendorIds = [...new Set(ordersData.map((o: { vendor_id: string }) => o.vendor_id).filter(Boolean))];
        const { data: vendorsData } = await supabase
          .from("vendors")
          .select("id, shop_name, cover_image_url")
          .in("id", vendorIds);
        
        const vendorMap = new Map(vendorsData?.map((v: { id: string; shop_name: string; cover_image_url: string | null }) => [v.id, v]) || []);
        const ordersWithVendors = ordersData.map((order: Order) => ({
          ...order,
          vendor: vendorMap.get(order.vendor_id) || null
        }));
        setOrders(ordersWithVendors);
      } else {
        setOrders([]);
      }
    } catch (error: unknown) {
      logger.error({ err: error }, "Error fetching orders");
      addToast(t.orders.loadFailed, "error");
    } finally {
      setLoading(false);
    }
  };


  const handleReorder = async (order: Order) => {
    setReordering(order.id);
    try {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("id, order_id, menu_item_id, name, quantity, unit_price, price")
        .eq("order_id", order.id);

      if (orderItems && orderItems.length > 0) {
        const table = await getVendorMenuTable(order.vendor_id);
        const ids = orderItems.map((i: { menu_item_id: string }) => i.menu_item_id);
        const { data: menuItems } = await supabase
          .from(table)
          .select("id, name, image_url")
          .in("id", ids);

        const menuMap = new Map<string, { name: string; image_url?: string }>();
        if (menuItems) {
          menuItems.forEach((mi: { id: string; name: string; image_url?: string }) => menuMap.set(mi.id, mi));
        }

        for (const item of orderItems) {
          const mi = menuMap.get(item.menu_item_id);
          for (let i = 0; i < item.quantity; i++) {
            addItem({
              id: item.menu_item_id,
              menu_item_id: item.menu_item_id,
              vendor_id: order.vendor_id,
              vendor_name: order.vendor?.shop_name || "Vendor",
              name: mi?.name || "Item",
              price: item.unit_price,
              image_url: mi?.image_url || undefined,
            });
          }
        }
        router.push("/app/cart");
      }
    } catch (error) {
      logger.error({ err: error }, "Reorder failed");
      addToast("Failed to reorder. Please try again.", "error");
    } finally {
      setReordering(null);
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-surface/80 dark:bg-[var(--color-surface)]/80 backdrop-blur-2xl shadow-sm">
        <span className="text-2xl font-extrabold tracking-tighter text-primary">MIIAM</span>
      </header>
      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'My Orders' }]} />
      <PullToRefresh onRefresh={async () => {
        await fetchOrders();
      }}>
      <main className="pt-24 pb-24 px-6 max-w-4xl mx-auto bg-background dark:bg-[var(--color-surface)] text-on-background dark:text-[var(--color-on-surface)]">
        <section className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight leading-none mb-2 text-on-surface dark:text-[var(--color-on-surface)]">{t.orders.title}</h1>
          <p className="text-on-surface-variant dark:text-[var(--color-outline)] text-lg">{t.orders.subtitle}</p>
        </section>

        {loading ? (
          <div className="space-y-4">
            <OrderSkeleton />
            <OrderSkeleton />
            <OrderSkeleton />
          </div>
        ) : !isAuthenticated ? (
          <div className="py-12">
            <EmptyState 
              icon="person_off" 
              title={t.orders.loginRequired}
              description={t.orders.loginRequiredDesc}
              actionLabel={t.orders.goToLogin} 
              actionHref="/auth/login" 
            />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12">
            <EmptyState 
              icon="local_shipping" 
              title={t.orders.noOrders}
              description={t.orders.noOrdersDesc}
              actionLabel={t.orders.startOrdering} 
              actionHref="/app/explore" 
            />
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-surface-container-lowest dark:bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-sm overflow-hidden">
                <Link href={`/app/orders/${order.id}`} className="block p-6 hover:bg-surface-container-low/30 dark:hover:bg-[var(--color-surface-container)]/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${order.vendor_id === PRINTING_VENDOR_ID ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-surface-container dark:bg-[var(--color-surface-container)]"}`}>
                      {order.vendor?.cover_image_url ? (
                        <BlurImage src={order.vendor.cover_image_url} alt={order.vendor.shop_name} fill className="w-full h-full" sizes="(max-width: 768px) 50vw, 25vw" />
                      ) : (
                        <span className={`material-symbols-outlined text-3xl ${order.vendor_id === PRINTING_VENDOR_ID ? "text-indigo-600" : "text-outline-variant"}`}>
                          {order.vendor_id === PRINTING_VENDOR_ID ? "print" : "restaurant"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-on-surface dark:text-[var(--color-on-surface)]">{order.vendor?.shop_name ?? "Order"}</h3>
                          <p className="text-xs text-on-surface-variant dark:text-[var(--color-outline)]">
                            {new Date(order.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${statusColors[order.status] ?? "bg-surface-container text-primary"}`}>
                            {order.status.replace(/_/g, " ")}
                          </span>
                          <p className="font-bold text-on-surface dark:text-[var(--color-on-surface)] mt-2">₹{order.total_amount.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant dark:text-[var(--color-outline)]">chevron_right</span>
                  </div>
                </Link>
                {order.status === "delivered" && (
                  <div className="border-t border-outline-variant/20 dark:border-t-[var(--color-border-subtle)]/20 px-6 py-4 flex gap-3">
                    <button
                      onClick={() => handleReorder(order)}
                      disabled={reordering === order.id}
                      className="flex-1 bg-primary text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      {reordering === order.id ? t.orders.adding : t.cart.reorder}
                    </button>
                    <Link
                      href={`/app/orders/${order.id}/rating`}
                      className="flex-1 bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container-lowest)] border border-outline-variant/30 dark:border-[var(--color-border-subtle)]/30 text-on-surface dark:text-[var(--color-on-surface)] py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:border-primary"
                    >
                      <span className="material-symbols-outlined text-sm">star</span>
                      {t.orders.rate}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      </PullToRefresh>
    </>
  );
}