"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "miiam-partner-registration";

const defaultForm = {
  owner_name: "",
  phone: "",
  email: "",
  shop_name: "",
  type: "food",
  cuisine: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  description: "",
  is_pure_veg: false,
  gst_number: "",
  fssai_number: "",
  pan_number: "",
  min_order_amount: 0,
  delivery_charge: 0,
  delivery_time_min: 30,
  delivery_time_max: 45,
};

function loadSavedForm() {
  if (typeof window === "undefined") return defaultForm;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultForm, ...JSON.parse(saved) } : defaultForm;
  } catch {
    return defaultForm;
  }
}

export default function VendorRegister() {
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState(loadSavedForm);
  const [authChecked, setAuthChecked] = useState(false);

  // Check auth on mount — redirect to login immediately if not signed in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string; email?: string } | null } }) => {
      if (!user) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
        router.push("/auth/login?redirect=/partner/register");
      } else {
        setAuthChecked(true);
      }
    });
   
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  // Show nothing while auth check is in progress
  if (!authChecked && !submitted) return null;

  const steps = [
    { num: 1, label: "Owner Details" },
    { num: 2, label: "Shop Details" },
    { num: 3, label: "Business Docs" },
    { num: 4, label: "Delivery Settings" },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
        router.push("/auth/login?redirect=/partner/register");
        return;
      }

      const payload = {
        ...form,
        email: form.email || user.email,
        user_id: user.id,
        status: "pending",
      };

      const { error } = await supabase.from("vendors").insert(payload);
      if (error) throw error;

      // NOTE: profile role is updated to 'vendor' ONLY when admin approves — not here.
      sessionStorage.removeItem(STORAGE_KEY);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field: string, value: any) => setForm({ ...form, [field]: value });

  const inputClass = "w-full mt-1 px-4 py-3 bg-[var(--color-surface-subtle)] rounded-xl border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-primary)]";
  const labelClass = "text-sm font-semibold text-[var(--color-on-surface)]";

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--color-primary)]/5 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-10 shadow-lg border border-[var(--color-border-subtle)] space-y-6">
            {/* Animated checkmark */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-green-600 text-5xl">check_circle</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight">
                Application Submitted!
              </h1>
              <p className="text-[var(--color-outline)] text-base leading-relaxed">
                Thanks for registering,{" "}
                <span className="font-semibold text-[var(--color-on-surface)]">{form.owner_name || "partner"}</span>!<br />
                Kindly wait — your application is currently under review.<br />
                Our team will verify your details and get back to you shortly.
              </p>
            </div>
            <div className="bg-[var(--color-surface-subtle)] rounded-2xl p-4 text-left space-y-2">
              <p className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-widest mb-3">Submission Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-outline)]">Store</span>
                <span className="font-bold text-[var(--color-on-surface)]">{form.shop_name || "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-outline)]">Type</span>
                <span className="font-bold text-[var(--color-on-surface)] capitalize">{form.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-outline)]">Status</span>
                <span className="font-bold text-yellow-600">⏳ Pending Review</span>
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold hover:bg-[#a40017] transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-primary)]/5 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-[var(--color-on-surface)] tracking-tight">
            Partner with <span className="text-[var(--color-primary)]">MIIAM</span>
          </h1>
          <p className="text-[var(--color-outline)] mt-2">List your business and reach thousands of customers</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step > s.num ? "bg-green-500 text-white" :
                step === s.num ? "bg-[var(--color-primary)] text-white" :
                "bg-[var(--color-surface-container-high)] text-[var(--color-outline)]"
              }`}>
                {step > s.num ? "✓" : s.num}
              </div>
              <span className={`text-sm font-medium ${step === s.num ? "text-[var(--color-on-surface)]" : "text-[var(--color-outline-variant)]"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className={`w-12 h-0.5 ${step > s.num ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`} />}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl p-8 shadow-lg border border-[var(--color-border-subtle)]">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-[var(--color-on-surface)]">Owner Details</h2>
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
              <h2 className="text-xl font-extrabold text-[var(--color-on-surface)]">Shop Details</h2>
              <div>
                <label className={labelClass}>Shop Name *</label>
                <input type="text" value={form.shop_name} onChange={(e) => update("shop_name", e.target.value)} placeholder="e.g., The Burger Alchemist" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Store Type *</label>
                <select value={form.type} onChange={(e) => update("type", e.target.value)} className={inputClass}>
                  <option value="food">Food & Restaurant</option>
                  <option value="grocery">Grocery</option>
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
                <input type="checkbox" checked={form.is_pure_veg} onChange={(e) => update("is_pure_veg", e.target.checked)} className="w-5 h-5 accent-[var(--color-primary)]" />
                <span className={labelClass}>Pure Vegetarian Store</span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-[var(--color-on-surface)]">Business Documents</h2>
              <p className="text-sm text-[var(--color-outline)]">Provide your business documents for verification.</p>
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
              <h2 className="text-xl font-extrabold text-[var(--color-on-surface)]">Delivery Settings</h2>
              <p className="text-sm text-[var(--color-outline)]">Configure your delivery preferences.</p>
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
              <div className="bg-[var(--color-surface-subtle)] rounded-2xl p-6 mt-6">
                <h3 className="font-bold text-[var(--color-on-surface)] mb-3">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[var(--color-outline)]">Owner</span><span className="font-bold text-[var(--color-on-surface)]">{form.owner_name || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--color-outline)]">Store</span><span className="font-bold text-[var(--color-on-surface)]">{form.shop_name || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--color-outline)]">Type</span><span className="font-bold text-[var(--color-on-surface)]">{form.type}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--color-outline)]">Location</span><span className="font-bold text-[var(--color-on-surface)]">{[form.city, form.state].filter(Boolean).join(", ") || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--color-outline)]">Documents</span><span className="font-bold text-[var(--color-on-surface)]">{form.gst_number ? "GST ✓" : "No GST"}{form.fssai_number ? " • FSSAI ✓" : ""}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          {submitError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              ⚠️ {submitError}
            </div>
          )}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="px-6 py-3 border border-[var(--color-border-subtle)] text-[var(--color-on-surface-variant)] rounded-xl font-bold hover:bg-[var(--color-surface-subtle)] transition-colors">
                Back
              </button>
            ) : <div />}
            {step < 4 ? (
              <button onClick={() => setStep(step + 1)} className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold hover:bg-[#a40017] transition-colors">
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
