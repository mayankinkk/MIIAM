"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();
  const router = useRouter();
  const [riderId, setRiderId] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newShift, setNewShift] = useState({ day_of_week: 1, start_time: "09:00", end_time: "17:00" });

  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/rider/login"); return; }
    const { data: rider } = await supabase.from("riders").select("id").eq("user_id", user.id).maybeSingle();
    if (rider) {
      setRiderId(rider.id);
      await loadShifts(rider.id);
    }
    setLoading(false);
  }

  async function loadShifts(rId: string) {
    const { data } = await supabase.from("rider_shifts").select("*").eq("rider_id", rId).order("day_of_week").order("start_time");
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
    if (error) { alert("Error: " + error.message); return; }
    setShowAdd(false);
    await loadShifts(riderId);
  };

  const toggleShift = async (shift: Shift) => {
    await supabase.from("rider_shifts").update({ is_active: !shift.is_active }).eq("id", shift.id);
    setShifts(shifts.map(s => s.id === shift.id ? { ...s, is_active: !s.is_active } : s));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this shift?")) return;
    await supabase.from("rider_shifts").delete().eq("id", id);
    setShifts(shifts.filter(s => s.id !== id));
  };

  const groupedShifts = DAYS.map((_, i) => ({
    day: i,
    label: DAYS[i],
    shifts: shifts.filter(s => s.day_of_week === i),
  }));

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)] pb-24">
      <div className="bg-[var(--color-surface-container-lowest)] px-5 pt-6 pb-4 sticky top-0 z-10 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--color-on-surface)]">Work Shifts</h1>
            <p className="text-sm text-[var(--color-outline)] mt-0.5">Set your weekly availability schedule</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="w-10 h-10 bg-[#0b50d5] rounded-full flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white">add</span>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-[var(--color-outline-variant)] animate-pulse">Loading shifts...</div>
        ) : (
          groupedShifts.map((g) => {
            const isToday = g.day === new Date().getDay();
            return (
              <div key={g.day} className={`bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border ${isToday ? "border-[#0b50d5]/30 ring-1 ring-[#0b50d5]/10" : "border-[var(--color-border-subtle)]"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isToday ? "text-[#0b50d5]" : "text-[var(--color-on-surface)]"}`}>{g.label}</span>
                    {isToday && <span className="text-[10px] font-bold px-2 py-0.5 bg-[#0b50d5]/10 text-[#0b50d5] rounded-full">Today</span>}
                  </div>
                  <span className="text-xs text-[var(--color-outline-variant)]">{g.shifts.length} shift{g.shifts.length !== 1 ? "s" : ""}</span>
                </div>
                {g.shifts.length === 0 ? (
                  <p className="text-xs text-[var(--color-outline-variant)] py-2 text-center">No shifts scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {g.shifts.map((shift) => (
                      <div key={shift.id} className="flex items-center justify-between bg-[var(--color-surface-subtle)] rounded-xl p-3">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[var(--color-outline-variant)] text-lg">schedule</span>
                          <div>
                            <p className="text-sm font-bold text-[var(--color-on-surface)]">{shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}</p>
                            <p className="text-[10px] text-[var(--color-outline-variant)]">{(() => { const diff = new Date(`2000-01-01T${shift.end_time}`).getTime() - new Date(`2000-01-01T${shift.start_time}`).getTime(); return Math.round((diff < 0 ? diff + 86400000 : diff) / 3600000); })()} hrs</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleShift(shift)} className={`w-10 h-6 rounded-full transition-all ${shift.is_active ? "bg-green-500" : "bg-slate-300"}`}>
                            <div className={`w-4 h-4 bg-[var(--color-surface-container-lowest)] rounded-full transition-all ${shift.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                          </button>
                          <button onClick={() => handleDelete(shift.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                            <span className="material-symbols-outlined text-sm text-red-400">delete</span>
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-extrabold text-[var(--color-on-surface)] mb-4">Add Shift</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Day</label>
                <select value={newShift.day_of_week} onChange={(e) => setNewShift({ ...newShift, day_of_week: parseInt(e.target.value) })} className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)]">
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">Start Time</label>
                  <input type="time" value={newShift.start_time} onChange={(e) => setNewShift({ ...newShift, start_time: e.target.value })} className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)]" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">End Time</label>
                  <input type="time" value={newShift.end_time} onChange={(e) => setNewShift({ ...newShift, end_time: e.target.value })} className="w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)]" />
                </div>
              </div>
              <button onClick={handleAdd} className="w-full py-3 bg-[#0b50d5] text-white font-bold rounded-xl">Add Shift</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
