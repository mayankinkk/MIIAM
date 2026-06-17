"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function RiderLoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const redirectTo = searchParams.get("redirect") || "/rider/dashboard";

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string; email?: string } | null } }) => {
      if (user) router.push(redirectTo);
    });
  }, [supabase, router, redirectTo]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/rider/login`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setResetError(err.message || "Failed to send reset email");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        router.push(redirectTo);
      }
    } catch (err) {
      console.error(err);
      setError("Login failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] flex flex-col md:flex-row">
      <div className="md:w-1/2 p-12 md:p-24 flex flex-col justify-center relative bg-white">
        <Link href="/" className="absolute top-8 left-8 text-3xl font-black text-[var(--color-primary)] tracking-tighter">
          MIIAM
        </Link>
        <div className="max-w-md w-full mx-auto">
          <span className="text-brand-secondary font-bold text-sm tracking-widest uppercase mb-4 block">Fleet Network</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-on-surface)] mb-4 tracking-tight">
            Ride with <br/> purpose.
          </h1>
          <p className="text-[var(--color-on-surface-variant)] text-lg mb-12">Sign in to your rider account to start accepting orders and earning.</p>

          {error && (
            <div className="mb-6 p-4 bg-[#f95630]/10 border border-[#f95630]/30 rounded-xl text-[#b02500] text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-3 uppercase tracking-widest px-1">Email Address</label>
              <div className="flex bg-[#ffecee] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-primary)]/40 transition-all border border-[var(--color-outline-variant)]/30">
                <span className="px-5 py-4 font-bold text-[var(--color-on-surface-variant)] border-r border-[var(--color-outline-variant)]/30">
                  <span className="material-symbols-outlined">mail</span>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className="w-full bg-transparent border-none px-5 py-4 text-lg font-semibold focus:outline-none placeholder:text-[var(--color-on-surface-variant)]/40 text-[var(--color-on-surface)]"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-3 uppercase tracking-widest px-1">Password</label>
              <input
                type="password"
                required
                value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                className="w-full bg-[#ffecee] border border-[var(--color-outline-variant)]/30 rounded-xl px-5 py-4 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-all text-[var(--color-on-surface)]"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-brand-secondary font-bold mt-2 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bento-gradient-blue text-white rounded-xl py-5 text-lg font-bold shadow-lg shadow-brand-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <div className="mt-12 text-center text-sm font-medium text-[var(--color-on-surface-variant)]">
            Want to become a rider?{" "}
            <Link href="/rider/apply" className="text-[var(--color-primary)] font-bold hover:underline">
              Apply now
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden md:block md:w-1/2 bg-brand-secondary relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMs7iF1l6q72X44B4k_1288bT7cR8iT6ApejS0e_P22k1uYx9YI9zTXXP7Z8T39H5Q0A9f_2WbI6Qe9q8A1D3Yt_E1yZtBqZ2W5TfO27vC-w4m12yX_Y1239O9U2I97Y3yI6C6O28c4w09o5IqD9Z288Q3oU2D1G375_C1P31Z_pP7Y78I6T_7oA_XW2X8t3oGZ"
            alt="Rider on motorcycle"
            className="w-full h-full object-cover grayscale"
          />
        </div>
        <div className="absolute bottom-12 left-12 right-12 glass-card rounded-2xl p-8 border border-white/20">
          <div className="flex gap-2 mb-4">
            <span className="material-symbols-outlined text-[#ffd709]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="material-symbols-outlined text-[#ffd709]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="material-symbols-outlined text-[#ffd709]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="material-symbols-outlined text-[#ffd709]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="material-symbols-outlined text-[#ffd709]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          </div>
          <p className="text-white text-xl font-medium leading-relaxed mb-6">
            &quot;Switching to MIIAM was the best decision. The flexible hours and transparent earnings let me ride on my own terms. Plus, the app is incredibly easy to use.&quot;
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--color-surface-container-lowest)]/20 rounded-full flex items-center justify-center font-bold text-white text-xl border border-white/40">R</div>
            <div>
              <p className="text-white font-bold">Rahul K.</p>
              <p className="text-white/70 text-sm">Top Rider &bull; 800+ deliveries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => { if (!resetSent) setShowForgotPassword(false); }}>
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            {resetSent ? (
              <div className="text-center">
                <span className="text-5xl block mb-4">📧</span>
                <h3 className="font-bold text-xl mb-2">Check Your Email</h3>
                <p className="text-sm text-[var(--color-outline)] mb-6">
                  We&apos;ve sent a password reset link to <strong className="text-[var(--color-on-surface)]">{resetEmail}</strong>
                </p>
                <button
                  onClick={() => { setShowForgotPassword(false); setResetSent(false); setResetEmail(""); }}
                  className="w-full py-3 bg-brand-secondary text-white font-bold rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl">Reset Password</h3>
                  <button onClick={() => setShowForgotPassword(false)}>
                    <span className="material-symbols-outlined text-[var(--color-outline-variant)]">close</span>
                  </button>
                </div>
                <p className="text-sm text-[var(--color-outline)] mb-6">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
                {resetError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                    {resetError}
                  </div>
                )}
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-[#ffecee] border border-[var(--color-outline-variant)]/30 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 text-[var(--color-on-surface)]"
                      placeholder="your@email.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!resetEmail}
                    className="w-full py-3 bg-brand-secondary text-white font-bold rounded-xl disabled:opacity-50"
                  >
                    Send Reset Link
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RiderLoginPage() {
  return (
    <Suspense>
      <RiderLoginContent />
    </Suspense>
  );
}