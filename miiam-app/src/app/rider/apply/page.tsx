"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";
import BlurImage from "@/components/BlurImage";

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
  const supabase = useMemo(() => createClient(), []);

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
      logger.error({ err }, "Rider application submit failed");
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-container-lowest)] p-6">
        <div className="w-full max-w-lg rounded-3xl bg-[var(--color-surface-container-lowest)] p-12 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <span
              className="material-symbols-outlined text-4xl text-green-600"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h1 className="mb-4 text-3xl font-black text-[var(--color-on-surface)]">
            Application Submitted!
          </h1>
          <p className="mb-8 text-[var(--color-on-surface-variant)]">
            Thank you for applying to join MIIAM Fleet. We'll review your application and get back
            to you within 24-48 hours.
          </p>
          <Link
            href="/rider/login"
            className="bg-primary text-on-primary hover:bg-primary-dim block w-full rounded-xl py-4 text-center font-bold transition-all"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-surface-container-lowest)] md:flex-row">
      <div className="relative flex flex-col justify-center bg-white p-12 md:w-1/2 md:p-24 dark:bg-[var(--color-surface)]">
        <Link
          href="/"
          className="absolute top-8 left-8 text-3xl font-black tracking-tighter text-[var(--color-primary)]"
        >
          MIIAM
        </Link>
        <Link
          href="/rider/login"
          className="absolute top-8 right-8 text-sm font-bold text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]"
        >
          Already have an account? Login
        </Link>
        <div className="mx-auto w-full max-w-md">
          <span className="text-brand-secondary mb-4 block text-sm font-bold tracking-widest uppercase">
            Fleet Network
          </span>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-[var(--color-on-surface)] md:text-5xl">
            Join the <br /> fleet.
          </h1>
          <p className="mb-8 text-lg text-[var(--color-on-surface-variant)]">
            Complete the form below to apply as a MIIAM rider.
          </p>

          {/* Progress Steps */}
          <div className="mb-8 flex gap-2">
            {["details", "docs", "vehicle"].map((s, i) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  step === s
                    ? "bg-[var(--color-primary)]"
                    : (step === "docs" && s === "details") ||
                        (step === "vehicle" && s !== "vehicle")
                      ? "bg-outline-variant"
                      : "bg-surface-container-high"
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="bg-error-container/10 border-error-container/30 text-error mb-6 rounded-xl border p-4 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === "details" && (
              <div className="animate-[slideUp_0.3s_ease-out] space-y-5">
                <div>
                  <label className="mb-2 block px-1 text-xs font-bold tracking-widest text-[var(--color-on-surface)] uppercase">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="bg-surface-container-low border-outline-variant/30 focus:ring-primary/40 text-on-surface w-full rounded-xl border px-5 py-4 text-lg font-semibold transition-all focus:ring-2 focus:outline-none"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="mb-2 block px-1 text-xs font-bold tracking-widest text-[var(--color-on-surface)] uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-surface-container-low border-outline-variant/30 focus:ring-primary/40 text-on-surface w-full rounded-xl border px-5 py-4 text-lg font-semibold transition-all focus:ring-2 focus:outline-none"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="mb-2 block px-1 text-xs font-bold tracking-widest text-[var(--color-on-surface)] uppercase">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-surface-container-low border-outline-variant/30 focus:ring-primary/40 text-on-surface w-full rounded-xl border px-5 py-4 text-lg font-semibold transition-all focus:ring-2 focus:outline-none"
                    placeholder="+91XXXXXXXXXX"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setStep("docs")}
                  disabled={!formData.full_name || !formData.email || !formData.phone}
                  className="bento-gradient-blue shadow-brand-secondary/20 w-full rounded-xl py-5 text-lg font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
                >
                  Continue
                </button>
              </div>
            )}

            {step === "docs" && (
              <div className="animate-[slideUp_0.3s_ease-out] space-y-5">
                <div>
                  <label className="mb-2 block px-1 text-xs font-bold tracking-widest text-[var(--color-on-surface)] uppercase">
                    Profile Photo
                  </label>
                  <div className="rounded-xl border-2 border-dashed border-[var(--color-outline-variant)] p-6 text-center transition-colors hover:bg-[var(--color-surface-container-lowest)]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setFormData({ ...formData, profile_photo: e.target.files?.[0] || null })
                      }
                      className="hidden"
                      id="profile-upload"
                    />
                    <label htmlFor="profile-upload" className="cursor-pointer">
                      {formData.profile_photo ? (
                        <div className="flex items-center justify-center gap-3">
                          <span className="material-symbols-outlined text-green-600">
                            check_circle
                          </span>
                          <span className="font-bold text-[var(--color-on-surface)]">
                            {formData.profile_photo.name}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="material-symbols-outlined text-4xl text-[var(--color-outline-variant)]">
                            add_a_photo
                          </span>
                          <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">
                            Tap to upload photo
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block px-1 text-xs font-bold tracking-widest text-[var(--color-on-surface)] uppercase">
                    ID Proof Type
                  </label>
                  <select
                    required
                    value={formData.id_proof_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        id_proof_type: e.target.value,
                        id_proof_image: null,
                      })
                    }
                    className="bg-surface-container-low border-outline-variant/30 focus:ring-primary/40 text-on-surface w-full rounded-xl border px-5 py-4 text-lg font-semibold transition-all focus:ring-2 focus:outline-none"
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
                    <label className="mb-2 block px-1 text-xs font-bold tracking-widest text-[var(--color-on-surface)] uppercase">
                      Upload {formData.id_proof_type.toUpperCase()}
                    </label>
                    <div className="rounded-xl border-2 border-dashed border-[var(--color-outline-variant)] p-6 text-center transition-colors hover:bg-[var(--color-surface-container-lowest)]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFormData({ ...formData, id_proof_image: e.target.files?.[0] || null })
                        }
                        className="hidden"
                        id="id-upload"
                      />
                      <label htmlFor="id-upload" className="cursor-pointer">
                        {formData.id_proof_image ? (
                          <div className="flex items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-green-600">
                              check_circle
                            </span>
                            <span className="font-bold text-[var(--color-on-surface)]">
                              {formData.id_proof_image.name}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="material-symbols-outlined text-4xl text-[var(--color-outline-variant)]">
                              badge
                            </span>
                            <p className="mt-2 text-sm text-[var(--color-on-surface-variant)]">
                              Tap to upload ID document
                            </p>
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
                    className="bg-surface-container-high text-on-surface hover:bg-outline-variant flex-1 rounded-xl py-5 font-bold transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("vehicle")}
                    disabled={
                      !formData.profile_photo || !formData.id_proof_type || !formData.id_proof_image
                    }
                    className="bento-gradient-blue shadow-brand-secondary/20 flex-1 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === "vehicle" && (
              <div className="animate-[slideUp_0.3s_ease-out] space-y-5">
                <div>
                  <label className="mb-2 block px-1 text-xs font-bold tracking-widest text-[var(--color-on-surface)] uppercase">
                    Vehicle Type
                  </label>
                  <select
                    required
                    value={formData.vehicle_type}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicle_type: e.target.value, vehicle_number: "" })
                    }
                    className="bg-surface-container-low border-outline-variant/30 focus:ring-primary/40 text-on-surface w-full rounded-xl border px-5 py-4 text-lg font-semibold transition-all focus:ring-2 focus:outline-none"
                  >
                    <option value="motorcycle">Motorcycle</option>
                    <option value="scooty">Scooty</option>
                    <option value="bicycle">Bicycle</option>
                  </select>
                </div>
                {(formData.vehicle_type === "motorcycle" || formData.vehicle_type === "scooty") && (
                  <div>
                    <label className="mb-2 block px-1 text-xs font-bold tracking-widest text-[var(--color-on-surface)] uppercase">
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vehicle_number}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })
                      }
                      className="bg-surface-container-low border-outline-variant/30 focus:ring-primary/40 text-on-surface w-full rounded-xl border px-5 py-4 text-lg font-semibold transition-all focus:ring-2 focus:outline-none"
                      placeholder="AS 01 AB 1234"
                    />
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("docs")}
                    className="bg-surface-container-high text-on-surface hover:bg-outline-variant flex-1 rounded-xl py-5 font-bold transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading || (formData.vehicle_type !== "bicycle" && !formData.vehicle_number)
                    }
                    className="bento-gradient-red flex-1 rounded-xl py-5 text-lg font-bold text-white shadow-[var(--color-primary)]/20 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
                  >
                    {loading ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-[var(--color-primary)] md:block md:w-1/2">
        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
          <BlurImage
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMs7iF1l6q72X44B4k_1288bT7cR8iT6ApejS0e_P22k1uYx9YI9zTXXP7Z8T39H5Q0A9f_2WbI6Qe9q8A1D3Yt_E1yZtBqZ2W5TfO27vC-w4m12yX_Y1239O9U2I97Y3yI6C6O28c4w09o5IqD9Z288Q3oU2D1G375_C1P31Z_pP7Y78I6T_7oA_XW2X8t3oGZ"
            alt="Rider on motorcycle"
            className="h-full w-full object-cover"
            fill
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute right-12 bottom-12 left-12">
          <h2 className="mb-4 text-3xl font-black text-white">Earn on your own terms</h2>
          <div className="space-y-4 text-white/80">
            <div className="flex items-center gap-3">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                schedule
              </span>
              <span>Flexible hours</span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                payments
              </span>
              <span>Daily earnings</span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                support_agent
              </span>
              <span>24/7 support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
