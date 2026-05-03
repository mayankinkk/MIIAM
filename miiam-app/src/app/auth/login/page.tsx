"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const resetSuccess = searchParams.get("reset") === "success";
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) { setError("Please enter a valid email"); return; }
    if (!password) { setError("Please enter your password"); return; }
    
    setIsLoading(true);
    try {
      // First attempt to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        console.log("[login] First attempt failed:", signInError.message);
        
        // Call admin API to fix email confirmation AND re-set password
        const confirmRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        
        if (confirmRes.ok) {
          // Retry sign in after admin fix
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (retryError) {
            setError(retryError.message);
            return;
          }
          
          // Success on retry
          window.location.href = "/app/explore";
          return;
        } else {
          const data = await confirmRes.json();
          setError(data.error || "Login failed. Please try again.");
          return;
        }
      }
      
      // Success on first attempt
      window.location.href = "/app/explore";
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
    <div className="min-h-screen flex">
      {/* Left Side - Lifestyle Imagery (Desktop only) */}
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#281716]">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#ffdad7]/40 to-transparent z-10" />
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhfOu3V3KkjtmyRfet1cPPZc5-qz3jim-qm5VmrhPYL8E3dmOrFfYXh-HwTGSjO_r4V97XSEBy_beSGU9M8bT8PHCdIIjRAS2rc_9dvc2Hc0LuWrcxV_I-PXDGaYAS5GWX7xtmAFg-bM-_B534tnCSovYO6dgPTnCaTK497B_rF98rPi79CXKVAEP-jNYqV1DnuT2od_QN3lPEPg7WX1sk-MEbB6nBL3aIRWtvXwvBks9fDvVST6zxaQ6UBz0pCnlorp31ipPry8o"
          alt="Artisanal pizza"
        />
        <div className="relative z-20 mt-auto p-16 max-w-xl">
          <div className="bg-[#ba001c] px-4 py-1 inline-block mb-6 rounded-sm">
            <span className="text-white text-[10px] tracking-[0.3em] font-bold">PREMIUM SELECTION</span>
          </div>
          <h1 className="text-white text-[4.5rem] leading-[0.9] tracking-[-0.05em] font-extrabold mb-6" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Savor the Moment.
          </h1>
          <p className="text-white/80 text-[1.25rem] leading-relaxed font-medium">
            Connecting you to the finest culinary experiences in the city. Fast, fresh, and curated just for you.
          </p>
        </div>
      </section>

      {/* Right Side - Auth Card */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-24 bg-[#fff0ef]">
        <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-12 rounded-xl" style={{ boxShadow: '0 20px 40px rgba(77, 33, 42, 0.06)' }}>
          {/* Header */}
          <div className="space-y-2">
            <div className="text-3xl font-black tracking-tighter text-red-700 mb-8">MIIAM</div>
            <h2 className="text-[3rem] leading-[1] tracking-[-0.02em] font-extrabold text-[#281716]" style={{ fontFamily: 'Plus Jakarta Sans' }}>Welcome Back</h2>
            <p className="text-[#5c403d] font-medium">Enter your email to sign in to your account.</p>
          </div>

          {resetSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-medium text-sm">Password reset successfully. Please sign in with your new password.</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] tracking-[0.3em] font-bold text-[#5c403d]" htmlFor="email">EMAIL ADDRESS</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-4 bg-[#fbdbd8] border-none rounded-xl focus:ring-2 focus:ring-[#ba001c] text-[#281716] font-medium transition-all placeholder:text-[#5c403d]/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] tracking-[0.3em] font-bold text-[#5c403d]" htmlFor="password">PASSWORD</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-4 bg-[#fbdbd8] border-none rounded-xl focus:ring-2 focus:ring-[#ba001c] text-[#281716] font-medium transition-all placeholder:text-[#5c403d]/50"
                />
              </div>
              <div className="space-y-1 text-right">
                <Link href="/auth/forgot-password" className="text-xs text-[#ba001c] font-bold hover:underline">Forgot Password?</Link>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={!email.includes("@") || !password || isLoading}
              className="w-full bg-[#ba001c] text-white text-[1.5rem] leading-[1.2] font-extrabold py-5 rounded-full shadow-lg shadow-[#ba001c]/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Plus Jakarta Sans' }}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          

          {/* Social Logins */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[#e5bdba] rounded-full hover:bg-[#fbdbd8] transition-colors active:scale-95 disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-[#5c403d] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span className="font-bold text-sm text-[#281716]">Continue with Google</span>
          </button>

          <p className="text-center text-[#5c403d] font-medium">
            Don't have an account? <Link href="/auth/signup" className="text-[#ba001c] font-extrabold hover:underline underline-offset-4">Create Account</Link>
          </p>

          <p className="text-center text-xs text-[#5c403d]/60">
            By continuing, you agree to MIIAM's <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>
          </p>
        </div>
      </section>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-transparent">
        <div className="text-2xl font-black tracking-tighter text-red-700">MIIAM</div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] tracking-[0.3em] font-bold text-[#5c403d] cursor-pointer hover:opacity-80 transition-opacity">Help</span>
        </div>
      </header>

      {/* Footer */}
      <footer className="fixed bottom-0 right-0 p-6 z-40">
        <p className="text-[10px] tracking-[0.3em] text-[#5c403d]/60">© 2024 MIIAM INC. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-[#fff8f7] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginContent />
    </Suspense>
  );
}