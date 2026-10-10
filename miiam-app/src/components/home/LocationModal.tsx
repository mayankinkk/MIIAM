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

export default function LocationModal({
  isOpen,
  onClose,
  manualPincode,
  onPincodeChange,
  pincodeError,
  isLoadingLocation,
  onCheckAvailability,
  onDetectLocation,
}: LocationModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm md:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="bg-surface-container-lowest border-outline-variant/10 animate-in slide-in-from-bottom max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border-x border-t p-6 pb-8 duration-300 md:w-96 md:rounded-3xl md:border">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="location-modal-title" className="text-on-surface text-xl font-black">
            {t.home.enterPincode}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close location modal"
            className="bg-surface-container-high flex h-11 w-11 items-center justify-center rounded-full"
          >
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <p className="text-on-surface-variant mb-4 text-sm">{t.home.enterPincodeDesc}</p>

        {/* Pincode Entry */}
        <div className="mb-4">
          <label
            htmlFor="pincode-input"
            className="mb-1 block text-xs font-bold text-[var(--color-outline)]"
          >
            {t.home.pincode}
          </label>
          <input
            id="pincode-input"
            type="tel"
            inputMode="numeric"
            maxLength={6}
            value={manualPincode}
            onChange={(e) => onPincodeChange(e.target.value.replace(/\D/g, ""))}
            placeholder={t.home.enter6Digit}
            className="bg-surface-container-high focus:border-primary text-on-surface w-full rounded-xl border-2 border-transparent px-4 py-4 text-center text-2xl font-black tracking-[0.5em] outline-none"
            autoFocus
          />
          {pincodeError && (
            <p className="text-status-error mt-2 text-center text-xs font-bold">{pincodeError}</p>
          )}
        </div>

        <button
          onClick={onCheckAvailability}
          disabled={manualPincode.length !== 6 || isLoadingLocation}
          className="bg-primary text-on-primary mb-3 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold transition-colors hover:bg-[#e5b62e] active:scale-[0.98] disabled:opacity-50"
        >
          {isLoadingLocation ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {t.home.detectingArea}
            </>
          ) : (
            t.home.checkAvailability
          )}
        </button>

        <div className="mb-2 flex items-center gap-3">
          <div className="bg-outline-variant/20 h-px flex-1" />
          <span className="text-xs font-bold text-gray-400">{t.home.or}</span>
          <div className="bg-outline-variant/20 h-px flex-1" />
        </div>

        {/* GPS Button */}
        <button
          onClick={onDetectLocation}
          disabled={isLoadingLocation}
          className="border-outline-variant/20 hover:bg-surface-container-high flex w-full items-center gap-4 rounded-xl border p-4 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
            {isLoadingLocation ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
            ) : (
              <span className="material-symbols-outlined text-green-600">my_location</span>
            )}
          </div>
          <div className="text-left">
            <p className="text-on-surface text-sm font-bold">{t.home.detectMyLocation}</p>
            <p className="text-on-surface-variant text-[10px]">{t.home.useGps}</p>
          </div>
        </button>
      </div>
    </div>
  );
}
