import { useTranslation } from "@/lib/i18n/useTranslation";

interface ServiceabilityChipProps {
  pincode: string | null;
  displayAddress: string;
  localServiceable: boolean;
  checkingPincode: boolean;
}

export default function ServiceabilityChip({ pincode, displayAddress, localServiceable, checkingPincode }: ServiceabilityChipProps) {
  const { t } = useTranslation();

  if (!pincode) return null;

  return (
    <div className="px-5 pt-3">
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${
        localServiceable ? "bg-status-success/10 text-status-success border border-status-success/15" : "bg-status-warning/10 text-status-warning border border-status-warning/15"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${localServiceable ? "bg-status-success animate-pulse" : "bg-status-warning"}`} />
        {checkingPincode ? t.home.checkingAvailability : localServiceable
          ? `${t.home.showingNearby} ${displayAddress}`
          : `${t.home.noExactMatch} ${pincode}`
        }
      </div>
    </div>
  );
}
