"use client";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
}

export default function MapControls({ onZoomIn, onZoomOut, onCenter }: MapControlsProps) {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
      <button
        onClick={onZoomIn}
        className="w-10 h-10 bg-[var(--color-surface-container-lowest)] rounded-lg shadow flex items-center justify-center"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
      <button
        onClick={onZoomOut}
        className="w-10 h-10 bg-[var(--color-surface-container-lowest)] rounded-lg shadow flex items-center justify-center"
      >
        <span className="material-symbols-outlined">remove</span>
      </button>
      <button
        onClick={onCenter}
        className="w-10 h-10 bg-brand-secondary text-white rounded-lg shadow flex items-center justify-center mt-2"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
      </button>
    </div>
  );
}
