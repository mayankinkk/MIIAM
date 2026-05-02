"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EmailInputProps {
  purpose?: "signup" | "login";
}

export default function EmailInput({ purpose = "signup" }: EmailInputProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
        body: JSON.stringify({ email, purpose }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push(`/auth/email-verify?email=${encodeURIComponent(email)}`);
    } catch { setError("Something went wrong"); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/20 outline-none font-bold" />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
      <button onClick={handleSubmit} disabled={!email.includes("@") || isLoading}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${email.includes("@") && !isLoading ? "bg-[#ba001c] text-white hover:bg-[#a40017]" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
        {isLoading ? "Sending..." : "Send Verification Code"}
      </button>
    </div>
  );
}