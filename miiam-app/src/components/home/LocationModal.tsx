"use client";

import { useTranslation } from "@/lib/i18n/useTranslation";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  manualPincode: string;
  onPincodeChange: (value: string) => void;
  pincodeError: string;
  isLoadingLocation: boolean;
  onCheckAvailability: () => void;
  onDetectLocation: () => void;
}

export default function LocationModal({ isOpen, onClose, manualPincode, onPincodeChange, pincodeError, isLoadingLocation, onCheckAvailability, onDetectLocation }: LocationModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="location-modal-title" onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div className="bg-surface-container-lowest w-full md:w-96 rounded-t-3xl md:rounded-3xl p-6 pb-8 border-t border-x border-outline-variant/10 md:border animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 id="location-modal-title" className="text-xl font-black text-on-surface">{t.home.enterPincode}</h2>
          <button onClick={onClose} aria-label="Close location modal" className="w-11 h-11 bg-surface-container-high rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">close</span>
          </button>
        </div>

        <p className="text-sm text-on-surface-variant mb-4">{t.home.enterPincodeDesc}</p>

        {/* Pincode Entry */}
        <div className="mb-4">
          <label htmlFor="pincode-input" className="text-xs font-bold text-[var(--color-outline)] mb-1 block">{t.home.pincode}</label>
          <input
            id="pincode-input"
            type="tel"
            inputMode="numeric"
            maxLength={6}
            value={manualPincode}
            onChange={(e) => onPincodeChange(e.target.value.replace(/\D/g, ""))}
            placeholder={t.home.enter6Digit}
            className="w-full px-4 py-4 bg-surface-container-high rounded-xl border-2 border-transparent focus:border-primary outline-none text-2xl font-black tracking-[0.5em] text-center text-on-surface"
            autoFocus
          />
          {pincodeError && <p className="text-status-error text-xs mt-2 text-center font-bold">{pincodeError}</p>}
        </div>

        <button
          onClick={onCheckAvailability}
          disabled={manualPincode.length !== 6 || isLoadingLocation}
          className="w-full mb-3 bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-[#a00018] transition-colors disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isLoadingLocation ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t.home.detectingArea}
            </>
          ) : (
            t.home.checkAvailability
          )}
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-px bg-outline-variant/20" />
          <span className="text-xs text-gray-400 font-bold">{t.home.or}</span>
          <div className="flex-1 h-px bg-outline-variant/20" />
        </div>

        {/* GPS Button */}
        <button
          onClick={onDetectLocation}
          disabled={isLoadingLocation}
          className="w-full flex items-center gap-4 p-4 border border-outline-variant/20 rounded-xl hover:bg-surface-container-high transition-colors"
        >
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
            {isLoadingLocation ? (
              <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-green-600">my_location</span>
            )}
          </div>
          <div className="text-left">
            <p className="font-bold text-on-surface text-sm">{t.home.detectMyLocation}</p>
            <p className="text-[10px] text-on-surface-variant">{t.home.useGps}</p>
          </div>
        </button>
      </div>
    </div>
  );
}
