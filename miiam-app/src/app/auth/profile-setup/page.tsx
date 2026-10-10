"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BlurImage from "@/components/BlurImage";
import logger from "@/lib/logger";

const INDIAN_STATES = [
  "Maharashtra",
  "Delhi",
  "Karnataka",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
  "Gujarat",
  "Rajasthan",
  "Haryana",
  "Punjab",
  "Kerala",
  "Andhra Pradesh",
  "Madhya Pradesh",
  "Bihar",
  "Odisha",
  "Assam",
  "Jharkhand",
  "Chhattisgarh",
  "Uttarakhand",
  "Himachal Pradesh",
  "Goa",
  "Arunachal Pradesh",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Sikkim",
  "Tripura",
];

const CITIES_BY_STATE: Record<string, string[]> = {
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Tirupati",
    "Nellore",
    "Kurnool",
    "Rajahmundry",
    "Kadapa",
    "Anantapur",
    "Vizianagaram",
  ],
  "Arunachal Pradesh": [
    "Itanagar",
    "Tawang",
    "Ziro",
    "Pasighat",
    "Bomdila",
    "Daporijo",
    "Along",
    "Roing",
  ],
  Assam: [
    "Guwahati",
    "Silchar",
    "Dibrugarh",
    "Jorhat",
    "Tezpur",
    "Bongaigaon",
    "Tinsukia",
    "Diphu",
  ],
  Bihar: [
    "Patna",
    "Gaya",
    "Bhagalpur",
    "Muzaffarpur",
    "Darbhanga",
    "Katihar",
    "Purnia",
    "Arrah",
    "Bihar Sharif",
    "Danapur",
  ],
  Chhattisgarh: [
    "Raipur",
    "Bhilai",
    "Bilaspur",
    "Durg",
    "Korba",
    "Rajnandgaon",
    "Ambikapur",
    "Jagdalpur",
  ],
  Goa: [
    "Panaji",
    "Margao",
    "Vasco da Gama",
    "Ponda",
    "Mapusa",
    "Benaulim",
    "Curchorem",
    "Canacona",
  ],
  Gujarat: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Gandhinagar",
    "Bhavnagar",
    "Jamnagar",
    "Junagadh",
    "Anand",
    "Morbi",
  ],
  Haryana: [
    "Gurgaon",
    "Faridabad",
    "Panipat",
    "Karnal",
    "Rohtak",
    "Hisar",
    "Sonipat",
    "Yamunanagar",
    "Kurukshetra",
    "Ambala",
  ],
  "Himachal Pradesh": [
    "Shimla",
    "Manali",
    "Dharamshala",
    "Mandi",
    "Solan",
    "Kullu",
    "Chamba",
    "Bilaspur",
    "Nahan",
    "Keylong",
  ],
  Jharkhand: [
    "Ranchi",
    "Jamshedpur",
    "Dhanbad",
    "Bokaro",
    "Deoghar",
    "Hazaribagh",
    "Giridih",
    "Ramgarh",
    "Phusro",
    "Chas",
  ],
  Karnataka: [
    "Bangalore",
    "Mysore",
    "Mangalore",
    "Hubli",
    "Belgaum",
    "Gulbarga",
    "Bellary",
    "Davanagere",
    "Shimoga",
    "Tumkur",
  ],
  Kerala: [
    "Thiruvananthapuram",
    "Kochi",
    "Kozhikode",
    "Thrissur",
    "Kollam",
    "Palakkad",
    "Alappuzha",
    "Kannur",
    "Kottayam",
    "Palghat",
  ],
  "Madhya Pradesh": [
    "Bhopal",
    "Indore",
    "Jabalpur",
    "Gwalior",
    "Ujjain",
    "Sagar",
    "Dewas",
    "Satna",
    "Ratlam",
    "Rewa",
  ],
  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Thane",
    "Nashik",
    "Aurangabad",
    "Solapur",
    "Kolhapur",
    "Navi Mumbai",
    "Sangli",
  ],
  Manipur: [
    "Imphal",
    "Thoubal",
    "Bishnupur",
    "Churachandpur",
    "Kakching",
    "Ukhrul",
    "Jirang",
    "Moirang",
    "Lilong",
    "Tamenglong",
  ],
  Meghalaya: [
    "Shillong",
    "Tura",
    "Jowai",
    "Baghmara",
    "Nongstoin",
    "Williamnagar",
    "Cherrapunji",
    "Mawkyrwat",
    "Khliehriat",
    "Ampati",
  ],
  Mizoram: [
    "Aizawl",
    "Lunglei",
    "Champhai",
    "Kolasib",
    "Serchhip",
    "Mamit",
    "Saitlaw",
    "Hnahthial",
    "Khawzawl",
    "Siaha",
  ],
  Nagaland: [
    "Kohima",
    "Dimapur",
    "Mokokchung",
    "Tuensang",
    "Wokha",
    "Zunheboto",
    "Mon",
    "Phek",
    "Longleng",
    "Kiphire",
  ],
  Odisha: [
    "Bhubaneswar",
    "Cuttack",
    "Rourkela",
    "Brahmapur",
    "Puri",
    "Sambalpur",
    "Balasore",
    "Barbil",
    "Jeypore",
    "Angul",
  ],
  Punjab: [
    "Chandigarh",
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Patiala",
    "Bathinda",
    "Mohali",
    "Firozpur",
    "Kapurthala",
    "Moga",
  ],
  Rajasthan: [
    "Jaipur",
    "Jodhpur",
    "Udaipur",
    "Kota",
    "Bikaner",
    "Ajmer",
    "Pilani",
    "Alwar",
    "Bhilwara",
    "Sikar",
  ],
  Sikkim: [
    "Gangtok",
    "Gyalshing",
    "Namchi",
    "Pelling",
    "Soreng",
    "Jorethang",
    "Mangan",
    "Rangpo",
    "Singtam",
    "Nayabazar",
  ],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
    "Tiruppur",
    "Vellore",
    "Erode",
    "Tirunelveli",
    "Thoothukudi",
  ],
  Telangana: [
    "Hyderabad",
    "Warangal",
    "Karimnagar",
    "Khammam",
    "Secunderabad",
    "Nizamabad",
    "Adilabad",
    "Ramagundam",
    "Siddipet",
    "Mancherial",
  ],
  Tripura: [
    "Agartala",
    "Udaipur",
    "Dharmanagar",
    "Kailashahar",
    "Belonia",
    "Khowai",
    "Bishramganj",
    "Amtali",
    "Bamancherra",
    "Chandpur",
  ],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Ghaziabad",
    "Agra",
    "Varanasi",
    "Prayagraj",
    "Meerut",
    "Aligarh",
    "Bareilly",
    "Moradabad",
  ],
  Uttarakhand: [
    "Dehradun",
    "Haridwar",
    "Rishikesh",
    "Roorkee",
    "Haldwani",
    "Nainital",
    "Kashipur",
    "Rudrapur",
    "Kotdwar",
    "Mussoorie",
  ],
  "West Bengal": [
    "Kolkata",
    "Howrah",
    "Asansol",
    "Siliguri",
    "Durgapur",
    "Bardhaman",
    "Malda",
    "Kharagpur",
    "Berhampore",
    "Baharampur",
  ],
  Delhi: [
    "New Delhi",
    "Dwarka",
    "Rohini",
    "Vasant Kunj",
    "Saket",
    "Lajpat Nagar",
    "Karol Bagh",
    "Pitampura",
    "Janakpuri",
    "Mayur Vihar",
  ],
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      const {
        data: { session },
      } = await supabase.auth.getSession();

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
        } catch {
          /* non-critical */
        }
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
      await new Promise((r) => setTimeout(r, 800));
      router.push(searchParams.get("redirect") || "/app/home");
    } catch (error) {
      logger.error({ err: error }, "Setup error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-surface-container-lowest)] to-white p-6">
      <div className="mx-auto max-w-md">
        {avatarUrl && (
          <div className="mb-6 flex justify-center">
            <BlurImage
              src={avatarUrl}
              alt="Profile"
              className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-lg"
              width={80}
              height={80}
            />
          </div>
        )}
        <h1 className="mb-1 text-2xl font-black text-[var(--color-on-surface)]">
          Complete Your Profile
        </h1>
        <p className="mb-4 text-[var(--color-outline)]">Step {step} of 3</p>

        {/* Incentive Banner */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
          <span className="text-2xl">🎁</span>
          <div>
            <p className="text-sm font-bold text-amber-800">
              Complete your profile & unlock 10% OFF
            </p>
            <p className="text-xs text-amber-700">Your first order deserves a warm welcome!</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  s <= step
                    ? "bg-[var(--color-primary)]"
                    : "bg-[var(--color-surface-container-high)]"
                }`}
              />
            ))}
          </div>
          <p className="text-right text-xs text-[var(--color-outline-variant)]">
            {Math.round((step / 3) * 100)}% complete
          </p>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-[var(--color-on-surface)]">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-xl border-2 border-[var(--color-border-subtle)] px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
              <p className="mt-1 ml-1 text-xs text-[var(--color-outline-variant)]">
                Enter your full name as you'd like it shown on your profile
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[var(--color-on-surface)]">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full rounded-xl border-2 border-[var(--color-border-subtle)] px-4 py-3 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
              <p className="mt-1 ml-1 text-xs text-[var(--color-outline-variant)]">
                Used for order updates and delivery coordination
              </p>
            </div>
            {emailFromVerify && (
              <div>
                <label className="mb-2 block text-sm font-bold text-[var(--color-on-surface)]">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full rounded-xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface-container)] px-4 py-3"
                />
              </div>
            )}
            <button
              onClick={() => setStep(2)}
              disabled={!canProceed()}
              className={`w-full rounded-xl py-4 text-lg font-bold transition-all ${
                canProceed()
                  ? "text-on-primary bg-[var(--color-primary)] hover:bg-[#e5b62e]"
                  : "bg-[var(--color-surface-container-high)] text-[var(--color-outline-variant)]"
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
              <label className="mb-2 block text-sm font-bold text-[var(--color-on-surface)]">
                Select State
              </label>
              <p className="mb-3 text-xs text-[var(--color-outline-variant)]">
                Select your state to find services near you, or skip for now.
              </p>
              <div className="grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto">
                {INDIAN_STATES.map((state) => (
                  <button
                    key={state}
                    onClick={() => {
                      updateField("state", state);
                      updateField("city", "");
                    }}
                    className={`rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                      formData.state === state
                        ? "text-on-primary bg-[var(--color-primary)]"
                        : "border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
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
                className="flex-1 rounded-xl border-2 border-[var(--color-border-subtle)] py-4 font-bold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setSkipProfile(true);
                  handleComplete();
                }}
                className="flex-1 rounded-xl border-2 border-[var(--color-border-subtle)] py-4 font-bold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
              >
                Skip for now
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.state}
                className="text-on-primary flex-1 rounded-xl bg-[var(--color-primary)] py-4 font-bold transition-all hover:bg-[#e5b62e] disabled:opacity-50"
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
              <p className="mb-2 text-sm text-[var(--color-outline)]">
                Selected:{" "}
                <span className="font-bold text-[var(--color-on-surface)]">{formData.state}</span>
              </p>
              <label className="mb-2 block text-sm font-bold text-[var(--color-on-surface)]">
                Select City
              </label>
              <p className="mb-3 text-xs text-[var(--color-outline-variant)]">
                Choose your city to discover nearby services, or skip for now.
              </p>
              {(CITIES_BY_STATE[formData.state] || []).length > 0 ? (
                <div className="grid max-h-[45vh] grid-cols-2 gap-2 overflow-y-auto">
                  {(CITIES_BY_STATE[formData.state] || []).map((city) => (
                    <button
                      key={city}
                      onClick={() => updateField("city", city)}
                      className={`rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                        formData.city === city
                          ? "text-on-primary bg-[var(--color-primary)]"
                          : "border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-[var(--color-surface-subtle)] py-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-[var(--color-outline-variant)]/60">
                    location_city
                  </span>
                  <p className="mt-2 text-sm text-[var(--color-outline-variant)]">
                    No cities listed yet for this state
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-outline-variant)]/60">
                    You can skip this step and set it later
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl border-2 border-[var(--color-border-subtle)] py-4 font-bold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setSkipProfile(true);
                  handleComplete();
                }}
                className="flex-1 rounded-xl border-2 border-[var(--color-border-subtle)] py-4 font-bold text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
              >
                Skip for now
              </button>
              <button
                onClick={handleComplete}
                disabled={loading || !canProceed()}
                className="text-on-primary flex-1 rounded-xl bg-[var(--color-primary)] py-4 font-bold transition-all hover:bg-[#e5b62e] disabled:opacity-50"
              >
                {loading ? "Saving..." : "Complete Setup"}
              </button>
            </div>
          </div>
        )}

        {/* Completion celebration overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-surface-container-lowest)]/80 backdrop-blur-sm">
            <div className="animate-fade-in text-center">
              <div className="mb-4 text-6xl">🎉</div>
              <p className="text-xl font-black text-[var(--color-on-surface)]">Welcome to MIIAM!</p>
              <p className="mt-2 text-sm text-[var(--color-outline)]">
                Your 10% off coupon is waiting...
              </p>
              <div className="mx-auto mt-4 h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[var(--color-surface-container-lowest)] to-white">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
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
