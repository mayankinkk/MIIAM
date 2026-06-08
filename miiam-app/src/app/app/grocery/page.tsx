"use client";

import ServiceProductGrid from "@/components/ServiceProductGrid";
import { useTranslation } from "@/lib/i18n/useTranslation";

const groceryCategories = [
  { id: "fruits", name: "Fruits", icon: "\uD83C\uDF4E", color: "bg-red-100" },
  { id: "vegetables", name: "Vegetables", icon: "\uD83E\uDD6C", color: "bg-green-100" },
  { id: "dairy", name: "Dairy", icon: "\uD83E\uDD5B", color: "bg-blue-100" },
  { id: "bakery", name: "Bakery", icon: "\uD83C\uDF5E", color: "bg-amber-100" },
  { id: "spices", name: "Spices", icon: "\uD83C\uDF36\uFE0F", color: "bg-orange-100" },
  { id: "pulses", name: "Pulses", icon: "\uD83E\uDED8", color: "bg-brown-100" },
  { id: "oils", name: "Oils", icon: "\uD83E\uDED7", color: "bg-yellow-100" },
  { id: "beverages", name: "Beverages", icon: "\uD83E\uDD67", color: "bg-purple-100" },
];

export default function GroceryPage() {
  const { t } = useTranslation();
  return (
    <ServiceProductGrid
      serviceName="Grocery"
      supabaseTable="grocery_products"
      vendorType="grocery"
      title={t.grocery.title}
      heroImage="/images/grocery_hero.png"
      heroTitle={t.grocery.heroTitle}
      heroSubtitle={t.grocery.heroSubtitle}
      categories={groceryCategories}
      emptyIcon="search_off"
      emptyTitle={t.grocery.noProducts}
      emptyDescription={t.grocery.noProductsDesc}
      emptyActionLabel={t.grocery.browseAll}
      serviceUnavailableIcon="shopping_cart"
      serviceSettingKey="grocery"
      serviceablePrefix={t.grocery.deliveringTo}
      deliveryNoun="Grocery"
      vendorNameDefault="Grocery"
      checkoutUnserviceableMsg={t.grocery.notServiceable}
      showVendorBreadcrumb
    />
  );
}
