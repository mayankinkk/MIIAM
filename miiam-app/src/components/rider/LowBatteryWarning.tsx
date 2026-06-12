"use client";

interface LowBatteryWarningProps {
  visible: boolean;
  level: number;
  onDismiss: () => void;
}

export default function LowBatteryWarning({ visible, level, onDismiss }: LowBatteryWarningProps) {
  if (!visible) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
      <span className="material-symbols-outlined text-sm">battery_alert</span>
      <span className="text-sm font-medium">Low Battery ({level}%)</span>
      <button onClick={onDismiss}>
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}
