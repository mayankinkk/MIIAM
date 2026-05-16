"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
];

const CITIES_BY_STATE: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore", "Kurnool", "Rajahmundry", "Kadapa", "Anantapur", "Vizianagaram"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro", "Pasighat", "Bomdila", "Daporijo", "Along", "Roing"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur", "Bongaigaon", "Tinsukia", "Diphu"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Katihar", "Purnia", "Arrah", "Bihar Sharif", "Danapur"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Durg", "Korba", "Rajnandgaon", "Ambikapur", "Jagdalpur"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Ponda", "Mapusa", "Benaulim", "Curchorem", "Canacona"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar", "Jamnagar", "Junagadh", "Anand", "Morbi"],
  "Haryana": ["Gurgaon", "Faridabad", "Panipat", "Karnal", "Rohtak", "Hisar", "Sonipat", "Yamunanagar", "Kurukshetra", "Ambala"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Mandi", "Solan", "Kullu", "Chamba", "Bilaspur", "Nahan", "Keylong"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih", "Ramgarh", "Phusro", "Chas"],
  "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum", "Gulbarga", "Bellary", "Davanagere", "Shimoga", "Tumkur"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Kannur", "Kottayam", "Palghat"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Navi Mumbai", "Sangli"],
  "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching", "Ukhrul", "Jirang", "Moirang", "Lilong", "Tamenglong"],
  "Meghalaya": ["Shillong", "Tura", "Jowai", "Baghmara", "Nongstoin", "Williamnagar", "Cherrapunji", "Mawkyrwat", "Khliehriat", "Ampati"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Kolasib", "Serchhip", "Mamit", "Saitlaw", "Hnahthial", "Khawzawl", "Siaha"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Mon", "Phek", "Longleng", "Kiphire"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur", "Puri", "Sambalpur", "Balasore", "Barbil", "Jeypore", "Angul"],
  "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Firozpur", "Kapurthala", "Moga"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Pilani", "Alwar", "Bhilwara", "Sikar"],
  "Sikkim": ["Gangtok", "Gyalshing", "Namchi", "Pelling", "Soreng", "Jorethang", "Mangan", "Rangpo", "Singtam", "Nayabazar"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur", "Vellore", "Erode", "Tirunelveli", "Thoothukudi"],
  "Telangana": ["Hyderabad", "Warangal", "Karimnagar", "Khammam", "Secunderabad", "Nizamabad", "Adilabad", "Ramagundam", "Siddipet", "Mancherial"],
  "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailashahar", "Belonia", "Khowai", "Bishramganj", "Amtali", "Bamancherra", "Chandpur"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Prayagraj", "Meerut", "Aligarh", "Bareilly", "Moradabad"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Roorkee", "Haldwani", "Nainital", "Kashipur", "Rudrapur", "Kotdwar", "Mussoorie"],
  "West Bengal": ["Kolkata", "Howrah", "Asansol", "Siliguri", "Durgapur", "Bardhaman", "Malda", "Kharagpur", "Berhampore", "Baharampur"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Vasant Kunj", "Saket", "Lajpat Nagar", "Karol Bagh", "Pitampura", "Janakpuri", "Mayur Vihar"]
};

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
    state: "",
    city: "",
    location: "",
    dietary_preference: "both" as "veg" | "non_veg" | "both",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 1) return formData.full_name.trim().length > 0;
    if (step === 2) return formData.state.length > 0;
    if (step === 3) return formData.city.length > 0;
    return true;
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let user = session?.user;
      
      if (!user) {
        const userResponse = await supabase.auth.getUser();
        user = userResponse.data?.user ?? undefined;
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
          state: formData.state,
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
            state: formData.state,
          }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          console.error("[profile-setup] Save profile error:", data.error);
        }
      }

      window.location.href = "/app/explore";
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
        <p className="text-slate-500 mb-8">Step {step} of 3</p>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
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

        {/* Step 2: State Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Select State</label>
              <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
                {INDIAN_STATES.map((state) => (
                  <button
                    key={state}
                    onClick={() => {
                      updateField("state", state);
                      updateField("city", "");
                    }}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                      formData.state === state
                        ? "bg-[#ba001c] text-white"
                        : "bg-white border-2 border-slate-200 text-slate-600 hover:border-[#ba001c]"
                    }`}
                  >
                    {state}
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
                onClick={() => setStep(3)}
                disabled={!canProceed()}
                className="flex-1 py-4 bg-[#ba001c] text-white rounded-xl font-bold hover:bg-[#a00018] transition-all disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: City Selection */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-2">Selected: <span className="font-bold text-slate-700">{formData.state}</span></p>
              <label className="block text-sm font-bold text-slate-700 mb-2">Select City</label>
              <div className="grid grid-cols-2 gap-2 max-h-[45vh] overflow-y-auto">
                {(CITIES_BY_STATE[formData.state] || []).map((city) => (
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
                onClick={() => setStep(2)}
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