"use client";

interface SkipOrderModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SkipOrderModal({ open, onConfirm, onCancel }: SkipOrderModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-xl text-center mb-2">Skip Order?</h3>
        <p className="text-sm text-slate-500 text-center mb-6">This order will be snoozed for 30 seconds</p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
