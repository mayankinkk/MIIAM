"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BlurImage from "@/components/BlurImage";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) { setError("Please enter a valid email"); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "signup" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(`/auth/email-verify?email=${encodeURIComponent(email)}&purpose=signup`);
    } catch { setError("Something went wrong"); }
    finally { setIsLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const redirectTo = searchParams.get("redirect") || "/app/home";
      const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });
      if (error) {
        if (error.message?.includes("popup") || error.message?.includes("closed")) {
          setError("Google sign-in was cancelled. Try again or use email to sign up.");
        } else {
          setError("Google sign-in is temporarily unavailable. Please use email instead.");
        }
      }
    } catch {
      setError("Google sign-in is temporarily unavailable. Please use email to sign up.");
    }
    finally { setIsGoogleLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-stretch overflow-hidden">
      {/* Left Side - Form Section */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 md:px-16 lg:px-24 bg-[var(--color-surface-container-lowest)] relative z-10">
        <div className="w-full max-w-md space-y-12">
          {/* Brand Anchor */}
          <div className="flex flex-col items-start gap-4">
            <span className="text-2xl font-black tracking-tighter text-[var(--color-primary-dark)]">MIIAM</span>
            <div className="space-y-2">
              <h1 className="text-[3rem] leading-[1] tracking-[-0.02em] font-extrabold text-[var(--color-on-surface)]" style={{ fontFamily: 'Plus Jakarta Sans' }}>Create Account</h1>
              <p className="text-[var(--color-on-surface)] font-medium">Join the urban elite. Experience hyper-local excellence at your fingertips.</p>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <label className="text-[10px] tracking-[0.3em] font-bold text-[var(--color-on-surface)] mb-2 block uppercase">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@miiam.com"
                  className="w-full bg-[var(--color-surface-container-lowest)] border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-[var(--color-primary)] transition-all placeholder:text-[var(--color-on-surface)]/40"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={!email.includes("@") || isLoading}
              className="w-full bg-[var(--color-primary)] text-white text-[1.5rem] leading-[1.2] font-extrabold py-6 rounded-xl active:scale-95 transition-transform duration-200"
              style={{ boxShadow: '0 20px 40px rgba(77, 33, 42, 0.06)' }}
            >
              {isLoading ? "Sending..." : "Continue"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[var(--color-outline-variant)]" />
            <span className="text-[10px] tracking-[0.3em] font-bold text-[var(--color-on-surface)]/60">OR</span>
            <div className="flex-1 h-px bg-[var(--color-outline-variant)]" />
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[var(--color-outline-variant)] rounded-full hover:bg-[var(--color-surface-container)] transition-colors active:scale-95 disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-[var(--color-on-surface)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span className="font-bold text-sm text-[var(--color-on-surface)]">Continue with Google</span>
          </button>

          {/* Footer Link */}
          <div className="text-center">
            <p className="text-[var(--color-on-surface)] font-medium">
              Already have an account? 
              <Link href="/auth/login" className="text-[var(--color-primary)] font-bold hover:underline underline-offset-4 transition-all"> Log In</Link>
            </p>
          </div>
        </div>

        {/* Branding Accent */}
        <div className="absolute bottom-8 left-8 hidden lg:block">
          <span className="text-[10px] tracking-[0.5em] text-[var(--color-on-surface)]/20">MIIAM SUPER-APP ECOSYSTEM ©2026</span>
        </div>
      </section>

      {/* Right Side - Lifestyle Imagery */}
      <section className="hidden md:flex flex-1 relative items-end justify-start p-16 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <BlurImage
            alt="Service Professional"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpdJoMqGx1JI9OC5-P3tNJEEsdLRmL0VxPoXXl7SBVXGDQu2WHUdcPOlWezQVyNynpg_QWeHfkWj2RHDuNYug-ViC-sGCb1gAmxWXR55MfJfFSu-IEHfieR6-hwdsuewLM6ha18jNmT4skgpzhcH9oI_IoeoKLwW5UQ0Bl2nQTBa19hpZNmDU5VKWE2R8ygNNLm3uduEb3bxKKXS1VtI4Y4Sp7408543z3l9doDDPv5qNjRXK14HNTeBx87404cD_sUm6ecb0-YWA"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00174c]/80 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[#ffdad7]/10 mix-blend-multiply" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 bg-[var(--color-surface-container-lowest)]/70 backdrop-blur-xl p-10 rounded-lg max-w-lg" style={{ boxShadow: '0 20px 40px rgba(77, 33, 42, 0.06)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
          <div className="space-y-6">
            <span className="inline-block bg-[var(--color-primary)] text-white px-4 py-1 rounded-full text-[10px] tracking-[0.3em] font-bold">PREMIUM SERVICES</span>
            <h2 className="text-[3rem] leading-tight tracking-[-0.02em] font-extrabold text-on-surface" style={{ fontFamily: 'Plus Jakarta Sans' }}>Expert care for your urban lifestyle.</h2>
            <p className="text-[1.25rem] leading-[1.6] font-semibold text-on-surface-variant">From artisan meal prep to high-end home maintenance, MIIAM connects you with the city's finest professionals instantly.</p>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-4">
                <BlurImage alt="User" className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdlq3gI79VpGIBuc6jzvcnJdRRWwFoWA8sjBVe8pUkHBcdftNBTXILgrBj6CaJydUbFmxNcVB-2k9tWhgC6tJX66AsqjRNcYwNnUgAdUTg2iuqPbE5HxfuEEdLUI3H322Z6q-JNs4B5jrxq-m37tJgOeHuWDk-EOFuDHqgoX3EXOqjIKX3iZJrXE6EAbQjxdKR8oAuPoIlsJytSVqWKxwxFhx9hj7IK4i2qbhheEhTvBW8b-3aELPtlklFVRU7kU2juTyK8Z3_0cM" />
                <BlurImage alt="User" className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrdEzx_Wq8BLHAPK8vbfPiPmn5jp6k5_SxeKE8a9grEWxoqD4jhR96awoaIYxvR3TsqSmDXw4Le_rQJ6_sxiUfy_sN6jvIgVcOT0KGCTQj7WeuQYcw0hdShFgcnqgtwRkAIXYIbCkz1v9xc8YcZdwHMXo92GkezRZbIcqB3PEatcUcn-zJtcjlGr0BST3v2eS-uzUEpkHj9p8O_ID8qH6pwjGDF0T-KQmtqROYY7oxIwtIubov3AZ_okUVNNZ9ZFABMh4vRfVWnSg" />
                <BlurImage alt="User" className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcYRQW-ha-2JtG7yj0lWOcFmVw51PXe-dqPWmQiq4FcXwNNtoQpXIcQGDd9QBC3M3kx9gGer6mS7BBPeCKfNxSRkx6c5vo4u9WL-TrLRf2U2ShsRzheTmu-8ld2MdwwjeG-nWPOat9XBSmrR9Xeejz3idDjeqm5yt1-cMmqS0z8YCc-k-gVrCftINTAI8YntgUrB-0XoMlAHKYeR7GPZ_ahZ-k1of-1PCe4a3MB0HQPLt9hGXG10DEGtnKbOT-_DaIrinpuAvq26Y" />
                <div className="w-12 h-12 rounded-full border-4 border-white bg-[#00497d] flex items-center justify-center text-white text-xs font-bold">+2k</div>
              </div>
              <span className="text-[10px] tracking-[0.3em] font-bold text-on-surface">TRUSTED BY PROFESSIONALS</span>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-12 right-12 flex gap-4">
          <div className="w-3 h-3 rounded-full bg-[var(--color-primary)] shadow-lg animate-pulse" />
          <div className="w-3 h-3 rounded-full bg-[var(--color-surface-container-lowest)]/40" />
          <div className="w-3 h-3 rounded-full bg-[var(--color-surface-container-lowest)]/20" />
        </div>
      </section>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen flex items-stretch overflow-hidden">
      <section className="flex-1 flex flex-col justify-center items-center px-6 md:px-16 lg:px-24 bg-[var(--color-surface-container-lowest)]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </section>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SignupContent />
    </Suspense>
  );
}