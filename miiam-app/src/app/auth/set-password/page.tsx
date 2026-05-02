"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const email = searchParams.get("email") || "";
  const isPasswordReset = searchParams.get("password_reset") === "true";
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = (pwd: string) => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("at least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("one uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("one lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("one number");
    if (!/[!@#$%^&*()]/.test(pwd)) errors.push("one special character (!@#$%^&*())");
    return errors;
  };

  const passwordErrors = validatePassword(password);
  const getStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 8) return 1;
    const errors = passwordErrors.length;
    if (errors === 0) return 4;
    if (errors <= 2) return 3;
    return 2;
  };
  const strengthColors = ["bg-slate-200", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!password) { setError("Please enter a password"); return; }
    if (passwordErrors.length > 0) { 
      setError(`Password must have: ${passwordErrors.join(", ")}`); 
      return; 
    }
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }
    
    setIsLoading(true);
    try {
      if (isPasswordReset) {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) { 
          setError(data.error || "Failed to reset password"); 
          return; 
        }
        router.push("/auth/login?reset=success");
        return;
      }

      // Step 1: Create user with confirmed email via admin API
      const res = await fetch("/api/auth/create-user-with-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) { 
        setError(data.error || "Failed to create account"); 
        return; 
      }

      // Step 2: Sign in directly to establish a client-side session
      // The admin API has already confirmed the email, so this will work
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("[set-password] Sign in error after account creation:", signInError.message);
        // If still "email not confirmed", force-confirm via login API and retry
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (retryError) {
            setError(retryError.message);
            return;
          }
        } else {
          setError(signInError.message);
          return;
        }
      }

      // Session is now established, go to profile setup
      router.push(`/auth/profile-setup?email=${encodeURIComponent(email)}`);
    } catch { setError("Something went wrong"); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-stretch overflow-hidden">
      {/* Left Side - Form */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 md:px-16 lg:px-24 bg-[#fff8f7] relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-start gap-4">
            <span className="text-2xl font-black tracking-tighter text-[#8d0013]">MIIAM</span>
            <div className="space-y-2">
              <h1 className="text-[3rem] leading-[1] tracking-[-0.02em] font-extrabold text-[#281716]">
                {isPasswordReset ? "Set New Password" : "Set Your Password"}
              </h1>
              <p className="text-[#5c403d] font-medium">
                {isPasswordReset ? "Create a new password for your account" : "Create a password to secure your account"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] tracking-[0.3em] font-bold text-[#5c403d]" htmlFor="password">PASSWORD</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#fff0ef] border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-[#ba001c] transition-all placeholder:text-[#5c403d]/40"
                />
                {password && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${i <= getStrength() ? strengthColors[getStrength()] : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${getStrength() >= 3 ? 'text-green-600' : getStrength() >= 2 ? 'text-orange-600' : 'text-red-500'}`}>
                      {strengthLabels[getStrength()]}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] tracking-[0.3em] font-bold text-[#5c403d]" htmlFor="confirmPassword">CONFIRM PASSWORD</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#fff0ef] border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-[#ba001c] transition-all placeholder:text-[#5c403d]/40"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={!password || !confirmPassword || isLoading || getStrength() < 3}
              className="w-full bg-[#ba001c] text-white text-[1.5rem] leading-[1.2] font-extrabold py-6 rounded-xl active:scale-95 transition-transform duration-200 disabled:opacity-50"
              style={{ boxShadow: '0 20px 40px rgba(77, 33, 42, 0.06)' }}
            >
              {isLoading ? isPasswordReset ? "Updating..." : "Creating Account..." : isPasswordReset ? "Update Password" : "Create Account"}
            </button>
          </form>
        </div>
      </section>

      {/* Right Side - Imagery */}
      <section className="hidden md:flex flex-1 relative items-end justify-start p-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            alt="Food"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhfOu3V3KkjtmyRfet1cPPZc5-qz3jim-qm5VmrhPYL8E3dmOrFfYXh-HwTGSjO_r4V97XSEBy_beSGU9M8bT8PHCdIIjRAS2rc_9dvc2Hc0LuWrcxV_I-PXDGaYAS5GWX7xtmAFg-bM-_B534tnCSovYO6dgPTnCaTK497B_rF98rPi79CXKVAEP-jNYqV1DnuT2od_QN3lPEPg7WX1sk-MEbB6nBL3aIRWtvXwvBks9fDvVST6zxaQ6UBz0pCnlorp31ipPry8o"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00174c]/80 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 bg-white/70 backdrop-blur-xl p-10 rounded-lg max-w-lg" style={{ boxShadow: '0 20px 40px rgba(77, 33, 42, 0.06)' }}>
          <h2 className="text-[3rem] leading-tight tracking-[-0.02em] font-extrabold text-[#00174c]">Welcome to MIIAM</h2>
          <p className="text-[#5c403d] mt-4">Your journey to premium experiences starts here.</p>
        </div>
      </section>
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

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SetPasswordContent />
    </Suspense>
  );
}