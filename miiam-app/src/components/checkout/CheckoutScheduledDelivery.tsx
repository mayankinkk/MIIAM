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
    <section className="px-4 py-4 border-b border-outline-variant/60">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-accent text-[20px]">schedule</span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-on-surface">{t.checkout.scheduleDelivery}</h2>
          <p className="text-xs text-on-surface-variant truncate">{t.checkout.scheduleDesc}</p>
        </div>
      </div>

      {/* Date Picker */}
      <button
        onClick={() => onShowDatePickerChange(!showDatePicker)}
        className="w-full mt-2.5 px-3.5 py-3 rounded-xl border border-outline-variant/40 flex items-center justify-between hover:border-primary transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="material-symbols-outlined text-accent text-[20px]">calendar_month</span>
          <span className={`text-sm truncate ${scheduledDate ? "font-bold text-on-surface" : "text-on-surface-variant"}`}>
            {scheduledDate || t.checkout.selectDate}
          </span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant">
          {showDatePicker ? "expand_less" : "expand_more"}
        </span>
      </button>

      {showDatePicker && (
        <div className="mt-3">
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={scheduledDate}
            onChange={(e) => onScheduledDateChange(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-outline-variant/40 focus:border-primary focus:outline-none text-sm"
          />
          <div className="flex gap-2 mt-3 flex-wrap">
            {dateOptions.map((d) => (
              <button
                key={d.value}
                onClick={() => onScheduledDateChange(d.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  scheduledDate === d.value
                    ? "bg-primary text-on-primary border-primary"
                    : "border-outline-variant/40 hover:border-primary text-on-surface-variant"
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
        className="w-full mt-2.5 px-3.5 py-3 rounded-xl border border-outline-variant/40 flex items-center justify-between hover:border-primary transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="material-symbols-outlined text-accent text-[20px]">access_time</span>
          <span className={`text-sm truncate ${scheduledTime ? "font-bold text-on-surface" : "text-on-surface-variant"}`}>
            {scheduledTime || t.checkout.selectTimeSlot}
          </span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant">
          {showTimePicker ? "expand_less" : "expand_more"}
        </span>
      </button>
      {showTimePicker && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {timeSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => { onScheduledTimeChange(slot); onShowTimePickerChange(false); }}
              className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all text-left ${
                scheduledTime === slot
                  ? "bg-primary text-on-primary border-primary"
                  : "border-outline-variant/40 hover:border-primary text-on-surface-variant"
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
          className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold border border-status-error/30 text-status-error hover:bg-status-error/10"
        >
          {t.checkout.clearSchedule}
        </button>
      )}

      {/* Recurring Order Toggle */}
      {scheduledDate && scheduledTime && (
        <div className="mt-3 p-3.5 rounded-xl border border-accent/30 bg-accent/5">
          <label className={`flex items-center justify-between gap-3 ${vendorIds.length > 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-accent shrink-0">repeat</span>
              <div className="min-w-0">
                <p className="font-bold text-accent text-sm">{t.checkout.recurringOrder}</p>
                <p className="text-xs text-accent">{vendorIds.length > 1 ? t.checkout.notForMultiVendor : t.checkout.autoReorder}</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isRecurring}
              disabled={vendorIds.length > 1}
              onChange={(e) => onIsRecurringChange(e.target.checked)}
              className="w-5 h-5 text-accent accent-[var(--color-accent)] rounded shrink-0"
            />
          </label>

          {isRecurring && (
            <div className="mt-3 space-y-2.5">
              <div>
                <label className="text-xs font-bold text-accent block mb-1">{t.checkout.repeatEvery}</label>
                <select
                  value={recurringFrequency}
                  onChange={(e) => onRecurringFrequencyChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 text-sm font-semibold bg-surface focus:outline-none focus:border-primary"
                >
                  <option value="daily">{t.checkout.daily}</option>
                  <option value="weekly">{t.checkout.weekly}</option>
                  <option value="biweekly">{t.checkout.every2Weeks}</option>
                  <option value="monthly">{t.checkout.monthly}</option>
                </select>
              </div>
              {(recurringFrequency === "weekly" || recurringFrequency === "biweekly") && (
                <div>
                  <label className="text-xs font-bold text-accent block mb-1">{t.checkout.onDay}</label>
                  <select
                    value={recurringDayOfWeek}
                    onChange={(e) => onRecurringDayOfWeekChange(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant/40 text-sm font-semibold bg-surface focus:outline-none focus:border-primary"
                  >
                    {[t.checkout.sunday, t.checkout.monday, t.checkout.tuesday, t.checkout.wednesday, t.checkout.thursday, t.checkout.friday, t.checkout.saturday].map((day, i) => (
                      <option key={day} value={i}>{day}</option>
                    ))}
                  </select>
                </div>
              )}
              <p className="text-xs text-accent flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                {t.checkout.recurringNote}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Scheduled Order Info */}
      {scheduledDate && scheduledTime && (
        <div className="mt-3 p-3 bg-status-success/10 rounded-xl border border-status-success/20 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-accent shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div className="min-w-0">
            <p className="font-bold text-accent text-sm">{t.checkout.scheduledForDelivery}</p>
            <p className="text-sm text-accent break-words">
              {new Date(scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} at {scheduledTime}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
