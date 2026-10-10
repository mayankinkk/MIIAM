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
import { EmptyState } from "@/components/ui/EmptyStates";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import PullToRefresh from "@/components/PullToRefresh";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { fetchGuestOrders, guestOrderRefs } from "@/lib/guestOrders";
import logger from "@/lib/logger";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  accepted: "bg-deal/10 text-deal dark:bg-deal/20 dark:text-deal",
  preparing: "bg-deal/10 text-deal dark:bg-deal/20 dark:text-deal",
  picking_up: "bg-deal/10 text-deal dark:bg-deal/20 dark:text-deal",
  on_the_way: "bg-deal/10 text-deal dark:bg-deal/20 dark:text-deal",
  arrived: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function OrdersPage() {
  const { t } = useTranslation();
  const [reordering, setReordering] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { addItem } = useCartStore();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const { addToast } = useToastStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "delivered" | "cancelled">(
    "all"
  );

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`orders-list-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${userId}`,
        },
        (payload: {
          eventType: string;
          new?: Record<string, unknown>;
          old?: Record<string, unknown>;
        }) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            const updated = payload.new as { id: string };
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? { ...o, ...payload.new } : o))
            );
          } else if (payload.eventType === "INSERT" && payload.new) {
            // Re-fetch to get full order with vendor details
            fetchOrders();
          } else if (payload.eventType === "DELETE" && payload.old) {
            const deleted = payload.old as { id: string };
            setOrders((prev) => prev.filter((o) => o.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchOrders = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        // No account: show the orders this device placed (matched by phone).
        const refs = guestOrderRefs();
        if (refs.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }
        const guestOrders = await fetchGuestOrders(refs);
        setOrders(
          guestOrders.map((o) => ({
            ...(o as unknown as Order),
            vendor: (o as { vendor?: Order["vendor"] }).vendor ?? null,
          }))
        );
        setLoading(false);
        return;
      }
      setUserId(authUser.id);

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          "id, user_id, vendor_id, status, total_amount, delivery_fee, discount_amount, placed_at, delivered_at"
        )
        .eq("user_id", authUser.id)
        .order("placed_at", { ascending: false });

      if (ordersError) {
        logger.error({ err: ordersError }, "Fetch orders error");
        addToast(t.orders.loadFailed, "error");
        throw ordersError;
      }

      // Fetch vendors separately
      if (ordersData && ordersData.length > 0) {
        const vendorIds = [
          ...new Set(ordersData.map((o: { vendor_id: string }) => o.vendor_id).filter(Boolean)),
        ];
        const { data: vendorsData } = await supabase
          .from("vendors")
          .select("id, shop_name, cover_image_url")
          .in("id", vendorIds);

        const vendorMap = new Map(
          vendorsData?.map(
            (v: { id: string; shop_name: string; cover_image_url: string | null }) => [v.id, v]
          ) || []
        );
        const ordersWithVendors = ordersData.map((order: Order) => ({
          ...order,
          vendor: vendorMap.get(order.vendor_id) || null,
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
      type ReorderItem = {
        menu_item_id: string;
        name: string;
        quantity: number;
        unit_price: number;
      };
      // Guest orders already carry their items (anon clients can't read
      // order_items), signed-in orders are read from the database.
      let orderItems: ReorderItem[] = ((order.items as ReorderItem[] | undefined) || []).slice();
      if (orderItems.length === 0) {
        const { data } = await supabase
          .from("order_items")
          .select("id, order_id, menu_item_id, name, quantity, unit_price, price")
          .eq("order_id", order.id);
        orderItems = (data as ReorderItem[] | null) || [];
      }

      if (orderItems && orderItems.length > 0) {
        const table = await getVendorMenuTable(order.vendor_id);
        const ids = orderItems.map((i: { menu_item_id: string }) => i.menu_item_id);
        const { data: menuItems } = await supabase
          .from(table)
          .select("id, name, image_url")
          .in("id", ids);

        const menuMap = new Map<string, { name: string; image_url?: string }>();
        if (menuItems) {
          menuItems.forEach((mi: { id: string; name: string; image_url?: string }) =>
            menuMap.set(mi.id, mi)
          );
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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchQuery ||
      order.vendor?.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" &&
        ["pending", "accepted", "preparing", "picking_up", "on_the_way", "arrived"].includes(
          order.status
        )) ||
      (statusFilter === "delivered" && order.status === "delivered") ||
      (statusFilter === "cancelled" && order.status === "cancelled");
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <header className="bg-surface/80 fixed top-0 z-50 flex w-full items-center justify-between px-6 py-4 shadow-sm backdrop-blur-2xl dark:bg-[var(--color-surface)]/80">
        <span className="text-accent text-2xl font-extrabold tracking-tighter">MIIAM</span>
      </header>
      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "My Orders" }]} />
      <PullToRefresh
        onRefresh={async () => {
          await fetchOrders();
        }}
      >
        <main className="bg-background text-on-background mx-auto max-w-4xl px-6 pt-24 pb-24 dark:bg-[var(--color-surface)] dark:text-[var(--color-on-surface)]">
          <section className="mb-10">
            <h1 className="text-on-surface mb-2 text-3xl leading-none font-extrabold tracking-tight dark:text-[var(--color-on-surface)]">
              {t.orders.title}
            </h1>
            <p className="text-on-surface-variant text-lg dark:text-[var(--color-outline)]">
              {t.orders.subtitle}
            </p>
          </section>

          {!loading && orders.length > 0 && (
            <div className="mb-6 space-y-3">
              {/* Search */}
              <div className="relative">
                <span className="material-symbols-outlined text-on-surface-variant absolute top-1/2 left-4 -translate-y-1/2 text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by restaurant or order ID..."
                  className="bg-surface-container border-outline-variant/20 focus:border-primary w-full rounded-2xl border py-3 pr-4 pl-12 text-sm outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">
                      close
                    </span>
                  </button>
                )}
              </div>
              {/* Status Filter Chips */}
              <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
                {(
                  [
                    { key: "all", label: "All", icon: "receipt_long" },
                    { key: "active", label: "Active", icon: "pending" },
                    { key: "delivered", label: "Delivered", icon: "check_circle" },
                    { key: "cancelled", label: "Cancelled", icon: "cancel" },
                  ] as const
                ).map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => setStatusFilter(chip.key)}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                      statusFilter === chip.key
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container text-on-surface-variant border-outline-variant/20 border"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{chip.icon}</span>
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <OrderSkeleton />
              <OrderSkeleton />
              <OrderSkeleton />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon="search_off"
                title="No orders found"
                description={
                  searchQuery
                    ? `No orders matching "${searchQuery}"`
                    : "Orders you place from this device will show up here."
                }
                actionLabel={searchQuery ? "Clear search" : t.orders.startOrdering}
                actionHref={searchQuery ? "/app/orders" : "/app/home"}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-surface-container-lowest overflow-hidden rounded-2xl shadow-sm dark:bg-[var(--color-surface-container-lowest)]"
                >
                  <Link
                    href={`/app/orders/${order.id}`}
                    className="hover:bg-surface-container-low/30 block p-6 transition-all dark:hover:bg-[var(--color-surface-container)]/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-surface-container flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl dark:bg-[var(--color-surface-container)]">
                        {order.vendor?.cover_image_url ? (
                          <BlurImage
                            src={order.vendor.cover_image_url}
                            alt={order.vendor.shop_name}
                            fill
                            className="h-full w-full"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-outline-variant text-3xl">
                            restaurant
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-on-surface font-bold dark:text-[var(--color-on-surface)]">
                              {order.vendor?.shop_name ?? "Order"}
                            </h3>
                            <p className="text-on-surface-variant text-xs dark:text-[var(--color-outline)]">
                              {new Date(order.placed_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase ${statusColors[order.status] ?? "bg-surface-container text-accent"}`}
                            >
                              {order.status.replace(/_/g, " ")}
                            </span>
                            <p className="text-on-surface mt-2 font-bold dark:text-[var(--color-on-surface)]">
                              ₹{order.total_amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant dark:text-[var(--color-outline)]">
                        chevron_right
                      </span>
                    </div>
                  </Link>
                  {order.status === "delivered" && (
                    <div className="border-outline-variant/20 flex gap-3 border-t px-6 py-4 dark:border-t-[var(--color-border-subtle)]/20">
                      <button
                        onClick={() => handleReorder(order)}
                        disabled={reordering === order.id}
                        className="bg-primary text-on-primary flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold hover:opacity-90 disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        {reordering === order.id ? t.orders.adding : t.cart.reorder}
                      </button>
                      <Link
                        href={`/app/orders/${order.id}/rating`}
                        className="border-outline-variant/30 text-on-surface hover:border-primary flex flex-1 items-center justify-center gap-2 rounded-lg border bg-[var(--color-surface-container-lowest)] py-3 text-sm font-bold dark:border-[var(--color-border-subtle)]/30 dark:bg-[var(--color-surface-container-lowest)] dark:text-[var(--color-on-surface)]"
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
