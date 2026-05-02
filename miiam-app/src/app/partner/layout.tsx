import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MIIAM Partner Dashboard",
  description: "Manage your restaurant orders and bookings.",
};

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full z-20 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100 flex items-center justify-center">
          <Link href="/partner" className="text-2xl font-extrabold tracking-tighter text-[#ba001c]">
            MIIAM <span className="text-slate-800 text-sm tracking-normal ml-1">Partner</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/partner" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#ffe1e4] text-[#ba001c] font-bold">
            <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
            Live POS
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors">
            <span className="material-symbols-outlined text-[20px]">restaurant_menu</span>
            Menu & Inventory
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors">
            <span className="material-symbols-outlined text-[20px]">event_seat</span>
            Table Bookings
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition-colors">
            <span className="material-symbols-outlined text-[20px]">analytics</span>
            Analytics
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3 mb-4 border border-slate-200">
            <div className="w-10 h-10 bg-[#ba001c] rounded-full text-white flex items-center justify-center font-bold text-sm">
              TBA
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">The Burger Alchemist</p>
              <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
              </p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Exit Portal
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative">
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20">
          <Link href="/partner" className="text-xl font-extrabold tracking-tighter text-[#ba001c]">
            MIIAM <span className="text-slate-800 text-xs tracking-normal ml-1">Partner</span>
          </Link>
          <button className="text-slate-800">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>
        {children}
      </main>
    </div>
  );
}
