"use client";

import { useToastStore } from "@/lib/store/toastStore";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ShareLiveLocationButtonProps {
  className?: string;
}

export default function ShareLiveLocationButton({ className = "" }: ShareLiveLocationButtonProps) {
  const { t } = useTranslation();

  function handleShare() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        navigator.clipboard.writeText(url);
        useToastStore.getState().addToast(t.rider.delivery.locationCopied, "success");
      },
      () => useToastStore.getState().addToast(t.rider.delivery.locationError, "error")
    );
  }

  return (
    <button
      onClick={handleShare}
      className={`py-2 bg-green-100 text-green-700 font-bold rounded-xl flex items-center justify-center gap-2 ${className}`}
    >
      <span className="material-symbols-outlined">share_location</span>
      {t.rider.delivery.shareLiveLocation}
    </button>
  );
}
