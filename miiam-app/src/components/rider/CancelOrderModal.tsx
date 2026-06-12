"use client";

interface CancelOrderModalProps {
  open: boolean;
  reasons: string[];
  onSelectReason: (reason: string) => void;
  onClose: () => void;
}

export default function CancelOrderModal({ open, reasons, onSelectReason, onClose }: CancelOrderModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-4">
        <h3 className="font-bold text-lg mb-4">Decline Order</h3>
        <p className="text-sm text-slate-500 mb-4">Select a reason for declining:</p>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {reasons.map((reason) => (
            <button
              key={reason}
              onClick={() => onSelectReason(reason)}
              className="w-full text-left p-3 bg-slate-50 rounded-xl hover:bg-slate-100 text-sm"
            >
              {reason}
            </button>
          ))}
        </div>
        <button 
          onClick={onClose}
          className="w-full mt-4 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
