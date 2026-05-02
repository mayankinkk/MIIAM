"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata",
  "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Coimbatore",
  "Kochi", "Goa", "Indore", "Nagpur", "Surat", "Vadodara"
];

function ProfileSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const phoneFromVerify = searchParams.get("phone") || "";
  const emailFromVerify = searchParams.get("email") || "";
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: phoneFromVerify,
    email: emailFromVerify,
    city: "",
    location: "",
    dietary_preference: "both" as "veg" | "non_veg" | "both",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 1) return formData.full_name.trim().length > 0;
    if (step === 2) return formData.city.length > 0;
    return true;
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Check for session first
      let { data: { session } } = await supabase.auth.getSession();
      
      let user = session?.user;
      
      if (!user) {
        // Try to get user anyway
        const userData = await supabase.auth.getUser();
        user = userData.data.user;
      }

      if (user) {
        // We have a session - save profile directly
        if (formData.phone) {
          await supabase
            .from("users")
            .update({ 
              phone_verified: true, 
              phone_verified_at: new Date().toISOString(),
              phone: formData.phone,
              full_name: formData.full_name,
            })
            .eq("id", user.id);
        }

        if (formData.email) {
          await supabase
            .from("users")
            .update({ 
              email_verified: true, 
              email_verified_at: new Date().toISOString(),
              email: formData.email,
            })
            .eq("id", user.id);
        }

        const { error: profileError } = await supabase.from("profiles").upsert({
          id: user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          is_profile_complete: true,
          updated_at: new Date().toISOString(),
        });

        if (profileError) console.error("Profile error:", profileError);
      } else {
        // No session - save profile via server-side admin API
        console.log("[profile-setup] No session found, saving via admin API");
        const res = await fetch("/api/auth/save-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email || emailFromVerify,
            full_name: formData.full_name,
            phone: formData.phone,
            city: formData.city,
          }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          console.error("[profile-setup] Save profile error:", data.error);
        }
      }

      router.push("/app/explore");
      router.refresh();
    } catch (error) {
      console.error("Setup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff4f4] to-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-black text-[#4d212a] mb-2">Complete Your Profile</h1>
        <p className="text-slate-500 mb-8">Step {step} of 2</p>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all ${
                s <= step ? "bg-[#ba001c]" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="Enter phone number"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/20 outline-none"
              />
            </div>
            {emailFromVerify && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-100"
                />
              </div>
            )}
            <button
              onClick={() => setStep(2)}
              disabled={!canProceed()}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                canProceed() ? "bg-[#ba001c] text-white hover:bg-[#a40017]" : "bg-slate-200 text-slate-400"
              }`}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Select City</label>
              <div className="grid grid-cols-2 gap-2">
                {INDIAN_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => updateField("city", city)}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                      formData.city === city
                        ? "bg-[#ba001c] text-white"
                        : "bg-white border-2 border-slate-200 text-slate-600 hover:border-[#ba001c]"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:border-[#ba001c]"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={loading || !canProceed()}
                className="flex-1 py-4 bg-[#ba001c] text-white rounded-xl font-bold hover:bg-[#a00018] transition-all disabled:opacity-50"
              >
                {loading ? "Saving..." : "Complete Setup"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff4f4] to-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProfileSetupContent />
    </Suspense>
  );
}