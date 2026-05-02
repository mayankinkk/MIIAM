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
    <div className="bg-[#fff4f4] min-h-screen">
      <header className="bg-[#0b50d5] text-white p-6 pb-12 rounded-b-[3rem] shadow-[0px_20px_40px_rgba(11,80,213,0.2)]">
        <div className="flex justify-between items-center mb-8">
          <span className="text-3xl font-black tracking-tighter">MIIAM</span>
          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${
            rider?.is_online ? "bg-green-500/20 text-green-100 border border-green-400/30" : "bg-slate-500/20 text-slate-100 border border-slate-400/30"
          }`}>
            <span className={`w-2 h-2 rounded-full ${rider?.is_online ? "bg-green-400 animate-pulse" : "bg-slate-400"}`} />
            {rider?.is_online ? "Online" : "Offline"}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white/20 rounded-full border-2 border-white/40 flex items-center justify-center font-bold text-3xl">
            {rider?.profile?.full_name?.[0] || "R"}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">{rider?.profile?.full_name || "Rider"}</h1>
            <p className="text-[#c4d0ff] font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">star</span> 
              {rider?.rating?.toFixed(1) || "4.9"} {rider?.total_deliveries ? `${rider.total_deliveries} deliveries` : ""}
            </p>
          </div>
        </div>
      </header>

      <main className="px-6 -mt-6">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link href="/rider/wallet" className="bg-white rounded-2xl p-6 shadow-lg shadow-[#0b50d5]/5">
            <p className="text-xs font-bold text-[#814c55] uppercase tracking-widest mb-2">Today's Earnings</p>
            <p className="text-3xl font-black text-[#0b50d5]">₹0.00</p>
          </Link>
          <Link href="/rider/orders" className="bg-white rounded-2xl p-6 shadow-lg shadow-[#0b50d5]/5">
            <p className="text-xs font-bold text-[#814c55] uppercase tracking-widest mb-2">Deliveries</p>
            <p className="text-3xl font-black text-[#0b50d5]">0</p>
          </Link>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-extrabold text-[#4d212a] tracking-tight">Available Orders</h2>
          <Link href="/rider/orders" className="text-sm font-bold text-[#0b50d5]">View All</Link>
        </div>
        
        <div className="space-y-4 mb-32">
          {orders && orders.length > 0 ? orders.map((order: any) => (
            <Link 
              key={order.id} 
              href={`/rider/orders`}
              className="bg-white rounded-2xl p-6 shadow-[0px_10px_30px_rgba(77,33,42,0.04)] border border-[#dd9ca6]/10 relative overflow-hidden group block"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#0b50d5]/5 rounded-bl-full" />
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="font-bold text-xl text-[#4d212a]">{order.vendor?.name}</h3>
                  <p className="text-[#814c55] text-sm flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-sm">store</span>
                    Pick up here
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-[#ba001c]">₹{order.total_amount}</p>
                  <p className="text-[10px] font-bold text-[#814c55] uppercase tracking-widest">Est. Earn</p>
                </div>
              </div>
              <div className="flex gap-3 relative z-10">
                <button className="flex-1 bg-[#ffecee] text-[#ba001c] py-3 rounded-xl font-bold hover:bg-[#ba001c] hover:text-white transition-colors">
                  View & Accept
                </button>
              </div>
            </Link>
          )) : (
            <div className="bg-white rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">shopping_bag</span>
              <p className="text-slate-400 mt-2">No orders available right now</p>
              <p className="text-xs text-slate-400 mt-1">Check back soon!</p>
            </div>
          )}
        </div>
      </main>

      {/* Rider Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-4 bg-white/90 backdrop-blur-xl shadow-[0px_-10px_30px_rgba(11,80,213,0.1)] rounded-t-[3rem]">
        <Link href="/rider" className="flex flex-col items-center p-2 text-[#0b50d5]">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
          <span className="text-[10px] font-bold">Map</span>
        </Link>
        <Link href="/rider/orders" className="flex flex-col items-center p-2 text-[#814c55] hover:text-[#0b50d5]">
          <span className="material-symbols-outlined text-3xl">list_alt</span>
          <span className="text-[10px] font-bold">Orders</span>
        </Link>
        <Link href="/rider/wallet" className="flex flex-col items-center p-2 text-[#814c55] hover:text-[#0b50d5]">
          <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
          <span className="text-[10px] font-bold">Earnings</span>
        </Link>
        <Link href="/rider/account" className="flex flex-col items-center p-2 text-[#814c55] hover:text-[#0b50d5]">
          <span className="material-symbols-outlined text-3xl">person</span>
          <span className="text-[10px] font-bold">Account</span>
        </Link>
      </nav>
    </div>
  );
}
