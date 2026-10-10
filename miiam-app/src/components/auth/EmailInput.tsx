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
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      router.push(`/auth/email-verify?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-bold text-[var(--color-on-surface)]">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border-2 border-[var(--color-border-subtle)] px-4 py-3 font-bold outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
        {error && <p className="text-status-error mt-2 text-sm">{error}</p>}
      </div>
      <button
        onClick={handleSubmit}
        disabled={!email.includes("@") || isLoading}
        className={`w-full rounded-xl py-4 text-lg font-bold transition-all ${email.includes("@") && !isLoading ? "bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary" : "bg-surface-container-high text-outline-variant cursor-not-allowed"}`}
      >
        {isLoading ? "Sending..." : "Send Verification Code"}
      </button>
    </div>
  );
}
