"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface BookingCalendarProps {
  providerId: string;
  serviceId: string;
  serviceName: string;
  price: number;
  onBook: (date: string, time: string) => void;
}

export default function BookingCalendar({ 
  providerId, 
  serviceId, 
  serviceName, 
  price,
  onBook 
}: BookingCalendarProps) {
  const supabase = createClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<Record<string, { available: boolean }>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMonthAvailability();
  }, [currentMonth, providerId]);

  async function loadMonthAvailability() {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    try {
      const res = await fetch(`/api/provider/availability?provider_id=${providerId}&start_date=${startStr}&end_date=${endStr}`);
      const data = await res.json();
      setAvailability(data.availability || {});
    } catch (err) {
      console.error("Failed to load availability", err);
    }
  }

  async function loadDaySlots(date: string) {
    setLoading(true);
    setSelectedTime(null);
    
    try {
      const res = await fetch(`/api/provider/availability?provider_id=${providerId}&date=${date}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      console.error("Failed to load slots", err);
      setSlots(generateDefaultSlots());
    }
    setLoading(false);
  }

  function generateDefaultSlots(): TimeSlot[] {
    const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
    return times.map(time => ({ time, available: true }));
  }

  function getDaysInMonth() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }

    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }

  function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  function isDateSelectable(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = formatDate(date);
    const dayAvail = availability[dateStr];
    return date >= today && (dayAvail?.available !== false);
  }

  function isDateSelected(date: Date): boolean {
    return selectedDate === formatDate(date);
  }

  async function handleDateSelect(date: Date) {
    if (!isDateSelectable(date)) return;
    const dateStr = formatDate(date);
    setSelectedDate(dateStr);
    await loadDaySlots(dateStr);
  }

  async function handleBook() {
    if (!selectedDate || !selectedTime) return;
    setBooking(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please login to book");
        setBooking(false);
        return;
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          user_id: user.id,
          provider_id: providerId,
          scheduled_date: selectedDate,
          scheduled_time: selectedTime,
          total_amount: price,
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Booking failed");
      }

      setShowConfirmation(true);
      onBook(selectedDate, selectedTime);
    } catch (err: any) {
      setError(err.message);
    }
    setBooking(false);
  }

  const days = getDaysInMonth();
  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-black text-[#4d212a] mb-4">Book Appointment</h3>

      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <span className="font-bold text-slate-800">{monthName}</span>
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-xs font-bold text-slate-400 py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const dateStr = formatDate(day.date);
          const selectable = isDateSelectable(day.date);
          const selected = isDateSelected(day.date);
          const isPast = day.date < new Date() && day.isCurrentMonth;

          return (
            <button
              key={i}
              onClick={() => handleDateSelect(day.date)}
              disabled={!selectable}
              className={`
                p-2 text-sm font-bold rounded-lg transition-colors
                ${!day.isCurrentMonth ? "text-slate-300" : ""}
                ${isPast ? "text-slate-300 cursor-not-allowed" : ""}
                ${selected ? "bg-[#ba001c] text-white" : ""}
                ${selectable && !selected ? "hover:bg-slate-100 text-slate-700" : ""}
                ${!selectable && day.isCurrentMonth ? "bg-red-50 text-red-300 line-through" : ""}
              `}
            >
              {day.date.getDate()}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-6">
          <p className="text-sm font-bold text-slate-600 mb-3">
            Available times for {new Date(selectedDate).toLocaleDateString("en-IN", { 
              weekday: "long", 
              month: "short", 
              day: "numeric" 
            })}
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map(slot => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                  className={`
                    py-3 rounded-lg text-sm font-bold transition-colors
                    ${selectedTime === slot.time 
                      ? "bg-[#ba001c] text-white" 
                      : slot.available 
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
                        : "bg-slate-50 text-slate-300 cursor-not-allowed line-through"
                    }
                  `}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {selectedDate && selectedTime && (
        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="font-bold text-slate-800">{serviceName}</p>
              <p className="text-sm text-slate-500">
                {new Date(selectedDate).toLocaleDateString("en-IN", { 
                  weekday: "short", 
                  month: "short", 
                  day: "numeric" 
                })} at {selectedTime}
              </p>
            </div>
            <p className="text-xl font-black text-[#ba001c]">₹{price}</p>
          </div>
          <button
            onClick={handleBook}
            disabled={booking}
            className="w-full py-4 bg-[#ba001c] text-white rounded-xl font-bold disabled:opacity-50"
          >
            {booking ? "Booking..." : "Confirm Booking"}
          </button>
        </div>
      )}

      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
            </div>
            <h3 className="text-xl font-black text-[#4d212a] mb-2">Booking Confirmed!</h3>
            <p className="text-slate-600 mb-6">
              Your appointment for {serviceName} on {new Date(selectedDate!).toLocaleDateString()} at {selectedTime} has been confirmed.
            </p>
            <button
              onClick={() => setShowConfirmation(false)}
              className="w-full py-4 bg-[#ba001c] text-white rounded-xl font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}