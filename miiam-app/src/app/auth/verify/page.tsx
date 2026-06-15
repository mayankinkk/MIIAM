"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function OTPVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const phone = searchParams.get("phone") || "";
  const purpose = searchParams.get("purpose") || "signup";
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [resent, setResent] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit) && value) {
      verifyOTP(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    if (pastedData.length === 6) {
      verifyOTP(pastedData);
    }
  };

  const verifyOTP = async (otpCode: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid OTP");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      if (data.userExists) {
        // Check if session exists before navigating to protected route
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push(`/app/home?verified=true`);
        } else {
          router.push(`/auth/login?verified=true`);
        }
      } else {
        router.push(`/auth/profile-setup?phone=${phone}`);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    setResent(true);
    setResendTimer(60);

    try {
      await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, purpose }),
      });
    } catch (err) {
      console.error("Resend error:", err);
    }

    setTimeout(() => setResent(false), 2000);
  };

  const formatPhone = (phone: string) => {
    if (phone.length !== 10) return phone;
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--color-surface-container-lowest)] to-white flex flex-col">
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-surface-container-lowest)] shadow-md"
        >
          <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">arrow_back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mb-8">
          <span className="material-symbols-outlined text-[var(--color-primary)] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            sms
          </span>
        </div>

        <h1 className="text-2xl font-black text-[var(--color-on-surface)] mb-2">Verify Your Number</h1>
        <p className="text-[var(--color-outline)] text-center mb-8">
          We sent a 6-digit OTP to<br />
          <span className="font-bold text-[var(--color-primary)]">{formatPhone(phone)}</span>
        </p>

        <div className="w-full max-w-sm">
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-colors ${
                  error
                    ? "border-red-300 bg-red-50"
                    : digit
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-[var(--color-border-subtle)] bg-white"
                } focus:border-[var(--color-primary)] focus:outline-none`}
              />
            ))}
          </div>

          {error && <p className="text-center text-red-500 text-sm mb-4">{error}</p>}
          {isLoading && <p className="text-center text-[var(--color-outline)] text-sm mb-4">Verifying...</p>}
        </div>

        <div className="text-center">
          {resendTimer > 0 ? (
            <p className="text-[var(--color-outline-variant)] text-sm">
              Resend OTP in <span className="font-bold text-[var(--color-primary)]">{resendTimer}s</span>
            </p>
          ) : (
            <button
              onClick={resendOTP}
              className="text-[var(--color-primary)] font-bold text-sm hover:underline"
            >
              {resent ? "OTP Sent!" : "Resend OTP"}
            </button>
          )}
        </div>

        <div className="mt-8 text-center text-[var(--color-outline-variant)] text-xs">
          <p>Didn't receive the code?</p>
          <p className="mt-1">Check your phone signal and try again</p>
        </div>
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

export default function OTPVerificationPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OTPVerificationContent />
    </Suspense>
  );
}