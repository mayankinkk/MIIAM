"use client";

interface CallModalProps {
  open: boolean;
  onClose: () => void;
  name?: string;
  phone?: string;
}

export default function CallModal({ open, onClose, name, phone }: CallModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Call</h3>
          <button onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-[#0b50d5]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[#0b50d5] text-3xl">person</span>
          </div>
          <p className="font-bold mb-1">{name || "Vendor"}</p>
          <p className="text-sm text-slate-500">{phone}</p>
        </div>
        <a
          href={`tel:${phone}`}
          className="w-full py-4 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">call</span>
          Call Now
        </a>
      </div>
    </div>
  );
}
