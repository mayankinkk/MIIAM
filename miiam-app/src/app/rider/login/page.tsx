"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";
import BlurImage from "@/components/BlurImage";

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
    supabase.auth
      .getUser()
      .then(({ data: { user } }: { data: { user: { id: string; email?: string } | null } }) => {
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
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to send reset email");
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
      logger.error({ err }, "Rider login failed");
      setError("Login failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-surface-container-lowest)] md:flex-row">
      <div className="relative flex flex-col justify-center bg-white p-12 md:w-1/2 md:p-24 dark:bg-[var(--color-surface)]">
        <Link
          href="/"
          className="absolute top-8 left-8 text-3xl font-black tracking-tighter text-[var(--color-primary)]"
        >
          MIIAM
        </Link>
        <div className="mx-auto w-full max-w-md">
          <span className="text-brand-secondary mb-4 block text-sm font-bold tracking-widest uppercase">
            Fleet Network
          </span>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-[var(--color-on-surface)] md:text-5xl">
            Ride with <br /> purpose.
          </h1>
          <p className="mb-12 text-lg text-[var(--color-on-surface-variant)]">
            Sign in to your rider account to start accepting orders and earning.
          </p>

          {error && (
            <div className="bg-error-container/10 border-error-container/30 text-error mb-6 rounded-xl border p-4 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="mb-3 block px-1 text-sm font-bold tracking-widest text-[var(--color-on-surface)] uppercase">
                Email Address
              </label>
              <div className="bg-surface-container-low focus-within:ring-primary/40 border-outline-variant/30 flex overflow-hidden rounded-xl border transition-all focus-within:ring-2">
                <span className="text-on-surface-variant border-outline-variant/30 border-r px-5 py-4 font-bold">
                  <span className="material-symbols-outlined">mail</span>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="placeholder:text-on-surface-variant/40 text-on-surface w-full border-none bg-transparent px-5 py-4 text-lg font-semibold focus:outline-none"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label className="mb-3 block px-1 text-sm font-bold tracking-widest text-[var(--color-on-surface)] uppercase">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="bg-surface-container-low border-outline-variant/30 focus:ring-primary/40 text-on-surface w-full rounded-xl border px-5 py-4 text-lg font-semibold transition-all focus:ring-2 focus:outline-none"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-brand-secondary mt-2 text-sm font-bold hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="bento-gradient-blue shadow-brand-secondary/20 w-full rounded-xl py-5 text-lg font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-12 text-center text-sm font-medium text-[var(--color-on-surface-variant)]">
            Want to become a rider?{" "}
            <Link
              href="/rider/apply"
              className="font-bold text-[var(--color-primary)] hover:underline"
            >
              Apply now
            </Link>
          </div>
        </div>
      </div>
      <div className="bg-brand-secondary relative hidden overflow-hidden md:block md:w-1/2">
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <BlurImage
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMs7iF1l6q72X44B4k_1288bT7cR8iT6ApejS0e_P22k1uYx9YI9zTXXP7Z8T39H5Q0A9f_2WbI6Qe9q8A1D3Yt_E1yZtBqZ2W5TfO27vC-w4m12yX_Y1239O9U2I97Y3yI6C6O28c4w09o5IqD9Z288Q3oU2D1G375_C1P31Z_pP7Y78I6T_7oA_XW2X8t3oGZ"
            alt="Rider on motorcycle"
            className="h-full w-full object-cover grayscale"
            fill
          />
        </div>
        <div className="glass-card absolute right-12 bottom-12 left-12 rounded-2xl border border-white/20 p-8">
          <div className="mb-4 flex gap-2">
            <span
              className="material-symbols-outlined text-tertiary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span
              className="material-symbols-outlined text-tertiary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span
              className="material-symbols-outlined text-tertiary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span
              className="material-symbols-outlined text-tertiary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span
              className="material-symbols-outlined text-tertiary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
          </div>
          <p className="mb-6 text-xl leading-relaxed font-medium text-white">
            &quot;Switching to MIIAM was the best decision. The flexible hours and transparent
            earnings let me ride on my own terms. Plus, the app is incredibly easy to use.&quot;
          </p>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-[var(--color-surface-container-lowest)]/20 text-xl font-bold text-white">
              R
            </div>
            <div>
              <p className="font-bold text-white">Rahul K.</p>
              <p className="text-sm text-white/70">Top Rider &bull; 800+ deliveries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            if (!resetSent) setShowForgotPassword(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {resetSent ? (
              <div className="text-center">
                <span className="mb-4 block text-5xl">📧</span>
                <h3 className="mb-2 text-xl font-bold">Check Your Email</h3>
                <p className="mb-6 text-sm text-[var(--color-outline)]">
                  We&apos;ve sent a password reset link to{" "}
                  <strong className="text-[var(--color-on-surface)]">{resetEmail}</strong>
                </p>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setResetEmail("");
                  }}
                  className="bg-brand-secondary w-full rounded-xl py-3 font-bold text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Reset Password</h3>
                  <button onClick={() => setShowForgotPassword(false)}>
                    <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                      close
                    </span>
                  </button>
                </div>
                <p className="mb-6 text-sm text-[var(--color-outline)]">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
                {resetError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
                    {resetError}
                  </div>
                )}
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[var(--color-on-surface)]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="bg-surface-container-low border-outline-variant/30 focus:ring-primary/40 text-on-surface w-full rounded-xl border px-4 py-3 text-lg font-semibold focus:ring-2 focus:outline-none"
                      placeholder="your@email.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!resetEmail}
                    className="bg-brand-secondary w-full rounded-xl py-3 font-bold text-white disabled:opacity-50"
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
