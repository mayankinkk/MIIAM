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
  scheduledDate,
  onScheduledDateChange,
  scheduledTime,
  onScheduledTimeChange,
  showDatePicker,
  onShowDatePickerChange,
  showTimePicker,
  onShowTimePickerChange,
  isRecurring,
  onIsRecurringChange,
  recurringFrequency,
  onRecurringFrequencyChange,
  recurringDayOfWeek,
  onRecurringDayOfWeekChange,
  vendorIds,
  onClearSchedule,
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
        value: date.toISOString().split("T")[0],
        label:
          days === 0
            ? "Today"
            : days === 1
              ? "Tomorrow"
              : date.toLocaleDateString("en-IN", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                }),
      };
    });
  }, []);

  return (
    <section className="border-outline-variant/60 border-b px-4 py-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="material-symbols-outlined text-accent text-[20px]">schedule</span>
        <div className="min-w-0">
          <h2 className="text-on-surface text-[15px] font-bold">{t.checkout.scheduleDelivery}</h2>
          <p className="text-on-surface-variant truncate text-xs">{t.checkout.scheduleDesc}</p>
        </div>
      </div>

      {/* Date Picker */}
      <button
        onClick={() => onShowDatePickerChange(!showDatePicker)}
        className="border-outline-variant/40 hover:border-primary mt-2.5 flex w-full items-center justify-between rounded-xl border px-3.5 py-3 transition-all"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="material-symbols-outlined text-accent text-[20px]">calendar_month</span>
          <span
            className={`truncate text-sm ${scheduledDate ? "text-on-surface font-bold" : "text-on-surface-variant"}`}
          >
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
            min={new Date().toISOString().split("T")[0]}
            value={scheduledDate}
            onChange={(e) => onScheduledDateChange(e.target.value)}
            className="border-outline-variant/40 focus:border-primary w-full rounded-xl border px-3.5 py-3 text-sm focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {dateOptions.map((d) => (
              <button
                key={d.value}
                onClick={() => onScheduledDateChange(d.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
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
        className="border-outline-variant/40 hover:border-primary mt-2.5 flex w-full items-center justify-between rounded-xl border px-3.5 py-3 transition-all"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="material-symbols-outlined text-accent text-[20px]">access_time</span>
          <span
            className={`truncate text-sm ${scheduledTime ? "text-on-surface font-bold" : "text-on-surface-variant"}`}
          >
            {scheduledTime || t.checkout.selectTimeSlot}
          </span>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant">
          {showTimePicker ? "expand_less" : "expand_more"}
        </span>
      </button>
      {showTimePicker && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {timeSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => {
                onScheduledTimeChange(slot);
                onShowTimePickerChange(false);
              }}
              className={`rounded-lg border px-3 py-2.5 text-left text-xs font-bold transition-all ${
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
          className="border-status-error/30 text-status-error hover:bg-status-error/10 mt-3 w-full rounded-xl border py-2.5 text-xs font-bold"
        >
          {t.checkout.clearSchedule}
        </button>
      )}

      {/* Recurring Order Toggle */}
      {scheduledDate && scheduledTime && (
        <div className="border-accent/30 bg-accent/5 mt-3 rounded-xl border p-3.5">
          <label
            className={`flex items-center justify-between gap-3 ${vendorIds.length > 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="material-symbols-outlined text-accent shrink-0">repeat</span>
              <div className="min-w-0">
                <p className="text-accent text-sm font-bold">{t.checkout.recurringOrder}</p>
                <p className="text-accent text-xs">
                  {vendorIds.length > 1 ? t.checkout.notForMultiVendor : t.checkout.autoReorder}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isRecurring}
              disabled={vendorIds.length > 1}
              onChange={(e) => onIsRecurringChange(e.target.checked)}
              className="text-accent h-5 w-5 shrink-0 rounded accent-[var(--color-accent)]"
            />
          </label>

          {isRecurring && (
            <div className="mt-3 space-y-2.5">
              <div>
                <label className="text-accent mb-1 block text-xs font-bold">
                  {t.checkout.repeatEvery}
                </label>
                <select
                  value={recurringFrequency}
                  onChange={(e) => onRecurringFrequencyChange(e.target.value)}
                  className="border-outline-variant/40 bg-surface focus:border-primary w-full rounded-lg border px-3 py-2.5 text-sm font-semibold focus:outline-none"
                >
                  <option value="daily">{t.checkout.daily}</option>
                  <option value="weekly">{t.checkout.weekly}</option>
                  <option value="biweekly">{t.checkout.every2Weeks}</option>
                  <option value="monthly">{t.checkout.monthly}</option>
                </select>
              </div>
              {(recurringFrequency === "weekly" || recurringFrequency === "biweekly") && (
                <div>
                  <label className="text-accent mb-1 block text-xs font-bold">
                    {t.checkout.onDay}
                  </label>
                  <select
                    value={recurringDayOfWeek}
                    onChange={(e) => onRecurringDayOfWeekChange(Number(e.target.value))}
                    className="border-outline-variant/40 bg-surface focus:border-primary w-full rounded-lg border px-3 py-2.5 text-sm font-semibold focus:outline-none"
                  >
                    {[
                      t.checkout.sunday,
                      t.checkout.monday,
                      t.checkout.tuesday,
                      t.checkout.wednesday,
                      t.checkout.thursday,
                      t.checkout.friday,
                      t.checkout.saturday,
                    ].map((day, i) => (
                      <option key={day} value={i}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <p className="text-accent flex items-center gap-1 text-xs">
                <span className="material-symbols-outlined text-[14px]">info</span>
                {t.checkout.recurringNote}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Scheduled Order Info */}
      {scheduledDate && scheduledTime && (
        <div className="bg-status-success/10 border-status-success/20 mt-3 flex items-start gap-2.5 rounded-xl border p-3">
          <span
            className="material-symbols-outlined text-accent shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <div className="min-w-0">
            <p className="text-accent text-sm font-bold">{t.checkout.scheduledForDelivery}</p>
            <p className="text-accent text-sm break-words">
              {new Date(scheduledDate).toLocaleDateString("en-IN", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              at {scheduledTime}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
