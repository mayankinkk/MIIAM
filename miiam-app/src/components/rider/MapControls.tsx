"use client";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
}

export default function MapControls({ onZoomIn, onZoomOut, onCenter }: MapControlsProps) {
  return (
    <div className="absolute top-1/2 right-4 z-20 flex -translate-y-1/2 flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface-container-lowest)] shadow"
      >
        <span className="material-symbols-outlined">add</span>
      </button>
      <button
        onClick={onZoomOut}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface-container-lowest)] shadow"
      >
        <span className="material-symbols-outlined">remove</span>
      </button>
      <button
        onClick={onCenter}
        className="bg-brand-secondary mt-2 flex h-10 w-10 items-center justify-center rounded-lg text-white shadow"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          my_location
        </span>
      </button>
    </div>
  );
}
