"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RiderLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

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
        router.push("/rider/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Login failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fff4f4] flex flex-col md:flex-row">
      <div className="md:w-1/2 p-12 md:p-24 flex flex-col justify-center relative bg-white">
        <Link href="/" className="absolute top-8 left-8 text-3xl font-black text-[#ba001c] tracking-tighter">
          MIIAM
        </Link>
        <div className="max-w-md w-full mx-auto">
          <span className="text-[#0b50d5] font-bold text-sm tracking-widest uppercase mb-4 block">Fleet Network</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#4d212a] mb-4 tracking-tight">
            Ride with <br/> purpose.
          </h1>
          <p className="text-[#814c55] text-lg mb-12">Sign in to your rider account to start accepting orders and earning.</p>

          {error && (
            <div className="mb-6 p-4 bg-[#f95630]/10 border border-[#f95630]/30 rounded-xl text-[#b02500] text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#4d212a] mb-3 uppercase tracking-widest px-1">Email Address</label>
              <div className="flex bg-[#ffecee] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#ba001c]/40 transition-all border border-[#dd9ca6]/30">
                <span className="px-5 py-4 font-bold text-[#814c55] border-r border-[#dd9ca6]/30">
                  <span className="material-symbols-outlined">mail</span>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-none px-5 py-4 text-lg font-semibold focus:outline-none placeholder:text-[#814c55]/40 text-[#4d212a]"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#4d212a] mb-3 uppercase tracking-widest px-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#ffecee] border border-[#dd9ca6]/30 rounded-xl px-5 py-4 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#ba001c]/40 transition-all text-[#4d212a]"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bento-gradient-blue text-white rounded-xl py-5 text-lg font-bold shadow-lg shadow-[#0b50d5]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-12 text-center text-sm font-medium text-[#814c55]">
            Want to become a rider?{" "}
            <Link href="/rider/apply" className="text-[#ba001c] font-bold hover:underline">
              Apply now
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden md:block md:w-1/2 bg-[#0b50d5] relative overflow-hidden">
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
            "Switching to MIIAM was the best decision. The flexible hours and transparent earnings let me ride on my own terms. Plus, the app is incredibly easy to use."
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-white text-xl border border-white/40">D</div>
            <div>
              <p className="text-white font-bold">David S.</p>
              <p className="text-white/70 text-sm">Elite Rider • 1.2k+ deliveries</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}