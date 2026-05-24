"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function VendorRegister() {
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    // Owner Details
    owner_name: "",
    phone: "",
    email: "",
    // Shop Details
    shop_name: "",
    type: "food",
    cuisine: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    description: "",
    is_pure_veg: false,
    // Business Docs
    gst_number: "",
    fssai_number: "",
    pan_number: "",
    // Delivery
    min_order_amount: 0,
    delivery_charge: 0,
    delivery_time_min: 30,
    delivery_time_max: 45,
  });

  const steps = [
    { num: 1, label: "Owner Details" },
    { num: 2, label: "Shop Details" },
    { num: 3, label: "Business Docs" },
    { num: 4, label: "Delivery Settings" },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in first");
        router.push("/auth/login");
        return;
      }

      // Set email to current user's email if not provided
      const payload = {
        ...form,
        email: form.email || user.email,
        status: "pending",
      };

      const { error } = await supabase.from("vendors").insert(payload);
      if (error) throw error;

      // Update user role to vendor
      await supabase.from("profiles").update({ role: "vendor" }).eq("id", user.id);

      alert("Registration submitted! Your store is pending review.");
      router.push("/partner/dashboard");
    } catch (err: any) {
      alert("Registration failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field: string, value: any) => setForm({ ...form, [field]: value });

  const inputClass = "w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c]";
  const labelClass = "text-sm font-semibold text-slate-700";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ba001c]/5 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Partner with <span className="text-[#ba001c]">MIIAM</span>
          </h1>
          <p className="text-slate-500 mt-2">List your business and reach thousands of customers</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > s.num ? "bg-green-500 text-white" :
                step === s.num ? "bg-[#ba001c] text-white" :
                "bg-slate-200 text-slate-500"
              }`}>
                {step > s.num ? "✓" : s.num}
              </div>
              <span className={`text-sm font-medium ${step === s.num ? "text-slate-800" : "text-slate-400"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className={`w-12 h-0.5 ${step > s.num ? "bg-green-500" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-slate-900">Owner Details</h2>
              <div>
                <label className={labelClass}>Full Name *</label>
                <input type="text" value={form.owner_name} onChange={(e) => update("owner_name", e.target.value)} placeholder="Your full name" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Phone Number *</label>
                <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 98765 43210" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="Will use your account email if left blank" className={inputClass} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-slate-900">Shop Details</h2>
              <div>
                <label className={labelClass}>Shop Name *</label>
                <input type="text" value={form.shop_name} onChange={(e) => update("shop_name", e.target.value)} placeholder="e.g., The Burger Alchemist" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Store Type *</label>
                <select value={form.type} onChange={(e) => update("type", e.target.value)} className={inputClass}>
                  <option value="food">Food & Restaurant</option>
                  <option value="grocery">Grocery</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="flowers">Flowers & Gifts</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Cuisine / Category</label>
                <input type="text" value={form.cuisine} onChange={(e) => update("cuisine", e.target.value)} placeholder="e.g., Indian, Chinese, Italian" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Tell customers about your store..." rows={3} className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className={labelClass}>Address *</label>
                <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Street address" className={inputClass} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>City *</label>
                  <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input type="text" value={form.state} onChange={(e) => update("state", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Pincode</label>
                  <input type="text" value={form.pincode} onChange={(e) => update("pincode", e.target.value)} className={inputClass} />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_pure_veg} onChange={(e) => update("is_pure_veg", e.target.checked)} className="w-5 h-5 accent-[#ba001c]" />
                <span className={labelClass}>Pure Vegetarian Store</span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-slate-900">Business Documents</h2>
              <p className="text-sm text-slate-500">Provide your business documents for verification.</p>
              <div>
                <label className={labelClass}>GST Number</label>
                <input type="text" value={form.gst_number} onChange={(e) => update("gst_number", e.target.value)} placeholder="22AAAAA0000A1Z5" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>FSSAI Number</label>
                <input type="text" value={form.fssai_number} onChange={(e) => update("fssai_number", e.target.value)} placeholder="12345678901234" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>PAN Number</label>
                <input type="text" value={form.pan_number} onChange={(e) => update("pan_number", e.target.value)} placeholder="ABCDE1234F" className={inputClass} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-slate-900">Delivery Settings</h2>
              <p className="text-sm text-slate-500">Configure your delivery preferences.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Min Order Amount (₹)</label>
                  <input type="number" min="0" value={form.min_order_amount} onChange={(e) => update("min_order_amount", parseFloat(e.target.value) || 0)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Delivery Charge (₹)</label>
                  <input type="number" min="0" value={form.delivery_charge} onChange={(e) => update("delivery_charge", parseFloat(e.target.value) || 0)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Min Delivery Time (min)</label>
                  <input type="number" min="1" value={form.delivery_time_min} onChange={(e) => update("delivery_time_min", parseInt(e.target.value) || 30)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Max Delivery Time (min)</label>
                  <input type="number" min="1" value={form.delivery_time_max} onChange={(e) => update("delivery_time_max", parseInt(e.target.value) || 45)} className={inputClass} />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-2xl p-6 mt-6">
                <h3 className="font-bold text-slate-800 mb-3">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Owner</span><span className="font-bold text-slate-700">{form.owner_name || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Store</span><span className="font-bold text-slate-700">{form.shop_name || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-bold text-slate-700">{form.type}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Location</span><span className="font-bold text-slate-700">{[form.city, form.state].filter(Boolean).join(", ") || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Documents</span><span className="font-bold text-slate-700">{form.gst_number ? "GST ✓" : "No GST"}{form.fssai_number ? " • FSSAI ✓" : ""}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                Back
              </button>
            ) : <div />}
            {step < 4 ? (
              <button onClick={() => setStep(step + 1)} className="px-8 py-3 bg-[#ba001c] text-white rounded-xl font-bold hover:bg-[#a40017] transition-colors">
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit for Review"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
