"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BlurImage from "@/components/BlurImage";
import logger from "@/lib/logger";

const INDIAN_STATES = [
  "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana",
  "Uttar Pradesh", "West Bengal", "Gujarat", "Rajasthan", "Haryana",
  "Punjab", "Kerala", "Andhra Pradesh", "Madhya Pradesh", "Bihar",
  "Odisha", "Assam", "Jharkhand", "Chhattisgarh", "Uttarakhand",
  "Himachal Pradesh", "Goa", "Arunachal Pradesh", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura"
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
  const [avatarUrl, setAvatarUrl] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    phone: phoneFromVerify,
    email: emailFromVerify,
    state: "",
    city: "",
    location: "",
    dietary_preference: "both" as "veg" | "non_veg" | "both",
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, full_name, email")
        .eq("id", session.user.id)
        .single();
      if (profile) {
        if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        if (profile.full_name) updateField("full_name", profile.full_name);
        if (profile.email && !emailFromVerify) updateField("email", profile.email);
      }
    }
    loadProfile();
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [skipProfile, setSkipProfile] = useState(false);

  const canProceed = () => {
    if (step === 1) return formData.full_name.trim().length > 0;
    if (step === 2) return formData.state.length > 0 || skipProfile;
    if (step === 3) return formData.city.length > 0 || skipProfile;
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

      const profileData: Record<string, any> = {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        is_profile_complete: !skipProfile,
        updated_at: new Date().toISOString(),
      };

      if (formData.city) profileData.city = formData.city;
      if (formData.state) profileData.state = formData.state;

      if (user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: user.id,
          ...profileData,
        });

        if (profileError) logger.error({ err: profileError }, "Profile error");

        // Send welcome email
        try {
          await fetch("/api/emails/welcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: formData.full_name || user.email?.split("@")[0] || "there",
            }),
          });
        } catch { /* non-critical */ }
      } else {
        logger.info("[profile-setup] No session found, saving via admin API");
        const res = await fetch("/api/auth/save-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email || emailFromVerify,
            ...profileData,
          }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          logger.error({ err: data.error }, "[profile-setup] Save profile error");
        }
      }

      // Show celebration briefly before redirect
      setLoading(false);
      await new Promise(r => setTimeout(r, 800));
      router.push(searchParams.get("redirect") || "/app/home");
    } catch (error) {
      logger.error({ err: error }, "Setup error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-surface-container-lowest)] to-white p-6">
      <div className="max-w-md mx-auto">
        {avatarUrl && (
          <div className="flex justify-center mb-6">
            <BlurImage
              src={avatarUrl}
              alt="Profile"
              className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
              width={80}
              height={80}
            />
          </div>
        )}
        <h1 className="text-2xl font-black text-[var(--color-on-surface)] mb-1">Complete Your Profile</h1>
        <p className="text-[var(--color-outline)] mb-4">Step {step} of 3</p>

        {/* Incentive Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
          <span className="text-2xl">🎁</span>
          <div>
            <p className="text-sm font-bold text-amber-800">Complete your profile & unlock 10% OFF</p>
            <p className="text-xs text-amber-700">Your first order deserves a warm welcome!</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex gap-2 mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  s <= step ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-container-high)]"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-[var(--color-outline-variant)] text-right">{Math.round((step / 3) * 100)}% complete</p>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-2">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-border-subtle)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
              />
              <p className="text-xs text-[var(--color-outline-variant)] mt-1 ml-1">Enter your full name as you'd like it shown on your profile</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-border-subtle)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
              />
              <p className="text-xs text-[var(--color-outline-variant)] mt-1 ml-1">Used for order updates and delivery coordination</p>
            </div>
            {emailFromVerify && (
              <div>
                <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface-container)]"
                />
              </div>
            )}
            <button
              onClick={() => setStep(2)}
              disabled={!canProceed()}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                canProceed() ? "bg-[var(--color-primary)] text-white hover:bg-[#a40017]" : "bg-[var(--color-surface-container-high)] text-[var(--color-outline-variant)]"
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
              <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-2">Select State</label>
              <p className="text-xs text-[var(--color-outline-variant)] mb-3">Select your state to find services near you, or skip for now.</p>
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
                        ? "bg-[var(--color-primary)] text-white"
                        : "bg-[var(--color-surface-container-lowest)] border-2 border-[var(--color-border-subtle)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
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
                className="flex-1 py-4 border-2 border-[var(--color-border-subtle)] rounded-xl font-bold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setSkipProfile(true);
                  handleComplete();
                }}
                className="flex-1 py-4 border-2 border-[var(--color-border-subtle)] rounded-xl font-bold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
              >
                Skip for now
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.state}
                className="flex-1 py-4 bg-[var(--color-primary)] text-white rounded-xl font-bold hover:bg-[#a00018] transition-all disabled:opacity-50"
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
              <p className="text-sm text-[var(--color-outline)] mb-2">Selected: <span className="font-bold text-[var(--color-on-surface)]">{formData.state}</span></p>
              <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-2">Select City</label>
              <p className="text-xs text-[var(--color-outline-variant)] mb-3">Choose your city to discover nearby services, or skip for now.</p>
              {(CITIES_BY_STATE[formData.state] || []).length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-[45vh] overflow-y-auto">
                  {(CITIES_BY_STATE[formData.state] || []).map((city) => (
                    <button
                      key={city}
                      onClick={() => updateField("city", city)}
                      className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                        formData.city === city
                          ? "bg-[var(--color-primary)] text-white"
                          : "bg-[var(--color-surface-container-lowest)] border-2 border-[var(--color-border-subtle)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-[var(--color-surface-subtle)] rounded-xl">
                  <span className="material-symbols-outlined text-3xl text-[var(--color-outline-variant)]/60">location_city</span>
                  <p className="text-sm text-[var(--color-outline-variant)] mt-2">No cities listed yet for this state</p>
                  <p className="text-xs text-[var(--color-outline-variant)]/60 mt-1">You can skip this step and set it later</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 border-2 border-[var(--color-border-subtle)] rounded-xl font-bold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setSkipProfile(true);
                  handleComplete();
                }}
                className="flex-1 py-4 border-2 border-[var(--color-border-subtle)] rounded-xl font-bold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
              >
                Skip for now
              </button>
              <button
                onClick={handleComplete}
                disabled={loading || !canProceed()}
                className="flex-1 py-4 bg-[var(--color-primary)] text-white rounded-xl font-bold hover:bg-[#a00018] transition-all disabled:opacity-50"
              >
                {loading ? "Saving..." : "Complete Setup"}
              </button>
            </div>
          </div>
        )}

        {/* Completion celebration overlay */}
        {loading && (
          <div className="fixed inset-0 bg-[var(--color-surface-container-lowest)]/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center animate-fade-in">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-xl font-black text-[var(--color-on-surface)]">Welcome to MIIAM!</p>
              <p className="text-sm text-[var(--color-outline)] mt-2">Your 10% off coupon is waiting...</p>
              <div className="mt-4 w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-surface-container-lowest)] to-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
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