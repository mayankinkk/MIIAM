"use client";

import { useState, useEffect } from "react";
import {
  useServiceSettingsStore,
  ServiceCategory,
  isServiceOpen,
} from "@/lib/store/serviceSettingsStore";

export default function ServiceSettingsPage() {
  const { settings, updateSetting, updateHours, syncFromSupabase } = useServiceSettingsStore();
  const [editingId, setEditingId] = useState<ServiceCategory | null>(null);
  const [tempMessage, setTempMessage] = useState("");
  const [editingHoursId, setEditingHoursId] = useState<ServiceCategory | null>(null);
  const [tempOpen, setTempOpen] = useState("06:00");
  const [tempClose, setTempClose] = useState("23:59");
  const [tempIs247, setTempIs247] = useState(false);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    syncFromSupabase().finally(() => setSyncing(false));
  }, [syncFromSupabase]);

  const handleReset = async () => {
    if (confirm("Reset all settings to defaults? This will clear all custom messages.")) {
      localStorage.removeItem("miiam-service-settings");
      window.location.reload();
    }
  };

  const handleToggle = (id: ServiceCategory) => {
    const setting = settings.find((s) => s.id === id);
    updateSetting(id, { isEnabled: !setting?.isEnabled });
  };

  const handleEditMessage = (id: ServiceCategory) => {
    const setting = settings.find((s) => s.id === id);
    setEditingId(id);
    setTempMessage(setting?.message || "");
  };

  const handleSaveMessage = (id: ServiceCategory) => {
    updateSetting(id, { message: tempMessage });
    setEditingId(null);
  };

  const handleEditHours = (id: ServiceCategory) => {
    const setting = settings.find((s) => s.id === id);
    if (!setting) return;
    setEditingHoursId(id);
    setTempOpen(setting.hours.open);
    setTempClose(setting.hours.close);
    setTempIs247(setting.hours.is24x7);
  };

  const handleSaveHours = (id: ServiceCategory) => {
    updateHours(id, { open: tempOpen, close: tempClose, is24x7: tempIs247 });
    setEditingHoursId(null);
  };

  return (
    <div className="space-y-6 px-8 py-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
          Service Settings
        </h1>
        <p className="mt-1 text-[var(--color-outline)]">
          Control which services are available to users
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="rounded-lg bg-[var(--color-surface-container)] px-4 py-2 text-sm font-bold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
        >
          Reset to Defaults
        </button>
        {syncing && (
          <span className="animate-pulse text-xs text-[var(--color-outline)]">
            Syncing from cloud...
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
          <div className="grid grid-cols-12 gap-4 text-xs font-bold tracking-widest text-[var(--color-outline)] uppercase">
            <div className="col-span-3">Service</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Hours</div>
            <div className="col-span-4">Custom Message</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {settings.map((service) => (
            <div
              key={service.id}
              className="grid grid-cols-12 items-center gap-4 p-4 hover:bg-[var(--color-surface-subtle)]"
            >
              <div className="col-span-3 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    service.isEnabled
                      ? "bg-green-100 text-green-600"
                      : "bg-[var(--color-surface-container)] text-[var(--color-outline-variant)]"
                  }`}
                >
                  <span className="material-symbols-outlined">{service.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-[var(--color-on-surface)]">{service.name}</p>
                  <p className="text-xs text-[var(--color-outline-variant)]">{service.id}</p>
                </div>
              </div>

              <div className="col-span-1">
                <button
                  onClick={() => handleToggle(service.id)}
                  role="switch"
                  aria-checked={service.isEnabled}
                  aria-label={`${service.isEnabled ? "Disable" : "Enable"} ${service.name}`}
                  className={`relative h-6 w-12 rounded-full transition-colors ${
                    service.isEnabled ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] shadow transition-transform ${
                      service.isEnabled ? "left-6" : "left-0.5"
                    }`}
                  />
                  <span
                    className={`absolute top-1 right-1.5 text-[10px] font-bold ${
                      service.isEnabled ? "text-white" : "text-[var(--color-on-surface-variant)]"
                    }`}
                  >
                    {service.isEnabled ? "ON" : "OFF"}
                  </span>
                </button>
              </div>

              <div className="col-span-2">
                {editingHoursId === service.id ? (
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor={`service-247-${service.id}`}
                      className="flex items-center gap-1 text-[11px] text-[var(--color-outline)]"
                    >
                      <input
                        id={`service-247-${service.id}`}
                        checked={tempIs247}
                        onChange={(e) => setTempIs247(e.target.checked)}
                        className="h-3 w-3"
                      />
                      24×7
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={tempOpen}
                        onChange={(e) => setTempOpen(e.target.value)}
                        disabled={tempIs247}
                        className="w-[72px] rounded border border-[var(--color-border-subtle)] px-1.5 py-1 text-xs disabled:opacity-40"
                      />
                      <span className="text-xs text-[var(--color-outline-variant)]">–</span>
                      <input
                        type="time"
                        value={tempClose}
                        onChange={(e) => setTempClose(e.target.value)}
                        disabled={tempIs247}
                        className="w-[72px] rounded border border-[var(--color-border-subtle)] px-1.5 py-1 text-xs disabled:opacity-40"
                      />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSaveHours(service.id)}
                        className="text-on-primary rounded bg-[var(--color-primary)] px-2 py-1 text-[11px] font-bold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingHoursId(null)}
                        className="rounded bg-[var(--color-surface-container)] px-2 py-1 text-[11px] font-bold text-[var(--color-on-surface-variant)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-bold ${
                        isServiceOpen(service.hours)
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isServiceOpen(service.hours)
                            ? "animate-pulse bg-emerald-500"
                            : "bg-amber-500 dark:bg-amber-400"
                        }`}
                      />
                      {service.hours.is24x7
                        ? "24×7"
                        : `${service.hours.open} – ${service.hours.close}`}
                    </span>
                    <button
                      onClick={() => handleEditHours(service.id)}
                      className="text-[11px] font-bold text-[var(--color-primary)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              <div className="col-span-4">
                {editingId === service.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempMessage}
                      onChange={(e) => setTempMessage(e.target.value)}
                      className="flex-1 rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-sm"
                      placeholder="Enter custom message..."
                    />
                    <button
                      onClick={() => handleSaveMessage(service.id)}
                      className="text-on-primary rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-bold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg bg-[var(--color-surface-container)] px-3 py-2 text-sm font-bold text-[var(--color-on-surface-variant)]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-on-surface-variant)]">
                    {service.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <button
                  onClick={() => handleEditMessage(service.id)}
                  className="text-sm font-bold text-[var(--color-primary)] hover:underline"
                >
                  Edit Message
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">info</span>
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-200">How it works</p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              When a service is turned OFF, users visiting that section will see your custom message
              instead of the regular content. Service hours are surfaced in the customer UI to show
              live availability (Open/Closed) and the time window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
