"use client";

import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface CheckoutScheduledDeliveryProps {
  scheduledDate: string;
  onScheduledDateChange: (date: string) => void;
  scheduledTime: string;
  onScheduledTimeChange: (time: string) => void;
  showDatePicker: boolean;
  onShowDatePickerChange: (show: boolean) => void;
  showTimePicker: boolean;
  onShowTimePickerChange: (show: boolean) => void;
  isRecurring: boolean;
  onIsRecurringChange: (recurring: boolean) => void;
  recurringFrequency: string;
  onRecurringFrequencyChange: (freq: string) => void;
  recurringDayOfWeek: number;
  onRecurringDayOfWeekChange: (day: number) => void;
  vendorIds: string[];
  onClearSchedule: () => void;
}

export default function CheckoutScheduledDelivery({
  scheduledDate, onScheduledDateChange,
  scheduledTime, onScheduledTimeChange,
  showDatePicker, onShowDatePickerChange,
  showTimePicker, onShowTimePickerChange,
  isRecurring, onIsRecurringChange,
  recurringFrequency, onRecurringFrequencyChange,
  recurringDayOfWeek, onRecurringDayOfWeekChange,
  vendorIds, onClearSchedule,
}: CheckoutScheduledDeliveryProps) {
  const { t } = useTranslation();

  const timeSlots = [
    "09:00 AM - 11:00 AM",
    "11:00 AM - 01:00 PM",
    "01:00 PM - 03:00 PM",
    "03:00 PM - 05:00 PM",
    "05:00 PM - 07:00 PM",
    "07:00 PM - 09:00 PM",
  ];

  const dateOptions = useMemo(() => {
    return [0, 1, 2, 3].map((days) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return {
        value: date.toISOString().split('T')[0],
        label: days === 0 ? "Today" : days === 1 ? "Tomorrow" : date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
      };
    });
  }, []);

  return (
    <section className="bg-surface-container-lowest p-5 sm:p-8 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
          <span className="material-symbols-outlined">schedule</span>
        </div>
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold">Schedule Delivery</h2>
          <p className="text-xs sm:text-sm text-on-surface-variant">Select date & time for delivery</p>
        </div>
      </div>

      {/* Date Picker */}
      <button
        onClick={() => onShowDatePickerChange(!showDatePicker)}
        className="w-full p-4 rounded-lg border-2 border-outline-variant/30 flex items-center justify-between hover:border-primary transition-all mb-4"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">calendar_month</span>
          <span className={scheduledDate ? "font-bold text-on-surface" : "text-on-surface-variant"}>
            {scheduledDate || "Select a date"}
          </span>
        </div>
        <span className="material-symbols-outlined text-primary">
          {showDatePicker ? "expand_less" : "expand_more"}
        </span>
      </button>

      {showDatePicker && (
        <div className="mb-4">
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={scheduledDate}
            onChange={(e) => onScheduledDateChange(e.target.value)}
            className="w-full p-4 rounded-lg border-2 border-outline-variant/30 focus:border-primary focus:outline-none"
          />
          <div className="flex gap-2 mt-3 flex-wrap">
            {dateOptions.map((d) => (
              <button
                key={d.value}
                onClick={() => onScheduledDateChange(d.value)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  scheduledDate === d.value
                    ? "bg-primary text-white border-primary"
                    : "border-outline-variant/30 hover:border-primary"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time Picker */}
      <button
        onClick={() => onShowTimePickerChange(!showTimePicker)}
        className="w-full p-4 rounded-lg border-2 border-outline-variant/30 flex items-center justify-between hover:border-primary transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">access_time</span>
          <span className={scheduledTime ? "font-bold text-on-surface" : "text-on-surface-variant"}>
            {scheduledTime || "Select a time slot"}
          </span>
        </div>
        <span className="material-symbols-outlined text-primary">
          {showTimePicker ? "expand_less" : "expand_more"}
        </span>
      </button>
      {showTimePicker && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {timeSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => { onScheduledTimeChange(slot); onShowTimePickerChange(false); }}
              className={`p-3 rounded-lg text-xs sm:text-sm font-semibold border transition-all text-left ${
                scheduledTime === slot
                  ? "bg-primary text-white border-primary"
                  : "border-outline-variant/30 hover:border-primary"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      )}

      {/* Clear Schedule */}
      {(scheduledDate || scheduledTime) && (
        <button
          onClick={onClearSchedule}
          className="mt-4 w-full p-3 rounded-lg text-sm font-semibold border border-red-300 text-red-600 hover:bg-red-50"
        >
          Clear Schedule
        </button>
      )}

      {/* Recurring Order Toggle */}
      {scheduledDate && scheduledTime && (
        <div className="mt-6 p-4 rounded-xl border-2 border-purple-200 bg-purple-50">
          <label className={`flex items-center justify-between gap-3 ${vendorIds.length > 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-outlined text-purple-600 shrink-0">repeat</span>
              <div className="min-w-0">
                <p className="font-bold text-purple-800 text-sm">Make this a recurring order</p>
                <p className="text-xs text-purple-600">{vendorIds.length > 1 ? "Not available for multi-vendor carts" : "Auto-reorder on schedule"}</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isRecurring}
              disabled={vendorIds.length > 1}
              onChange={(e) => onIsRecurringChange(e.target.checked)}
              className="w-5 h-5 text-purple-600 rounded shrink-0"
            />
          </label>

          {isRecurring && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-purple-700 block mb-1">Repeat every</label>
                <select
                  value={recurringFrequency}
                  onChange={(e) => onRecurringFrequencyChange(e.target.value)}
                  className="w-full p-3 rounded-lg border-2 border-purple-200 text-sm font-semibold focus:outline-none focus:border-purple-400"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              {(recurringFrequency === "weekly" || recurringFrequency === "biweekly") && (
                <div>
                  <label className="text-xs font-bold text-purple-700 block mb-1">On day</label>
                  <select
                    value={recurringDayOfWeek}
                    onChange={(e) => onRecurringDayOfWeekChange(Number(e.target.value))}
                    className="w-full p-3 rounded-lg border-2 border-purple-200 text-sm font-semibold focus:outline-none focus:border-purple-400"
                  >
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
                      <option key={day} value={i}>{day}</option>
                    ))}
                  </select>
                </div>
              )}
              <p className="text-xs text-purple-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Orders will be created automatically on your chosen schedule
              </p>
            </div>
          )}
        </div>
      )}

      {/* Scheduled Order Info */}
      {scheduledDate && scheduledTime && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 flex items-start gap-3">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div className="min-w-0">
            <p className="font-bold text-green-700 dark:text-green-300">Scheduled for delivery</p>
            <p className="text-sm text-green-600 dark:text-green-400 break-words">
              {new Date(scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} at {scheduledTime}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
