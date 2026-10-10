import { useTranslation } from "@/lib/i18n/useTranslation";

interface ServiceabilityChipProps {
  pincode: string | null;
  displayAddress: string;
  localServiceable: boolean;
  checkingPincode: boolean;
}

export default function ServiceabilityChip({
  pincode,
  displayAddress,
  localServiceable,
  checkingPincode,
}: ServiceabilityChipProps) {
  const { t } = useTranslation();

  if (!pincode) return null;

  return (
    <div className="px-4 pt-2.5">
      <div className="text-on-surface-variant flex items-center gap-1.5 text-[11px] font-medium">
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${localServiceable ? "bg-status-success animate-pulse" : "bg-status-warning"}`}
        />
        <span className="truncate">
          {checkingPincode
            ? t.home.checkingAvailability
            : localServiceable
              ? `${t.home.showingNearby} ${displayAddress}`
              : `${t.home.noExactMatch} ${pincode}`}
        </span>
      </div>
    </div>
  );
}
