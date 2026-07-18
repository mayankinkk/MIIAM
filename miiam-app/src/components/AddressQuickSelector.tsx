"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLocationStore } from "@/lib/store/locationStore";

export default function AddressQuickSelector() {
  const [open, setOpen] = useState(false);
  const [addresses, setAddresses] = useState<Array<{ id: string; label: string; address: string; landmark?: string }>>([]);
  const { displayAddress, setLocation } = useLocationStore();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("miiam-addresses") || "[]");
      setAddresses(saved);
    } catch { /* ignore */ }
  }, []);

  if (addresses.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-sm">location_on</span>
        Change
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-surface-container-lowest w-full max-w-lg rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-outline/30 rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-bold text-on-surface mb-4">Select Address</h3>

              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => {
                      setLocation({ displayAddress: addr.address });
                      setOpen(false);
                    }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      displayAddress === addr.address
                        ? "border-primary bg-primary/5"
                        : "border-outline/10 hover:border-outline/30"
                    }`}
                  >
                    <p className="text-sm font-bold text-on-surface">{addr.label}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{addr.address}</p>
                    {addr.landmark && <p className="text-xs text-on-surface-variant/60 mt-0.5">{addr.landmark}</p>}
                  </button>
                ))}
              </div>

              <Link
                href="/app/addresses/add"
                className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-outline/20 rounded-xl text-sm font-bold text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                onClick={() => setOpen(false)}
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Add New Address
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
