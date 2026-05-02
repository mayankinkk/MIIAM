"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) { setError(error.message); }
    } catch { setError("Something went wrong"); }
    finally { setIsGoogleLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-stretch overflow-hidden">
      {/* Left Side - Form Section */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 md:px-16 lg:px-24 bg-[#fff8f7] relative z-10">
        <div className="w-full max-w-md space-y-12">
          {/* Brand Anchor */}
          <div className="flex flex-col items-start gap-4">
            <span className="text-2xl font-black tracking-tighter text-[#8d0013]">MIIAM</span>
            <div className="space-y-2">
              <h1 className="text-[3rem] leading-[1] tracking-[-0.02em] font-extrabold text-[#281716]" style={{ fontFamily: 'Plus Jakarta Sans' }}>Create Account</h1>
              <p className="text-[#5c403d] font-medium">Join the urban elite. Experience hyper-local excellence at your fingertips.</p>
            </div>
          </div>

          {/* Registration Form */}
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
              className="w-full bg-[#ba001c] text-white text-[1.5rem] leading-[1.2] font-extrabold py-6 rounded-xl active:scale-95 transition-transform duration-200"
              style={{ boxShadow: '0 20px 40px rgba(77, 33, 42, 0.06)' }}
            >
              {isLoading ? "Sending..." : "Continue"}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center pt-8">
            <p className="text-[#5c403d] font-medium">
              Already have an account? 
              <Link href="/auth/login" className="text-[#ba001c] font-bold hover:underline underline-offset-4 transition-all">Log In</Link>
            </p>
          </div>
        </div>

        {/* Branding Accent */}
        <div className="absolute bottom-8 left-8 hidden lg:block">
          <span className="text-[10px] tracking-[0.5em] text-[#5c403d]/20">MIIAM SUPER-APP ECOSYSTEM ©2024</span>
        </div>
      </section>

      {/* Right Side - Lifestyle Imagery */}
      <section className="hidden md:flex flex-1 relative items-end justify-start p-16 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            alt="Service Professional"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpdJoMqGx1JI9OC5-P3tNJEEsdLRmL0VxPoXXl7SBVXGDQu2WHUdcPOlWezQVyNynpg_QWeHfkWj2RHDuNYug-ViC-sGCb1gAmxWXR55MfJfFSu-IEHfieR6-hwdsuewLM6ha18jNmT4skgpzhcH9oI_IoeoKLwW5UQ0Bl2nQTBa19hpZNmDU5VKWE2R8ygNNLm3uduEb3bxKKXS1VtI4Y4Sp7408543z3l9doDDPv5qNjRXK14HNTeBx87404cD_sUm6ecb0-YWA"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00174c]/80 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[#ffdad7]/10 mix-blend-multiply" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 bg-white/70 backdrop-blur-xl p-10 rounded-lg max-w-lg" style={{ boxShadow: '0 20px 40px rgba(77, 33, 42, 0.06)', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
          <div className="space-y-6">
            <span className="inline-block bg-[#ba001c] text-white px-4 py-1 rounded-full text-[10px] tracking-[0.3em] font-bold">PREMIUM SERVICES</span>
            <h2 className="text-[3rem] leading-tight tracking-[-0.02em] font-extrabold text-[#00174c]" style={{ fontFamily: 'Plus Jakarta Sans' }}>Expert care for your urban lifestyle.</h2>
            <p className="text-[1.25rem] leading-[1.6] font-semibold text-[#00497d]">From artisan meal prep to high-end home maintenance, MIIAM connects you with the city's finest professionals instantly.</p>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-4">
                <img alt="User" className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdlq3gI79VpGIBuc6jzvcnJdRRWwFoWA8sjBVe8pUkHBcdftNBTXILgrBj6CaJydUbFmxNcVB-2k9tWhgC6tJX66AsqjRNcYwNnUgAdUTg2iuqPbE5HxfuEEdLUI3H322Z6q-JNs4B5jrxq-m37tJgOeHuWDk-EOFuDHqgoX3EXOqjIKX3iZJrXE6EAbQjxdKR8oAuPoIlsJytSVqWKxwxFhx9hj7IK4i2qbhheEhTvBW8b-3aELPtlklFVRU7kU2juTyK8Z3_0cM" />
                <img alt="User" className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrdEzx_Wq8BLHAPK8vbfPiPmn5jp6k5_SxeKE8a9grEWxoqD4jhR96awoaIYxvR3TsqSmDXw4Le_rQJ6_sxiUfy_sN6jvIgVcOT0KGCTQj7WeuQYcw0hdShFgcnqgtwRkAIXYIbCkz1v9xc8YcZdwHMXo92GkezRZbIcqB3PEatcUcn-zJtcjlGr0BST3v2eS-uzUEpkHj9p8O_ID8qH6pwjGDF0T-KQmtqROYY7oxIwtIubov3AZ_okUVNNZ9ZFABMh4vRfVWnSg" />
                <img alt="User" className="w-12 h-12 rounded-full border-4 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcYRQW-ha-2JtG7yj0lWOcFmVw51PXe-dqPWmQiq4FcXwNNtoQpXIcQGDd9QBC3M3kx9gGer6mS7BBPeCKfNxSRkx6c5vo4u9WL-TrLRf2U2ShsRzheTmu-8ld2MdwwjeG-nWPOat9XBSmrR9Xeejz3idDjeqm5yt1-cMmqS0z8YCc-k-gVrCftINTAI8YntgUrB-0XoMlAHKYeR7GPZ_ahZ-k1of-1PCe4a3MB0HQPLt9hGXG10DEGtnKbOT-_DaIrinpuAvq26Y" />
                <div className="w-12 h-12 rounded-full border-4 border-white bg-[#00497d] flex items-center justify-center text-white text-xs font-bold">+2k</div>
              </div>
              <span className="text-[10px] tracking-[0.3em] font-bold text-[#00174c]">TRUSTED BY PROFESSIONALS</span>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-12 right-12 flex gap-4">
          <div className="w-3 h-3 rounded-full bg-[#ba001c] shadow-lg animate-pulse" />
          <div className="w-3 h-3 rounded-full bg-white/40" />
          <div className="w-3 h-3 rounded-full bg-white/20" />
        </div>
      </section>
    </div>
  );
}