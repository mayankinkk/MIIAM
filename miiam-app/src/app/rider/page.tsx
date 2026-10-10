import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Rider Dashboard | MIIAM" };

export default async function RiderDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/rider/login");
  }

  const { data: rider } = await supabase
    .from("riders")
    .select("*, profile:profiles(*)")
    .eq("user_id", user.id)
    .single();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, vendor:vendors(*)")
    .eq("status", "preparing")
    .limit(5);

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
      <header className="rounded-b-[3rem] bg-[var(--color-secondary)] p-6 pb-12 text-white shadow-[0px_20px_40px_rgba(11,80,213,0.2)]">
        <div className="mb-8 flex items-center justify-between">
          <span className="text-3xl font-black tracking-tighter">MIIAM</span>
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
              rider?.is_online
                ? "border border-green-400/30 bg-green-500/20 text-green-100"
                : "bg-[var(--color-surface-subtle)]0/20 border border-slate-400/30 text-slate-100"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${rider?.is_online ? "animate-pulse bg-green-400" : "bg-slate-400"}`}
            />
            {rider?.is_online ? "Online" : "Offline"}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/40 bg-[var(--color-surface-container-lowest)]/20 text-3xl font-bold">
            {rider?.profile?.full_name?.[0] || "R"}
          </div>
          <div>
            <h1 className="mb-1 text-3xl font-bold tracking-tight">
              {rider?.profile?.full_name || "Rider"}
            </h1>
            <p className="text-secondary-container flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-sm">star</span>
              {rider?.rating?.toFixed(1) || "5.0"}{" "}
              {rider?.total_deliveries ? `${rider.total_deliveries} deliveries` : ""}
            </p>
          </div>
        </div>
      </header>

      <main className="-mt-6 px-6">
        <div className="mb-8 grid grid-cols-2 gap-4">
          <Link
            href="/rider/wallet"
            className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-[var(--color-secondary)]/5 shadow-lg"
          >
            <p className="mb-2 text-xs font-bold tracking-widest text-[var(--color-on-surface-variant)] uppercase">
              Today's Earnings
            </p>
            <p className="text-3xl font-black text-[var(--color-secondary)]">₹0.00</p>
          </Link>
          <Link
            href="/rider/orders"
            className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-[var(--color-secondary)]/5 shadow-lg"
          >
            <p className="mb-2 text-xs font-bold tracking-widest text-[var(--color-on-surface-variant)] uppercase">
              Deliveries
            </p>
            <p className="text-3xl font-black text-[var(--color-secondary)]">0</p>
          </Link>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Available Orders
          </h2>
          <Link href="/rider/orders" className="text-sm font-bold text-[var(--color-secondary)]">
            View All
          </Link>
        </div>

        <div className="mb-32 space-y-4">
          {orders && orders.length > 0 ? (
            orders.map(
              (order: { id: string; total_amount: number; vendor?: { name?: string } }) => (
                <div
                  key={order.id}
                  className="relative overflow-hidden rounded-2xl border border-[var(--color-outline-variant)]/10 bg-[var(--color-surface-container-lowest)] p-6 shadow-[0px_10px_30px_rgba(77,33,42,0.04)]"
                >
                  <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-[var(--color-secondary)]/5" />
                  <div className="relative z-10 mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[var(--color-on-surface)]">
                        {String(
                          (order.vendor as Record<string, unknown>)?.shop_name ||
                            order.vendor?.name ||
                            "Order"
                        )}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-[var(--color-on-surface-variant)]">
                        <span className="material-symbols-outlined text-sm">store</span>
                        Pick up here
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-[var(--color-primary)]">
                        ₹{order.total_amount}
                      </p>
                      <p className="text-[10px] font-bold tracking-widest text-[var(--color-on-surface-variant)] uppercase">
                        Est. Earn
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10 flex gap-3">
                    <Link
                      href="/rider/orders"
                      className="hover:text-on-primary block flex-1 rounded-xl bg-[var(--color-surface-container-low)] py-3 text-center font-bold text-[var(--color-primary)] no-underline transition-colors hover:bg-[var(--color-primary)]"
                    >
                      View & Accept
                    </Link>
                  </div>
                </div>
              )
            )
          ) : (
            <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-[var(--color-outline-variant)]/60">
                shopping_bag
              </span>
              <p className="mt-2 text-[var(--color-outline-variant)]">
                No orders available right now
              </p>
              <p className="mt-1 text-xs text-[var(--color-outline-variant)]">Check back soon!</p>
            </div>
          )}
        </div>
      </main>

      {/* Rider Bottom Nav */}
    </div>
  );
}
