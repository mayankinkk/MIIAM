"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RiderApplyPage() {
  const [step, setStep] = useState<"details" | "docs" | "vehicle">("details");
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    profile_photo: null as File | null,
    id_proof_type: "",
    id_proof_image: null as File | null,
    vehicle_type: "motorcycle",
    vehicle_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("full_name", formData.full_name);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("vehicle_type", formData.vehicle_type);
      data.append("vehicle_number", formData.vehicle_number);
      data.append("id_proof_type", formData.id_proof_type);
      if (formData.profile_photo) data.append("profile_photo", formData.profile_photo);
      if (formData.id_proof_image) data.append("id_proof_image", formData.id_proof_image);

      const res = await fetch("/api/riders/apply", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      
      if (!res.ok) {
        setError(result.error || "Failed to submit application");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-12 max-w-lg w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-green-600 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h1 className="text-3xl font-black text-[#4d212a] mb-4">Application Submitted!</h1>
          <p className="text-[#814c55] mb-8">
            Thank you for applying to join MIIAM Fleet. We'll review your application and get back to you within 24-48 hours.
          </p>
          <Link 
            href="/rider/login" 
            className="block w-full bg-[#ba001c] text-white py-4 rounded-xl font-bold text-center hover:bg-[#a00019] transition-all"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff4f4] flex flex-col md:flex-row">
      <div className="md:w-1/2 p-12 md:p-24 flex flex-col justify-center relative bg-white">
        <Link href="/" className="absolute top-8 left-8 text-3xl font-black text-[#ba001c] tracking-tighter">
          MIIAM
        </Link>
        <Link href="/rider/login" className="absolute top-8 right-8 text-sm font-bold text-[#814c55] hover:text-[#ba001c]">
          Already have an account? Login
        </Link>
        <div className="max-w-md w-full mx-auto">
          <span className="text-[#0b50d5] font-bold text-sm tracking-widest uppercase mb-4 block">Fleet Network</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#4d212a] mb-4 tracking-tight">
            Join the <br/> fleet.
          </h1>
          <p className="text-[#814c55] text-lg mb-8">Complete the form below to apply as a MIIAM rider.</p>

          {/* Progress Steps */}
          <div className="flex gap-2 mb-8">
            {["details", "docs", "vehicle"].map((s, i) => (
              <div 
                key={s} 
                className={`flex-1 h-2 rounded-full transition-all ${
                  step === s ? "bg-[#ba001c]" : 
                  (step === "docs" && s === "details") || (step === "vehicle" && s !== "vehicle") ? "bg-[#dd9ca6]" : "bg-[#f0d0d4]"
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#f95630]/10 border border-[#f95630]/30 rounded-xl text-[#b02500] text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === "details" && (
              <div className="space-y-5 animate-[slideUp_0.3s_ease-out]">
                <div>
                  <label className="block text-xs font-bold text-[#4d212a] mb-2 uppercase tracking-widest px-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full bg-[#ffecee] border border-[#dd9ca6]/30 rounded-xl px-5 py-4 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#ba001c]/40 transition-all text-[#4d212a]"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4d212a] mb-2 uppercase tracking-widest px-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#ffecee] border border-[#dd9ca6]/30 rounded-xl px-5 py-4 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#ba001c]/40 transition-all text-[#4d212a]"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4d212a] mb-2 uppercase tracking-widest px-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#ffecee] border border-[#dd9ca6]/30 rounded-xl px-5 py-4 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#ba001c]/40 transition-all text-[#4d212a]"
                    placeholder="+91XXXXXXXXXX"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setStep("docs")}
                  disabled={!formData.full_name || !formData.email || !formData.phone}
                  className="w-full bento-gradient-blue text-white rounded-xl py-5 text-lg font-bold shadow-lg shadow-[#0b50d5]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
                >
                  Continue
                </button>
              </div>
            )}

            {step === "docs" && (
              <div className="space-y-5 animate-[slideUp_0.3s_ease-out]">
                <div>
                  <label className="block text-xs font-bold text-[#4d212a] mb-2 uppercase tracking-widest px-1">Profile Photo</label>
                  <div className="border-2 border-dashed border-[#dd9ca6] rounded-xl p-6 text-center hover:bg-[#fff8f7] transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, profile_photo: e.target.files?.[0] || null })}
                      className="hidden"
                      id="profile-upload"
                    />
                    <label htmlFor="profile-upload" className="cursor-pointer">
                      {formData.profile_photo ? (
                        <div className="flex items-center justify-center gap-3">
                          <span className="material-symbols-outlined text-green-600">check_circle</span>
                          <span className="font-bold text-[#4d212a]">{formData.profile_photo.name}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="material-symbols-outlined text-4xl text-[#dd9ca6]">add_a_photo</span>
                          <p className="text-sm text-[#814c55] mt-2">Tap to upload photo</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4d212a] mb-2 uppercase tracking-widest px-1">ID Proof Type</label>
                  <select
                    required
                    value={formData.id_proof_type}
                    onChange={(e) => setFormData({ ...formData, id_proof_type: e.target.value, id_proof_image: null })}
                    className="w-full bg-[#ffecee] border border-[#dd9ca6]/30 rounded-xl px-5 py-4 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#ba001c]/40 transition-all text-[#4d212a]"
                  >
                    <option value="">Select ID type</option>
                    <option value="aadhar">Aadhar Card</option>
                    <option value="dl">Driving License</option>
                    <option value="voter">Voter ID</option>
                    <option value="pan">PAN Card</option>
                  </select>
                </div>
                {formData.id_proof_type && (
                  <div>
                    <label className="block text-xs font-bold text-[#4d212a] mb-2 uppercase tracking-widest px-1">Upload {formData.id_proof_type.toUpperCase()}</label>
                    <div className="border-2 border-dashed border-[#dd9ca6] rounded-xl p-6 text-center hover:bg-[#fff8f7] transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({ ...formData, id_proof_image: e.target.files?.[0] || null })}
                        className="hidden"
                        id="id-upload"
                      />
                      <label htmlFor="id-upload" className="cursor-pointer">
                        {formData.id_proof_image ? (
                          <div className="flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-green-600">check_circle</span>
                            <span className="font-bold text-[#4d212a]">{formData.id_proof_image.name}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="material-symbols-outlined text-4xl text-[#dd9ca6]">badge</span>
                            <p className="text-sm text-[#814c55] mt-2">Tap to upload ID document</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="flex-1 py-5 bg-[#f0d0d4] text-[#4d212a] rounded-xl font-bold hover:bg-[#dd9ca6] transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("vehicle")}
                    disabled={!formData.profile_photo || !formData.id_proof_type || !formData.id_proof_image}
                    className="flex-1 bento-gradient-blue text-white rounded-xl font-bold shadow-lg shadow-[#0b50d5]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === "vehicle" && (
              <div className="space-y-5 animate-[slideUp_0.3s_ease-out]">
                <div>
                  <label className="block text-xs font-bold text-[#4d212a] mb-2 uppercase tracking-widest px-1">Vehicle Type</label>
                  <select
                    required
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value, vehicle_number: "" })}
                    className="w-full bg-[#ffecee] border border-[#dd9ca6]/30 rounded-xl px-5 py-4 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#ba001c]/40 transition-all text-[#4d212a]"
                  >
                    <option value="motorcycle">Motorcycle</option>
                    <option value="scooty">Scooty</option>
                    <option value="bicycle">Bicycle</option>
                  </select>
                </div>
                {(formData.vehicle_type === "motorcycle" || formData.vehicle_type === "scooty") && (
                  <div>
                    <label className="block text-xs font-bold text-[#4d212a] mb-2 uppercase tracking-widest px-1">Vehicle Number</label>
                    <input
                      type="text"
                      required
                      value={formData.vehicle_number}
                      onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                      className="w-full bg-[#ffecee] border border-[#dd9ca6]/30 rounded-xl px-5 py-4 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#ba001c]/40 transition-all text-[#4d212a]"
                      placeholder="AS 01 AB 1234"
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("docs")}
                    className="flex-1 py-5 bg-[#f0d0d4] text-[#4d212a] rounded-xl font-bold hover:bg-[#dd9ca6] transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (formData.vehicle_type !== "bicycle" && !formData.vehicle_number)}
                    className="flex-1 bento-gradient-red text-white rounded-xl py-5 text-lg font-bold shadow-lg shadow-[#ba001c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
                  >
                    {loading ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
      <div className="hidden md:block md:w-1/2 bg-[#ba001c] relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMs7iF1l6q72X44B4k_1288bT7cR8iT6ApejS0e_P22k1uYx9YI9zTXXP7Z8T39H5Q0A9f_2WbI6Qe9q8A1D3Yt_E1yZtBqZ2W5TfO27vC-w4m12yX_Y1239O9U2I97Y3yI6C6O28c4w09o5IqD9Z288Q3oU2D1G375_C1P31Z_pP7Y78I6T_7oA_XW2X8t3oGZ"
            alt="Rider on motorcycle"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="text-white text-3xl font-black mb-4">Earn on your own terms</h2>
          <div className="space-y-4 text-white/80">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
              <span>Flexible hours</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              <span>Daily earnings</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}