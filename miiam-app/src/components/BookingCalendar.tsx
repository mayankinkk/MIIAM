"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";

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
  onBook,
}: BookingCalendarProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
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
      const res = await fetch(
        `/api/provider/availability?provider_id=${providerId}&start_date=${startStr}&end_date=${endStr}`
      );
      const data = await res.json();
      setAvailability(data.availability || {});
    } catch (err) {
      logger.error({ err }, "Failed to load availability");
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
      logger.error({ err }, "Failed to load slots");
      setSlots(generateDefaultSlots());
    }
    setLoading(false);
  }

  function generateDefaultSlots(): TimeSlot[] {
    const times = [
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
    ];
    return times.map((time) => ({ time, available: true }));
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
    return date >= today && dayAvail?.available !== false;
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
      const dateObj = new Date(selectedDate);
      const isoDate = dateObj.toISOString().split("T")[0];

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: serviceId,
          sub_service: serviceName,
          provider_id: providerId,
          scheduled_date: isoDate,
          scheduled_time: selectedTime,
          amount: price,
          address: "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Booking failed");
      }

      setShowConfirmation(true);
      onBook(selectedDate, selectedTime);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Booking failed");
    }
    setBooking(false);
  }

  const days = getDaysInMonth();
  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
      <h3 className="mb-4 text-lg font-black text-[var(--color-on-surface)]">Book Appointment</h3>

      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => {
            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
            setSelectedDate(null);
            setSelectedTime(null);
          }}
          className="rounded-lg p-3 hover:bg-[var(--color-surface-container)]"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <span className="font-bold text-[var(--color-on-surface)]">{monthName}</span>
        <button
          onClick={() => {
            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
            setSelectedDate(null);
            setSelectedTime(null);
          }}
          className="rounded-lg p-3 hover:bg-[var(--color-surface-container)]"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <div className="mb-4 grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="py-2 text-xs font-bold text-[var(--color-outline-variant)]">
            {d}
          </div>
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
              className={`min-w-[44px] rounded-lg p-3 text-sm font-bold transition-colors ${!day.isCurrentMonth ? "text-[var(--color-outline-variant)]/60" : ""} ${isPast ? "cursor-not-allowed text-[var(--color-outline-variant)]/60" : ""} ${selected ? "text-on-primary bg-[var(--color-primary)]" : ""} ${selectable && !selected ? "text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)]" : ""} ${!selectable && day.isCurrentMonth ? "bg-red-50 text-red-300 line-through" : ""} `}
            >
              {day.date.getDate()}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-bold text-[var(--color-on-surface-variant)]">
            Available times for{" "}
            {new Date(selectedDate).toLocaleDateString("en-IN", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                  className={`rounded-lg py-3 text-sm font-bold transition-colors ${
                    selectedTime === slot.time
                      ? "text-on-primary bg-[var(--color-primary)]"
                      : slot.available
                        ? "bg-[var(--color-surface-container)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)]"
                        : "cursor-not-allowed bg-[var(--color-surface-subtle)] text-[var(--color-outline-variant)]/60 line-through"
                  } `}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-status-error/10 text-status-error mt-4 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {selectedDate && selectedTime && (
        <div className="mt-6 rounded-xl bg-[var(--color-surface-subtle)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-[var(--color-on-surface)]">{serviceName}</p>
              <p className="text-sm text-[var(--color-outline)]">
                {new Date(selectedDate).toLocaleDateString("en-IN", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}{" "}
                at {selectedTime}
              </p>
            </div>
            <p className="text-xl font-black text-[var(--color-accent)]">₹{price}</p>
          </div>
          <button
            onClick={handleBook}
            disabled={booking}
            className="text-on-primary w-full rounded-xl bg-[var(--color-primary)] py-4 font-bold disabled:opacity-50"
          >
            {booking ? "Booking..." : "Confirm Booking"}
          </button>
        </div>
      )}

      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--color-surface-container-lowest)] p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <span className="material-symbols-outlined text-4xl text-green-600">
                check_circle
              </span>
            </div>
            <h3 className="mb-2 text-xl font-black text-[var(--color-on-surface)]">
              Booking Confirmed!
            </h3>
            <p className="mb-6 text-[var(--color-on-surface-variant)]">
              Your appointment for {serviceName} on {new Date(selectedDate!).toLocaleDateString()}{" "}
              at {selectedTime} has been confirmed.
            </p>
            <button
              onClick={() => {
                setShowConfirmation(false);
                router.push("/app/bookings");
              }}
              className="mb-2 w-full rounded-xl bg-[var(--color-surface-container)] py-4 font-bold text-[var(--color-on-surface)]"
            >
              View Booking
            </button>
            <button
              onClick={() => setShowConfirmation(false)}
              className="text-on-primary w-full rounded-xl bg-[var(--color-primary)] py-4 font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
