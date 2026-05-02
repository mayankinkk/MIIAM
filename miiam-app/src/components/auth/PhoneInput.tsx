"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PhoneInputProps {
  purpose?: "signup" | "login" | "password_reset";
  onSuccess?: (phone: string) => void;
}

export default function PhoneInput({ purpose = "signup", onSuccess }: PhoneInputProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, purpose }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send OTP");
        return;
      }

      // Navigate to OTP verification
      router.push(`/auth/verify?phone=${phone}&purpose=${purpose}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Mobile Number
        </label>
        <div className="flex gap-2">
          <div className="px-4 py-3 bg-slate-100 rounded-xl font-bold text-slate-600">
            +91
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
              setPhone(val);
            }}
            placeholder="Enter 10-digit number"
            className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/20 outline-none font-bold"
            maxLength={10}
          />
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={phone.length !== 10 || isLoading}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          phone.length === 10 && !isLoading
            ? "bg-[#ba001c] text-white hover:bg-[#a40017]"
            : "bg-slate-200 text-slate-400 cursor-not-allowed"
        }`}
      >
        {isLoading ? "Sending..." : "Send OTP"}
      </button>

      <p className="text-center text-xs text-slate-400">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}