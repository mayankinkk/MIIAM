"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";

export default function AdminHeader() {
  const pathname = usePathname();
  
  // Format pathname to breadcrumb (e.g., /admin/riders/earnings -> Riders / Earnings)
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .filter(s => s !== 'admin')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1));

  const currentPage = segments.length > 0 ? segments[segments.length - 1] : "Dashboard";

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex items-center justify-between z-10">
      <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
        <span>Pages</span>
        <span>/</span>
        <span className="text-slate-800">{currentPage}</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
          <input type="text" placeholder="Global Search..." className="bg-slate-50 border border-slate-100 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ba001c]/10 w-64" />
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden relative">
           <Image 
             src={`https://ui-avatars.com/api/?name=Admin+Staff&background=ba001c&color=fff`} 
             alt="Admin" 
             fill
             className="object-cover"
           />
        </div>
      </div>
    </header>
  );
}
