"use client";

import { useRef, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import ServiceProductGrid from "@/components/ServiceProductGrid";
import { useTranslation } from "@/lib/i18n/useTranslation";



export default function PharmacyPage() {
  const { t } = useTranslation();
  const pharmacyCategories = [
    { id: "pain", name: t.pharmacy.painRelief, icon: "\uD83D\uDC8A", color: "bg-red-100" },
    { id: "fever", name: t.pharmacy.feverCold, icon: "\uD83C\uDF21\uFE0F", color: "bg-orange-100" },
    { id: "digestive", name: t.pharmacy.digestive, icon: "\uD83D\uDCA7", color: "bg-green-100" },
    { id: "vitamins", name: t.pharmacy.vitamins, icon: "\uD83D\uDC8A", color: "bg-purple-100" },
    { id: "skincare", name: t.pharmacy.skinCare, icon: "\uD83E\uDDF4", color: "bg-pink-100" },
    { id: "baby", name: t.pharmacy.babyCare, icon: "\uD83D\uDC76", color: "bg-blue-100" },
  ];
  const supabase = useMemo(() => createClient(), []);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [prescriptionPhone, setPrescriptionPhone] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToastStore();

  const handlePrescriptionUpload = async () => {
    if (!prescriptionFile) return;
    setUploading(true);
    try {
      const fileExt = prescriptionFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(fileName, prescriptionFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("prescriptions")
        .getPublicUrl(fileName);
      const { error: insertError } = await supabase
        .from("user_prescriptions")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id || "anonymous",
          image_url: urlData.publicUrl,
          notes: prescriptionNotes,
          phone: prescriptionPhone,
          status: "pending",
        });
      if (insertError) throw insertError;
      addToast(t.pharmacy.prescriptionUploaded, "success");
      setShowPrescriptionModal(false);
      setPrescriptionFile(null);
      setPrescriptionNotes("");
      setPrescriptionPhone("");
    } catch (error: any) {
      console.error("Upload error:", error);
      addToast(t.pharmacy.prescriptionFailed, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPrescriptionFile(e.target.files[0]);
    }
  };

  return (
    <>
      <ServiceProductGrid
        serviceName="Pharmacy"
        supabaseTable="pharmacy_medicines"
        vendorType="pharmacy"
        title={t.pharmacy.title}
        heroImage="/images/pharmacy_hero.png"
        heroTitle={t.pharmacy.heroTitle}
        heroSubtitle={t.pharmacy.heroSubtitle}
        categories={pharmacyCategories}
        emptyIcon="\uD83D\uDC8A"
        emptyTitle={t.pharmacy.noProducts}
        emptyDescription={t.pharmacy.noProductsDesc}
        serviceUnavailableIcon="medication"
        serviceSettingKey="pharmacy"
        filterTransform={(v) => v.replace(" ", "")}
        productImageFallback="/images/pharmacy_hero.png"
        serviceablePrefix={t.pharmacy.deliveringTo}
        deliveryNoun="Pharmacy"
        vendorNameDefault="Pharmacy"
        checkoutUnserviceableMsg={t.pharmacy.notServiceable}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,.pdf"
        className="hidden"
      />
    </>
  );
}
