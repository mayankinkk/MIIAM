"use client";

import { useState } from "react";
import { useServiceSettingsStore, ServiceCategory } from "@/lib/store/serviceSettingsStore";

export default function ServiceSettingsPage() {
  const { settings, updateSetting } = useServiceSettingsStore();
  const [editingId, setEditingId] = useState<ServiceCategory | null>(null);
  const [tempMessage, setTempMessage] = useState("");

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

  return (
    <div className="px-8 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Service Settings</h1>
        <p className="text-slate-500 mt-1">Control which services are available to users</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <div className="col-span-3">Service</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-5">Custom Message</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {settings.map((service) => (
            <div key={service.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50">
              <div className="col-span-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  service.isEnabled ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"
                }`}>
                  <span className="material-symbols-outlined">{service.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800">{service.name}</p>
                  <p className="text-xs text-slate-400">{service.id}</p>
                </div>
              </div>

              <div className="col-span-2">
                <button
                  onClick={() => handleToggle(service.id)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    service.isEnabled ? "bg-green-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      service.isEnabled ? "left-8" : "left-1"
                    }`}
                  />
                  <span className={`absolute right-2 top-1.5 text-xs font-bold ${
                    service.isEnabled ? "text-white" : "text-slate-600"
                  }`}>
                    {service.isEnabled ? "ON" : "OFF"}
                  </span>
                </button>
              </div>

              <div className="col-span-5">
                {editingId === service.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempMessage}
                      onChange={(e) => setTempMessage(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="Enter custom message..."
                    />
                    <button
                      onClick={() => handleSaveMessage(service.id)}
                      className="px-3 py-2 bg-[#ba001c] text-white rounded-lg text-sm font-bold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">{service.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <button
                  onClick={() => handleEditMessage(service.id)}
                  className="text-sm text-[#ba001c] font-bold hover:underline"
                >
                  Edit Message
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600">info</span>
          <div>
            <p className="font-bold text-amber-800">How it works</p>
            <p className="text-sm text-amber-700 mt-1">
              When a service is turned OFF, users visiting that section will see your custom message instead of the regular content.
              This is useful for maintenance mode or launching new features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}