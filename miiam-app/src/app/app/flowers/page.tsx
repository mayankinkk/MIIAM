"use client";

import ServiceProductGrid from "@/components/ServiceProductGrid";
import { useTranslation } from "@/lib/i18n/useTranslation";

const flowerCategories = [
  { id: "bouquets", name: "Bouquets", icon: "\uD83D\uDC90", color: "bg-pink-100" },
  { id: "arrangements", name: "Arrangements", icon: "\uD83D\uDC90", color: "bg-rose-100" },
  { id: "single", name: "Single Stems", icon: "\uD83C\uDF39", color: "bg-red-100" },
  { id: "gifts", name: "Gift Sets", icon: "\uD83C\uDF81", color: "bg-purple-100" },
  { id: "ceremony", name: "Ceremony", icon: "\uD83D\uDC92", color: "bg-amber-100" },
];

export default function FlowersPage() {
  const { t } = useTranslation();
  return (
    <ServiceProductGrid
      serviceName="Flowers"
      supabaseTable="flower_items"
      vendorType="flowers"
      title="Flowers & Gifts"
      heroImage="/images/flowers_hero.png"
      heroTitle="Premium Bouquets"
      heroSubtitle="Exotic arrangements for every occasion"
      categories={flowerCategories}
      emptyIcon="\uD83C\uDF38"
      emptyTitle="No flowers found"
      emptyDescription="Try a different category or check back later!"
      serviceUnavailableIcon="local_florist"
      serviceSettingKey="flowers"
      filterTransform={(v) => v.replace(" ", "")}
      serviceablePrefix="Delivering premium flowers to"
      deliveryNoun="Flower"
      vendorNameDefault="Flowers & Gifts"
      checkoutUnserviceableMsg="Cannot checkout: Flowers are not serviceable at your selected location!"
    />
  );
}
