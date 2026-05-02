"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) { setError("Please enter a valid email"); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "password_reset" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setEmailSent(true);
    } catch { setError("Something went wrong"); }
    finally { setIsLoading(false); }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff8f7] p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
          </div>
          <h1 className="text-2xl font-black text-[#281716]">Check Your Email</h1>
          <p className="text-[#5c403d]">
            We sent a verification code to <span className="font-bold">{email}</span>
          </p>
          <Link 
            href={`/auth/email-verify?email=${encodeURIComponent(email)}&purpose=password_reset`}
            className="block w-full bg-[#ba001c] text-white font-bold py-4 rounded-xl hover:bg-[#a00017]"
          >
            Enter Verification Code
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-stretch overflow-hidden">
      <section className="flex-1 flex flex-col justify-center items-center px-6 md:px-16 lg:px-24 bg-[#fff8f7] relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-start gap-4">
            <Link href="/auth/login" className="text-[#5c403d] hover:text-[#ba001c]">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <span className="text-2xl font-black tracking-tighter text-[#8d0013]">MIIAM</span>
            <div className="space-y-2">
              <h1 className="text-[3rem] leading-[1] tracking-[-0.02em] font-extrabold text-[#281716]">Reset Password</h1>
              <p className="text-[#5c403d] font-medium">Enter your email to verify your identity</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <label className="text-[10px] tracking-[0.3em] font-bold text-[#5c403d] mb-2 block uppercase">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@miiam.com"
                  className="w-full bg-[#fff0ef] border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-[#ba001c] transition-all placeholder:text-[#5c403d]/40"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={!email.includes("@") || isLoading}
              className="w-full bg-[#ba001c] text-white text-[1.5rem] leading-[1.2] font-extrabold py-6 rounded-xl active:scale-95 transition-transform duration-200 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Continue"}
            </button>
          </form>
        </div>
      </section>

      <section className="hidden md:flex flex-1 relative items-end justify-start p-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            alt="Food"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhfOu3V3KkjtmyRfet1cPPZc5-qz3jim-qm5VmrhPYL8E3dmOrFfYXh-HwTGSjO_r4V97XSEBy_beSGU9M8bT8PHCdIIjRAS2rc_9dvc2Hc0LuWrcxV_I-PXDGaYAS5GWX7xtmAFg-bM-_B534tnCSovYO6dgPTnCaTK497B_rF98rPi79CXKVAEP-jNYqV1DnuT2od_QN3lPEPg7WX1sk-MEbB6nBL3aIRWtvXwvBks9fDvVST6zxaQ6UBz0pCnlorp31ipPry8o"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00174c]/80 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 bg-white/70 backdrop-blur-xl p-10 rounded-lg max-w-lg">
          <h2 className="text-[3rem] leading-tight tracking-[-0.02em] font-extrabold text-[#00174c]">Forgot Password?</h2>
          <p className="text-[#5c403d] mt-4">No worries, we'll help you recover your account.</p>
        </div>
      </section>
    </div>
  );
}