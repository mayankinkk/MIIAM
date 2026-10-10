"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Shift {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export default function RiderShifts() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { confirm } = useConfirm();
  const [riderId, setRiderId] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newShift, setNewShift] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
  });

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/rider/login");
      return;
    }
    const { data: rider } = await supabase
      .from("riders")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (rider) {
      setRiderId(rider.id);
      await loadShifts(rider.id);
    }
    setLoading(false);
  }

  async function loadShifts(rId: string) {
    const { data } = await supabase
      .from("rider_shifts")
      .select("*")
      .eq("rider_id", rId)
      .order("day_of_week")
      .order("start_time");
    if (data) setShifts(data);
  }

  const handleAdd = async () => {
    if (!riderId) return;
    const { error } = await supabase.from("rider_shifts").insert({
      rider_id: riderId,
      day_of_week: newShift.day_of_week,
      start_time: newShift.start_time,
      end_time: newShift.end_time,
      is_active: true,
    });
    if (error) {
      useToastStore.getState().addToast("Error: " + error.message, "error");
      return;
    }
    setShowAdd(false);
    await loadShifts(riderId);
  };

  const toggleShift = async (shift: Shift) => {
    await supabase.from("rider_shifts").update({ is_active: !shift.is_active }).eq("id", shift.id);
    setShifts(shifts.map((s) => (s.id === shift.id ? { ...s, is_active: !s.is_active } : s)));
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete Shift",
      message: "Are you sure you want to delete this shift?",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    await supabase.from("rider_shifts").delete().eq("id", id);
    setShifts(shifts.filter((s) => s.id !== id));
  };

  const groupedShifts = DAYS.map((_, i) => ({
    day: i,
    label: DAYS[i],
    shifts: shifts.filter((s) => s.day_of_week === i),
  }));

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)] pb-24">
      <div className="sticky top-0 z-10 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--color-on-surface)]">Work Shifts</h1>
            <p className="mt-0.5 text-sm text-[var(--color-outline)]">
              Set your weekly availability schedule
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-brand-secondary flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
            aria-label="Add shift"
          >
            <span className="material-symbols-outlined text-white">add</span>
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {loading ? (
          <div className="animate-pulse py-12 text-center text-[var(--color-outline-variant)]">
            Loading shifts...
          </div>
        ) : (
          groupedShifts.map((g) => {
            const isToday = g.day === new Date().getDay();
            return (
              <div
                key={g.day}
                className={`rounded-2xl border bg-[var(--color-surface-container-lowest)] p-4 ${isToday ? "border-brand-secondary/30 ring-brand-secondary/10 ring-1" : "border-[var(--color-border-subtle)]"}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${isToday ? "text-brand-secondary" : "text-[var(--color-on-surface)]"}`}
                    >
                      {g.label}
                    </span>
                    {isToday && (
                      <span className="bg-brand-secondary/10 text-brand-secondary rounded-full px-2 py-0.5 text-[10px] font-bold">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-outline-variant)]">
                    {g.shifts.length} shift{g.shifts.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {g.shifts.length === 0 ? (
                  <p className="py-2 text-center text-xs text-[var(--color-outline-variant)]">
                    No shifts scheduled
                  </p>
                ) : (
                  <div className="space-y-2">
                    {g.shifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-lg text-[var(--color-outline-variant)]">
                            schedule
                          </span>
                          <div>
                            <p className="text-sm font-bold text-[var(--color-on-surface)]">
                              {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                            </p>
                            <p className="text-[10px] text-[var(--color-outline-variant)]">
                              {(() => {
                                const diff =
                                  new Date(`2000-01-01T${shift.end_time}`).getTime() -
                                  new Date(`2000-01-01T${shift.start_time}`).getTime();
                                return Math.round((diff < 0 ? diff + 86400000 : diff) / 3600000);
                              })()}{" "}
                              hrs
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleShift(shift)}
                            className={`h-6 w-10 rounded-full transition-all ${shift.is_active ? "bg-green-500" : "bg-slate-300"}`}
                            aria-label={shift.is_active ? "Disable shift" : "Enable shift"}
                          >
                            <div
                              className={`h-4 w-4 rounded-full bg-[var(--color-surface-container-lowest)] transition-all ${shift.is_active ? "translate-x-5" : "translate-x-0.5"}`}
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(shift.id)}
                            className="rounded-lg p-1.5 hover:bg-red-50"
                            aria-label="Delete shift"
                          >
                            <span className="material-symbols-outlined text-sm text-red-400">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 dark:bg-[var(--color-surface)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-extrabold text-[var(--color-on-surface)]">
              Add Shift
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Day</label>
                <select
                  value={newShift.day_of_week}
                  onChange={(e) =>
                    setNewShift({ ...newShift, day_of_week: parseInt(e.target.value) })
                  }
                  className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3"
                >
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newShift.start_time}
                    onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newShift.end_time}
                    onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3"
                  />
                </div>
              </div>
              <button
                onClick={handleAdd}
                className="bg-brand-secondary w-full rounded-xl py-3 font-bold text-white"
              >
                Add Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
