"use client";

import Link from "next/link";
import { useDiningStore } from "@/lib/store/diningStore";

export default function BookingsPage() {
  const { bookings, cancelBooking } = useDiningStore();

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-32">
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-[#fff4f4]/80 backdrop-blur-2xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
        <div className="flex items-center gap-4">
          <Link href="/app/profile" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ffe1e4] transition-all">
            <span className="material-symbols-outlined text-[#ba001c]">arrow_back</span>
          </Link>
          <span className="text-2xl font-extrabold tracking-tighter text-[#ba001c]">MIIAM</span>
        </div>
        <span className="text-slate-800 font-bold hidden md:block">Table Bookings</span>
      </nav>

      <main className="pt-24 max-w-4xl mx-auto px-6">
        <section className="mb-10">
          <h1 className="text-[3.5rem] font-extrabold tracking-tight leading-none mb-2 text-[#4d212a]">Table Bookings</h1>
          <p className="text-[#814c55] text-lg">Manage your upcoming dining experiences.</p>
        </section>

        {bookings.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-8xl mb-6">🍽️</div>
            <h2 className="text-2xl font-bold text-[#4d212a] mb-3">No table bookings yet</h2>
            <p className="text-[#814c55] mb-8">Reserve a table at your favourite restaurants.</p>
            <Link href="/app/explore" className="bg-[#0b50d5] text-white px-10 py-4 rounded-xl font-bold inline-block hover:bg-[#003dac] transition-colors shadow-lg shadow-[#0b50d5]/30">
              Explore Restaurants
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const d = new Date(booking.date);
              const isPast = booking.status === 'confirmed' && d < new Date() && booking.time < new Date().toTimeString().substring(0, 5); // simplified check

              return (
                <div key={booking.id} className="bg-white rounded-2xl p-6 shadow-sm border border-[#dd9ca6]/10 relative overflow-hidden">
                  {booking.status === 'cancelled' && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#ba001c]/5 rounded-bl-full" />
                  )}
                  {booking.status === 'confirmed' && !isPast && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#0b50d5]/5 rounded-bl-full" />
                  )}
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-[#ffe1e4] flex items-center justify-center text-[#ba001c] shadow-sm">
                        <span className="material-symbols-outlined text-2xl">restaurant</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-[#4d212a]">{booking.vendorName}</h3>
                        <p className="text-[#814c55] text-sm font-medium mt-1">Booking ID: {booking.id.split('_')[2].toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {booking.status === 'cancelled' ? (
                        <span className="bg-[#f95630]/10 text-[#b02500] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
                          Cancelled
                        </span>
                      ) : (
                        <span className="bg-[#cce4ff] text-[#003dac] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
                          Confirmed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                    <div className="bg-[#fff4f4] p-4 rounded-xl border border-[#ba001c]/10">
                      <span className="material-symbols-outlined text-[#814c55] mb-2">calendar_today</span>
                      <p className="text-[#4d212a] font-bold">{d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="bg-[#fff4f4] p-4 rounded-xl border border-[#ba001c]/10">
                      <span className="material-symbols-outlined text-[#814c55] mb-2">schedule</span>
                      <p className="text-[#4d212a] font-bold">{booking.time}</p>
                    </div>
                    <div className="bg-[#fff4f4] p-4 rounded-xl border border-[#ba001c]/10">
                      <span className="material-symbols-outlined text-[#814c55] mb-2">group</span>
                      <p className="text-[#4d212a] font-bold">{booking.guests} Guests</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2 bg-[#dcfce7] text-[#166534] px-4 py-2 rounded-lg text-sm font-bold">
                      <span className="material-symbols-outlined text-[18px]">local_activity</span>
                      MIIAM Dine-out: 15% off applied
                    </div>
                    {booking.status === 'confirmed' && (
                      <div className="flex gap-3">
                        <Link href={`/app/vendor/${booking.vendorId}`} className="text-[#0b50d5] hover:bg-[#0b50d5]/10 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                          View Restaurant
                        </Link>
                        <button 
                          onClick={() => {
                            if (window.confirm("Are you sure you want to cancel this booking?")) {
                              cancelBooking(booking.id);
                            }
                          }}
                          className="text-[#ba001c] hover:bg-[#ba001c]/10 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                        >
                          Cancel Booking
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
