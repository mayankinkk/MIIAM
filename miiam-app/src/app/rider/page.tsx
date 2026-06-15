import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Rider Dashboard | MIIAM" };

export default async function RiderDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
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
    <div className="bg-[var(--color-surface-container-lowest)] min-h-screen">
      <header className="bg-[var(--color-secondary)] text-white p-6 pb-12 rounded-b-[3rem] shadow-[0px_20px_40px_rgba(11,80,213,0.2)]">
        <div className="flex justify-between items-center mb-8">
          <span className="text-3xl font-black tracking-tighter">MIIAM</span>
          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${
            rider?.is_online ? "bg-green-500/20 text-green-100 border border-green-400/30" : "bg-[var(--color-surface-subtle)]0/20 text-slate-100 border border-slate-400/30"
          }`}>
            <span className={`w-2 h-2 rounded-full ${rider?.is_online ? "bg-green-400 animate-pulse" : "bg-slate-400"}`} />
            {rider?.is_online ? "Online" : "Offline"}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-[var(--color-surface-container-lowest)]/20 rounded-full border-2 border-white/40 flex items-center justify-center font-bold text-3xl">
            {rider?.profile?.full_name?.[0] || "R"}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">{rider?.profile?.full_name || "Rider"}</h1>
            <p className="text-[#c4d0ff] font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">star</span> 
              {rider?.rating?.toFixed(1) || "5.0"} {rider?.total_deliveries ? `${rider.total_deliveries} deliveries` : ""}
            </p>
          </div>
        </div>
      </header>

      <main className="px-6 -mt-6">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link href="/rider/wallet" className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-lg shadow-[var(--color-secondary)]/5">
            <p className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-2">Today's Earnings</p>
            <p className="text-3xl font-black text-[var(--color-secondary)]">₹0.00</p>
          </Link>
          <Link href="/rider/orders" className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-lg shadow-[var(--color-secondary)]/5">
            <p className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-2">Deliveries</p>
            <p className="text-3xl font-black text-[var(--color-secondary)]">0</p>
          </Link>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-extrabold text-[var(--color-on-surface)] tracking-tight">Available Orders</h2>
          <Link href="/rider/orders" className="text-sm font-bold text-[var(--color-secondary)]">View All</Link>
        </div>
        
        <div className="space-y-4 mb-32">
          {orders && orders.length > 0 ? orders.map((order: any) => (
            <div
              key={order.id}
              className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-[0px_10px_30px_rgba(77,33,42,0.04)] border border-[var(--color-outline-variant)]/10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-secondary)]/5 rounded-bl-full" />
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="font-bold text-xl text-[var(--color-on-surface)]">{order.vendor?.name}</h3>
                  <p className="text-[var(--color-on-surface-variant)] text-sm flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-sm">store</span>
                    Pick up here
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-[var(--color-primary)]">₹{order.total_amount}</p>
                  <p className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest">Est. Earn</p>
                </div>
              </div>
              <div className="flex gap-3 relative z-10">
                <Link
                  href="/rider/orders"
                  className="flex-1 bg-[var(--color-surface-container-low)] text-[var(--color-primary)] py-3 rounded-xl font-bold text-center hover:bg-[var(--color-primary)] hover:text-white transition-colors no-underline block"
                >
                  View & Accept
                </Link>
              </div>
            </div>
          )) : (
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-[var(--color-outline-variant)]/60">shopping_bag</span>
              <p className="text-[var(--color-outline-variant)] mt-2">No orders available right now</p>
              <p className="text-xs text-[var(--color-outline-variant)] mt-1">Check back soon!</p>
            </div>
          )}
        </div>
      </main>

      {/* Rider Bottom Nav */}

    </div>
  );
}
