"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function EmailVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const email = searchParams.get("email") || "";
  const purpose = searchParams.get("purpose") || "signup";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [resent, setResent] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d) && value) verifyOTP(newOtp.join(""));
  };

  const verifyOTP = async (code: string) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/email-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setOtp(["", "", "", "", "", ""]);
        return;
      }

      // For signup - go to set password page
      if (purpose === "signup") {
        router.push(`/auth/set-password?email=${encodeURIComponent(email)}`);
        return;
      }

      // For password reset - go to set new password with verified flag
      if (purpose === "password_reset") {
        // Set cookie by calling an API endpoint
        const cookieRes = await fetch("/api/auth/verify-cookie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, purpose: "password_reset" }),
        });
        if (!cookieRes.ok) {
          setError("Failed to verify. Please try again.");
          setIsLoading(false);
          return;
        }
        router.push(`/auth/set-password?email=${encodeURIComponent(email)}&password_reset=true`);
        return;
      }

      // For login - try to get or create session (existing user with password)
      router.push("/auth/login");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resend = async () => {
    if (resendTimer > 0) return;
    setResent(true);
    setResendTimer(60);
    await fetch("/api/auth/email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose }),
    });
    setTimeout(() => setResent(false), 2000);
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
            email
          </span>
        </div>
        <h1 className="mb-2 text-2xl font-black text-[var(--color-on-surface)]">
          Verify Your Email
        </h1>
        <p className="mb-8 text-center text-[var(--color-outline)]">
          We sent a 6-digit code to
          <br />
          <span className="font-bold text-[var(--color-accent)]">{email}</span>
        </p>
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center gap-2">
            {otp.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                className={`h-14 w-12 rounded-xl border-2 text-center text-xl font-bold ${error ? "border-red-300 bg-red-50 dark:bg-red-900/20" : d ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--color-border-subtle)] bg-white dark:bg-[var(--color-surface)]"} outline-none focus:border-[var(--color-primary)]`}
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
              Resend code in{" "}
              <span className="font-bold text-[var(--color-accent)]">{resendTimer}</span> seconds
            </p>
          ) : (
            <button
              onClick={resend}
              disabled={resent}
              className={`text-sm font-bold hover:underline ${resent ? "text-[var(--color-outline-variant)]" : "text-[var(--color-accent)]"}`}
            >
              {resent ? "Code sent!" : "Resend Code"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EmailVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[var(--color-surface-container-lowest)] to-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      }
    >
      <EmailVerifyContent />
    </Suspense>
  );
}
