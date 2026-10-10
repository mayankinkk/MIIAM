"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLocationStore } from "@/lib/store/locationStore";

export default function AddressQuickSelector() {
  const [open, setOpen] = useState(false);
  const [addresses, setAddresses] = useState<
    Array<{ id: string; label: string; address: string; landmark?: string }>
  >([]);
  const { displayAddress, setLocation } = useLocationStore();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("miiam-addresses") || "[]");
      setAddresses(saved);
    } catch {
      /* ignore */
    }
  }, []);

  if (addresses.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-on-surface-variant hover:text-accent flex items-center gap-1.5 text-xs font-bold transition-colors"
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
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm"
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
              <div className="bg-outline/30 mx-auto mb-4 h-1 w-10 rounded-full" />
              <h3 className="text-on-surface mb-4 text-lg font-bold">Select Address</h3>

              <div className="mb-4 max-h-60 space-y-2 overflow-y-auto">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => {
                      setLocation({ displayAddress: addr.address });
                      setOpen(false);
                    }}
                    className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                      displayAddress === addr.address
                        ? "border-primary bg-primary/5"
                        : "border-outline/10 hover:border-outline/30"
                    }`}
                  >
                    <p className="text-on-surface text-sm font-bold">{addr.label}</p>
                    <p className="text-on-surface-variant mt-0.5 text-xs">{addr.address}</p>
                    {addr.landmark && (
                      <p className="text-on-surface-variant/60 mt-0.5 text-xs">{addr.landmark}</p>
                    )}
                  </button>
                ))}
              </div>

              <Link
                href="/app/addresses/add"
                className="border-outline/20 text-on-surface-variant hover:border-primary hover:text-accent flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-bold transition-colors"
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
