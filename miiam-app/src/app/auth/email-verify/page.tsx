"use client";

import { useState, Suspense, useEffect } from "react";
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
  
  const inputRefs: any = [];

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
    if (value && index < 5) inputRefs[index + 1]?.focus();
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
      if (!res.ok) { setError(data.error); setOtp(["", "", "", "", "", ""]); return; }

      // For signup - go to set password page
      if (purpose === "signup") {
        router.push(`/auth/set-password?email=${encodeURIComponent(email)}`);
        return;
      }

      // For password reset - go to set new password with verified flag
      if (purpose === "password_reset") {
        // Set cookie by calling an API endpoint
        await fetch("/api/auth/verify-cookie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, purpose: "password_reset" }),
        });
        router.push(`/auth/set-password?email=${encodeURIComponent(email)}&password_reset=true`);
        return;
      }

      // For login - try to get or create session (existing user with password)
      router.push("/auth/login");
    } catch { setError("Something went wrong"); }
    finally { setIsLoading(false); }
  };

  const resend = async () => {
    if (resendTimer > 0) return;
    setResent(true);
    setResendTimer(60);
    await fetch("/api/auth/email-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, purpose }) });
    setTimeout(() => setResent(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff4f4] to-white flex flex-col">
      <div className="p-6">
        <button onClick={() => router.back()} className="w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 bg-[#ba001c]/10 rounded-full flex items-center justify-center mb-8">
          <span className="material-symbols-outlined text-[#ba001c] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>email</span>
        </div>
        <h1 className="text-2xl font-black text-[#4d212a] mb-2">Verify Your Email</h1>
        <p className="text-slate-500 text-center mb-8">We sent a 6-digit code to<br /><span className="font-bold text-[#ba001c]">{email}</span></p>
        <div className="w-full max-w-sm">
          <div className="flex justify-center gap-2 mb-6">
            {otp.map((d, i) => (
              <input key={i} ref={(el: any) => inputRefs[i] = el} type="text" inputMode="numeric" maxLength={1} value={d} onChange={(e) => handleChange(i, e.target.value)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 ${error ? "border-red-300 bg-red-50" : d ? "border-[#ba001c] bg-[#ba001c]/5" : "border-slate-200 bg-white"} focus:border-[#ba001c] outline-none`} />
            ))}
          </div>
          {error && <p className="text-center text-red-500 text-sm mb-4">{error}</p>}
          {isLoading && <p className="text-center text-slate-500 text-sm mb-4">Verifying...</p>}
        </div>
        <div className="text-center">
          {resendTimer > 0 ? (
            <p className="text-slate-400 text-sm">
              Resend code in <span className="font-bold text-[#ba001c]">{resendTimer}</span> seconds
            </p>
          ) : (
            <button 
              onClick={resend} 
              disabled={resent}
              className={`font-bold text-sm hover:underline ${resent ? "text-slate-400" : "text-[#ba001c]"}`}
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
  return <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-[#fff4f4] to-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" /></div>}><EmailVerifyContent /></Suspense>;
}