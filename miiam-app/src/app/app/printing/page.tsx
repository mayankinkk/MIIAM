"use client";

import { useState } from "react";
import Link from "next/link";

export default function PrintingPage() {
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-indigo-100 rounded-3xl flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-5xl text-indigo-600">print</span>
      </div>
      <h1 className="text-3xl font-black text-on-surface mb-2">Printing Service</h1>
      <p className="text-on-surface-variant max-w-sm mb-8">
        We're working hard to bring you fast and convenient printing services. 
        Upload your documents, choose your preferences, and get them delivered to your doorstep.
      </p>
      <Link 
        href="/app/home" 
        className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
