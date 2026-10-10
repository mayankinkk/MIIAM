"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BlurImage from "@/components/BlurImage";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "password_reset" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setEmailSent(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-container-lowest)] p-6">
        <div className="max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
          </div>
          <h1 className="text-2xl font-black text-[var(--color-on-surface)]">Check Your Email</h1>
          <p className="text-[var(--color-on-surface)]">
            We sent a verification code to <span className="font-bold">{email}</span>
          </p>
          <Link
            href={`/auth/email-verify?email=${encodeURIComponent(email)}&purpose=password_reset`}
            className="text-on-primary block w-full rounded-xl bg-[var(--color-primary)] py-4 font-bold hover:bg-[var(--color-primary-dim)]"
          >
            Enter Verification Code
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-stretch overflow-hidden">
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center bg-[var(--color-surface-container-lowest)] px-6 md:px-16 lg:px-24">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-start gap-4">
            <Link
              href="/auth/login"
              className="text-[var(--color-on-surface)] hover:text-[var(--color-accent)]"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <span className="text-2xl font-black tracking-tighter text-[var(--color-primary-dark)]">
              MIIAM
            </span>
            <div className="space-y-2">
              <h1 className="text-[3rem] leading-[1] font-extrabold tracking-[-0.02em] text-[var(--color-on-surface)]">
                Reset Password
              </h1>
              <p className="font-medium text-[var(--color-on-surface)]">
                Enter your email to verify your identity
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <label className="mb-2 block text-[10px] font-bold tracking-[0.3em] text-[var(--color-on-surface)] uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@miiam.com"
                  className="w-full rounded-xl border-none bg-[var(--color-surface-container-lowest)] px-6 py-4 transition-all placeholder:text-[var(--color-on-surface)]/40 focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={!email.includes("@") || isLoading}
              className="text-on-primary w-full rounded-xl bg-[var(--color-primary)] py-6 text-[1.5rem] leading-[1.2] font-extrabold transition-transform duration-200 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Continue"}
            </button>
          </form>
        </div>
      </section>

      <section className="relative hidden flex-1 items-end justify-start overflow-hidden p-16 md:flex">
        <div className="absolute inset-0 z-0">
          <BlurImage
            alt="Food"
            className="h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhfOu3V3KkjtmyRfet1cPPZc5-qz3jim-qm5VmrhPYL8E3dmOrFfYXh-HwTGSjO_r4V97XSEBy_beSGU9M8bT8PHCdIIjRAS2rc_9dvc2Hc0LuWrcxV_I-PXDGaYAS5GWX7xtmAFg-bM-_B534tnCSovYO6dgPTnCaTK497B_rF98rPi79CXKVAEP-jNYqV1DnuT2od_QN3lPEPg7WX1sk-MEbB6nBL3aIRWtvXwvBks9fDvVST6zxaQ6UBz0pCnlorp31ipPry8o"
            fill
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1f1f1f]/80 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 max-w-lg rounded-lg bg-[var(--color-surface-container-lowest)]/70 p-10 backdrop-blur-xl">
          <h2 className="text-on-surface text-[3rem] leading-tight font-extrabold tracking-[-0.02em]">
            Forgot Password?
          </h2>
          <p className="mt-4 text-[var(--color-on-surface)]">
            No worries, we'll help you recover your account.
          </p>
        </div>
      </section>
    </div>
  );
}
