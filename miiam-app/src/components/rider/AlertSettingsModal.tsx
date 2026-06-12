"use client";

import { useState } from "react";

interface AlertSettingsModalProps {
  open: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  onSoundChange: (v: boolean) => void;
  onVibrationChange: (v: boolean) => void;
  onClearOrders: () => void;
  onClose: () => void;
}

export default function AlertSettingsModal({
  open,
  soundEnabled,
  vibrationEnabled,
  onSoundChange,
  onVibrationChange,
  onClearOrders,
  onClose,
}: AlertSettingsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-xl">Alert Settings</h3>
          <button onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#0b50d5]">volume_up</span>
              <div>
                <p className="font-bold">Sound Alert</p>
                <p className="text-xs text-slate-500">Play sound for new orders</p>
              </div>
            </div>
            <button 
              onClick={() => onSoundChange(!soundEnabled)}
              className={`w-12 h-6 rounded-full transition-all ${soundEnabled ? "bg-green-500" : "bg-slate-300"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-all ${soundEnabled ? "translate-x-6" : "translate-x-0.5"}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#0b50d5]">vibration</span>
              <div>
                <p className="font-bold">Vibration</p>
                <p className="text-xs text-slate-500">Vibrate for new orders</p>
              </div>
            </div>
            <button 
              onClick={() => onVibrationChange(!vibrationEnabled)}
              className={`w-12 h-6 rounded-full transition-all ${vibrationEnabled ? "bg-green-500" : "bg-slate-300"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-all ${vibrationEnabled ? "translate-x-6" : "translate-x-0.5"}`}></div>
            </button>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-blue-600 text-sm">info</span>
              <p className="text-xs text-blue-700">
                Alerts are triggered when you are online and a new order arrives within your zone.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Developer Tools</p>
            <button 
              onClick={onClearOrders}
              className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              Clear All Pending Orders
            </button>
            <p className="text-[10px] text-slate-400 mt-2 text-center italic">Deletes all unassigned pending orders from database.</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-4 py-3 bg-[#0b50d5] text-white font-bold rounded-xl"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
