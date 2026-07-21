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
        localServiceable ? "bg-green-500/10 text-green-600 border border-green-500/15" : "bg-amber-500/10 text-amber-600 border border-amber-500/15"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${localServiceable ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
        {checkingPincode ? t.home.checkingAvailability : localServiceable
          ? `${t.home.showingNearby} ${displayAddress}`
          : `${t.home.noExactMatch} ${pincode}`
        }
      </div>
    </div>
  );
}
