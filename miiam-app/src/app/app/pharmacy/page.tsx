"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import ServiceProductGrid from "@/components/ServiceProductGrid";

const pharmacyCategories = [
  { id: "pain", name: "Pain Relief", icon: "\uD83D\uDC8A", color: "bg-red-100" },
  { id: "fever", name: "Fever & Cold", icon: "\uD83C\uDF21\uFE0F", color: "bg-orange-100" },
  { id: "digestive", name: "Digestive", icon: "\uD83D\uDCA7", color: "bg-green-100" },
  { id: "vitamins", name: "Vitamins", icon: "\uD83D\uDC8A", color: "bg-purple-100" },
  { id: "skincare", name: "Skin Care", icon: "\uD83E\uDDF4", color: "bg-pink-100" },
  { id: "baby", name: "Baby Care", icon: "\uD83D\uDC76", color: "bg-blue-100" },
];

export default function PharmacyPage() {
  const supabase = createClient();
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
      addToast("Prescription uploaded successfully! We'll review and contact you.", "success");
      setShowPrescriptionModal(false);
      setPrescriptionFile(null);
      setPrescriptionNotes("");
      setPrescriptionPhone("");
    } catch (error: any) {
      console.error("Upload error:", error);
      addToast("Failed to upload prescription. Please try again.", "error");
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
        title="Pharmacy"
        heroImage="/images/pharmacy_hero.png"
        heroTitle="Trusted Health Care"
        heroSubtitle="Genuine medicines delivered fast"
        categories={pharmacyCategories}
        emptyIcon="\uD83D\uDC8A"
        emptyTitle="No medicines found"
        emptyDescription="Try a different category or check back later!"
        serviceUnavailableIcon="medication"
        serviceSettingKey="pharmacy"
        filterTransform={(v) => v.replace(" ", "")}
        productImageFallback="/images/pharmacy_hero.png"
        serviceablePrefix="Delivering genuine medicines to"
        deliveryNoun="Pharmacy"
        vendorNameDefault="Pharmacy"
        checkoutUnserviceableMsg="Cannot checkout: Pharmacy is not serviceable at your selected location!"
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
