"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";

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
        const {
          data: { session },
        } = await supabase.auth.getSession();
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
      logger.error({ err }, "Resend error");
    }

    setTimeout(() => setResent(false), 2000);
  };

  const formatPhone = (phone: string) => {
    if (phone.length !== 10) return phone;
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[var(--color-surface-container-lowest)] to-white">
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container-lowest)] shadow-md"
        >
          <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
            arrow_back
          </span>
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
          <span
            className="material-symbols-outlined text-4xl text-[var(--color-accent)]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            sms
          </span>
        </div>

        <h1 className="mb-2 text-2xl font-black text-[var(--color-on-surface)]">
          Verify Your Number
        </h1>
        <p className="mb-8 text-center text-[var(--color-outline)]">
          We sent a 6-digit OTP to
          <br />
          <span className="font-bold text-[var(--color-accent)]">{formatPhone(phone)}</span>
        </p>

        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`h-14 w-12 rounded-xl border-2 text-center text-xl font-bold transition-colors ${
                  error
                    ? "border-red-300 bg-red-50"
                    : digit
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : "border-[var(--color-border-subtle)] bg-white"
                } focus:border-[var(--color-primary)] focus:outline-none`}
              />
            ))}
          </div>

          {error && <p className="mb-4 text-center text-sm text-red-500">{error}</p>}
          {isLoading && (
            <p className="mb-4 text-center text-sm text-[var(--color-outline)]">Verifying...</p>
          )}
        </div>

        <div className="text-center">
          {resendTimer > 0 ? (
            <p className="text-sm text-[var(--color-outline-variant)]">
              Resend OTP in{" "}
              <span className="font-bold text-[var(--color-accent)]">{resendTimer}s</span>
            </p>
          ) : (
            <button
              onClick={resendOTP}
              className="text-sm font-bold text-[var(--color-accent)] hover:underline"
            >
              {resent ? "OTP Sent!" : "Resend OTP"}
            </button>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-[var(--color-outline-variant)]">
          <p>Didn't receive the code?</p>
          <p className="mt-1">Check your phone signal and try again</p>
        </div>
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

export default function OTPVerificationPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OTPVerificationContent />
    </Suspense>
  );
}
