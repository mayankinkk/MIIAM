"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Breadcrumbs from "@/components/Breadcrumbs";
import logger from "@/lib/logger";
import { ListSkeleton } from "@/components/Skeleton";
import { reverseGeocode } from "@/lib/geocoding";

interface AddressData {
  id: string;
  user_id: string;
  label: string;
  icon?: string;
  name: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  is_default?: boolean;
  phone: string;
  instructions?: string;
}

interface AddressCardProps {
  address: AddressData;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

function AddressCard({ address, onSelect, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  const { t } = useTranslation();
  const labelColors = {
    Home: {
      bg: "bg-accent/10 dark:bg-accent/20",
      text: "text-accent dark:text-accent",
      accent: "from-accent to-accent/70",
    },
    Office: {
      bg: "bg-accent/10 dark:bg-accent/20",
      text: "text-accent dark:text-accent",
      accent: "from-deal to-deal/70",
    },
    Other: {
      bg: "bg-[var(--color-surface-container)]",
      text: "text-[var(--color-on-surface)]",
      accent: "from-slate-500 to-slate-600",
    },
  };

  const colors = labelColors[address.label as keyof typeof labelColors] || labelColors.Other;

  return (
    <div
      className={`group overflow-hidden rounded-2xl bg-[var(--color-surface-container-lowest)] shadow-sm transition-all ${address.is_default ? "ring-primary ring-2" : ""}`}
    >
      {/* Default badge */}
      {address.is_default && (
        <div className="bg-primary text-on-primary flex items-center gap-2 px-4 py-2 text-xs font-bold">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          Default Address
        </div>
      )}

      <div className="p-4">
        {/* Map Preview */}
        <div className="relative mb-4 h-32 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 transition-shadow group-hover:shadow-md dark:from-gray-800 dark:to-gray-700">
          {/* Static map placeholder with location marker */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 opacity-30">
              <svg className="h-full w-full" viewBox="0 0 400 150">
                {/* Grid lines to simulate map */}
                <line x1="0" y1="50" x2="400" y2="50" stroke="#94a3b8" strokeWidth="0.5" />
                <line x1="0" y1="100" x2="400" y2="100" stroke="#94a3b8" strokeWidth="0.5" />
                <line x1="100" y1="0" x2="100" y2="150" stroke="#94a3b8" strokeWidth="0.5" />
                <line x1="200" y1="0" x2="200" y2="150" stroke="#94a3b8" strokeWidth="0.5" />
                <line x1="300" y1="0" x2="300" y2="150" stroke="#94a3b8" strokeWidth="0.5" />
                {/* Roads */}
                <line x1="50" y1="0" x2="50" y2="150" stroke="#cbd5e1" strokeWidth="3" />
                <line x1="150" y1="0" x2="150" y2="150" stroke="#cbd5e1" strokeWidth="4" />
                <line x1="250" y1="0" x2="250" y2="150" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="0" y1="75" x2="400" y2="75" stroke="#cbd5e1" strokeWidth="4" />
              </svg>
            </div>
            {/* Location marker */}
            <div className="relative z-10">
              <div
                className={`h-12 w-12 bg-gradient-to-br ${colors.accent} animate-pulse-subtle flex items-center justify-center rounded-full shadow-lg`}
              >
                <span
                  className="material-symbols-outlined text-xl text-white"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {address.icon}
                </span>
              </div>
              <div className="bg-primary absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45" />
            </div>
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
          {/* Coordinates badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-[var(--color-surface-container-lowest)]/90 px-2 py-1 text-[10px] font-bold text-[var(--color-on-surface-variant)] backdrop-blur-sm">
            <span className="material-symbols-outlined text-xs">pin_drop</span>
            Gauripur
          </div>
        </div>

        {/* Address Info */}
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg}`}>
            <span
              className={`material-symbols-outlined text-xl ${colors.text}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {address.icon}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[var(--color-on-surface)]">{address.label}</h3>
              {address.is_default && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Default
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[var(--color-on-surface)]">{address.name}</p>
            <p className="mt-0.5 line-clamp-2 text-sm text-[var(--color-on-surface-variant)]">
              {address.street}, {address.city}
            </p>
            <p className="text-xs text-[var(--color-outline)]">
              {address.state} - {address.postal_code}
            </p>
            {address.instructions && (
              <p className="mt-2 flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs text-[var(--color-outline-variant)] dark:bg-amber-900/20">
                <span className="material-symbols-outlined text-sm text-amber-600 dark:text-amber-400">
                  info
                </span>
                {address.instructions}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex border-t border-[var(--color-border-subtle)]">
        <button
          onClick={onSelect}
          className="text-accent hover:bg-surface flex-1 border-r border-[var(--color-border-subtle)] py-3 text-sm font-bold transition-colors"
        >
          Select for Delivery
        </button>
        {!address.is_default && (
          <button
            onClick={onSetDefault}
            className="text-accent hover:bg-accent/10 dark:hover:bg-accent/20 flex-1 border-r border-[var(--color-border-subtle)] py-3 text-sm font-bold transition-colors"
          >
            Set as Default
          </button>
        )}
        <button
          onClick={onEdit}
          className="px-4 py-3 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-subtle)]"
        >
          <span className="material-symbols-outlined">edit</span>
          {t.common.change}
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-3 text-red-500 transition-colors hover:bg-red-50"
        >
          <span className="material-symbols-outlined">delete</span>
          {t.common.remove}
        </button>
      </div>
    </div>
  );
}

const addressTypes = [
  {
    id: "home",
    icon: "home",
    label: "Home",
    color: "bg-accent/10 dark:bg-accent/20 text-accent dark:text-accent",
  },
  {
    id: "office",
    icon: "business",
    label: "Office",
    color: "bg-accent/10 dark:bg-accent/20 text-accent dark:text-accent",
  },
  {
    id: "other",
    icon: "place",
    label: "Other",
    color: "bg-[var(--color-surface-container)] text-[var(--color-on-surface)]",
  },
];

const defaultAddresses = [
  {
    id: "addr1",
    label: "Home",
    icon: "home",
    name: "Priya Sharma",
    street: "456, ABC Apartments, Ring Road",
    city: "Gauripur",
    state: "Assam",
    postal_code: "781001",
    is_default: true,
    phone: "9876543210",
    instructions: "Ring bell twice",
  },
  {
    id: "addr2",
    label: "Office",
    icon: "business",
    name: "Priya Sharma",
    street: "789, Tech Park, GS Road",
    city: "Gauripur",
    state: "Assam",
    postal_code: "781005",
    is_default: false,
    phone: "9876543210",
    instructions: "Carry ID card",
  },
];

export default function AddressBookPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const res = await fetch(`/api/addresses?user_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.addresses) {
            setAddresses(data.addresses);
          }
        }
      }
    } catch (err) {
      logger.error({ err }, "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [newAddress, setNewAddress] = useState({
    label: "home",
    name: "",
    street: "",
    city: "Gauripur",
    state: "Assam",
    postal_code: "",
    phone: "",
    instructions: "",
  });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const handleUseMyLocation = () => {
    setDetectingLocation(true);
    setLocationError("");

    if ("geolocation" in navigator) {
      const handleSuccess = async (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;
        logger.info({ latitude, longitude, accuracy }, "Location detected");

        try {
          const geo = await reverseGeocode(latitude, longitude);
          setNewAddress((prev) => ({
            ...prev,
            street: geo.displayAddress,
            city: geo.city || prev.city,
            state: geo.state || prev.state,
            postal_code: geo.postalCode || prev.postal_code,
          }));
        } catch {
          setNewAddress((prev) => ({
            ...prev,
            street: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          }));
        }
        setDetectingLocation(false);
      };

      const handleError = (error: GeolocationPositionError) => {
        if (error.code === error.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            handleSuccess,
            () => {
              setLocationError("Location timed out. Using fallback...");
              setNewAddress((prev) => ({ ...prev, street: "Location unavailable" }));
              setDetectingLocation(false);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
          );
          return;
        }
        setLocationError("Unable to detect location. Please enter manually.");
        setDetectingLocation(false);
      };

      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 25000,
        maximumAge: 0,
      });
    } else {
      setLocationError("Location not supported by your browser.");
      setDetectingLocation(false);
    }
  };

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => setOtpCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  async function handleSendOtp() {
    const clean = newAddress.phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setOtpError("Enter a valid 10-digit phone number");
      return;
    }
    setSendingOtp(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: clean, purpose: "checkout" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setOtpSent(true);
      setOtpCooldown(60);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    const clean = newAddress.phone.replace(/\D/g, "");
    if (!otpCode.trim()) {
      setOtpError("Enter the OTP sent to your phone");
      return;
    }
    setVerifyingOtp(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: clean, otpCode: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      setPhoneVerified(true);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setVerifyingOtp(false);
    }
  }

  function handlePhoneChange(value: string) {
    setNewAddress({ ...newAddress, phone: value });
    if (phoneVerified) {
      setPhoneVerified(false);
      setOtpSent(false);
      setOtpCode("");
    }
  }

  const handleSetDefault = async (addressId: string) => {
    const selectedAddress = addresses.find((addr) => addr.id === addressId);
    if (selectedAddress) {
      const fullAddress = `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.postal_code}`;
      localStorage.setItem("miiam_selected_address", JSON.stringify({ address: fullAddress }));
    }

    await fetch("/api/addresses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: addressId,
        user_id: addresses[0]?.user_id,
        is_default: true,
      }),
    });

    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        is_default: addr.id === addressId,
      }))
    );
  };

  const handleSelectAddress = (address: (typeof addresses)[0]) => {
    const fullAddress = `${address.street}, ${address.city}, ${address.state} - ${address.postal_code}`;
    localStorage.setItem("miiam_selected_address", JSON.stringify({ address: fullAddress }));
    router.push("/app/checkout");
  };

  const handleDelete = async (addressId: string) => {
    if (
      await confirm({ title: "Delete Address", message: "Delete this address?", variant: "danger" })
    ) {
      await fetch(`/api/addresses?id=${addressId}`, { method: "DELETE" });
      setAddresses(addresses.filter((addr) => addr.id !== addressId));
    }
  };

  const handleSave = async () => {
    const addressData = {
      label: newAddress.label,
      address: newAddress.street || newAddress.name,
      city: newAddress.city,
      state: newAddress.state,
      pincode: newAddress.postal_code,
      phone: newAddress.phone,
      phone_verified: phoneVerified,
      is_default: addresses.length === 0,
    };

    if (editingAddress) {
      await fetch("/api/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAddress.id,
          user_id: addresses[0]?.user_id,
          ...addressData,
        }),
      });
      setAddresses(
        addresses.map((addr) =>
          addr.id === editingAddress.id ? { ...addr, ...addressData } : addr
        )
      );
    } else {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressData),
      });
      const data = await res.json();
      if (data.address) {
        setAddresses([...addresses, data.address]);
      }
    }

    setShowAddAddress(false);
    setEditingAddress(null);
    setOtpSent(false);
    setOtpCode("");
    setPhoneVerified(false);
    setOtpError("");
    setNewAddress({
      label: "home",
      name: "",
      street: "",
      city: "Gauripur",
      state: "Assam",
      postal_code: "",
      phone: "",
      instructions: "",
    });
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#f8f8f8] p-4 dark:bg-[var(--color-surface)]"
        aria-label="Loading..."
      >
        <ListSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-24 dark:bg-[var(--color-surface)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--color-surface-container-lowest)] shadow-sm dark:bg-[var(--color-surface-container-lowest)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link href="/app/profile" className="text-accent text-2xl font-black tracking-tighter">
            MIIAM
          </Link>
          <Link
            href="/app/profile"
            className="hover:text-accent text-sm font-bold text-[var(--color-on-surface-variant)]"
          >
            Cancel
          </Link>
        </div>
      </header>

      <Breadcrumbs
        items={[
          { label: "Home", href: "/app/home" },
          { label: "Profile", href: "/app/profile" },
          { label: "Addresses" },
        ]}
      />

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-6">
        <section className="mb-8">
          <h1 className="mb-2 text-3xl font-extrabold text-[var(--color-on-surface)]">
            My Addresses
          </h1>
          <p className="text-[var(--color-outline)]">Manage your delivery addresses</p>
        </section>

        {/* Saved Addresses */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-on-surface)]">Saved Addresses</h2>
            <span className="text-xs text-[var(--color-outline)]">
              {addresses.length} addresses
            </span>
          </div>

          <div className="space-y-4">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onSelect={() => handleSelectAddress(address)}
                onEdit={() => {
                  setEditingAddress(address);
                  setNewAddress({
                    label: address.label.toLowerCase(),
                    name: address.name,
                    street: address.street || "",
                    city: address.city || "",
                    state: address.state || "",
                    postal_code: address.postal_code || "",
                    phone: address.phone,
                    instructions: address.instructions || "",
                  });
                  setShowAddAddress(true);
                }}
                onDelete={() => handleDelete(address.id)}
                onSetDefault={() => handleSetDefault(address.id)}
              />
            ))}
          </div>
        </section>

        {/* Add New Address Button */}
        <div className="space-y-3">
          <Link
            href="/app/addresses/add"
            className="bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary shadow-primary/20 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-extrabold shadow-lg transition-colors"
          >
            <span className="material-symbols-outlined">add_location</span>
            Add New Address
          </Link>
          <Link
            href="/app/addresses/add"
            className="bg-secondary flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white transition-colors hover:bg-[#096b18]"
          >
            <span className="material-symbols-outlined">my_location</span>
            Auto Detect on Map
          </Link>
        </div>

        {/* Info */}
        <div className="bg-accent/10 mt-8 rounded-2xl p-4 dark:bg-[var(--color-surface-container)]">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-accent">info</span>
            <div>
              <p className="text-accent text-sm font-bold dark:text-[var(--color-on-surface)]">
                Delivery Tips
              </p>
              <ul className="text-accent mt-2 space-y-1 text-xs dark:text-[var(--color-outline)]">
                <li>• Add clear, complete addresses for smoother deliveries</li>
                <li>• Include landmark or building name if available</li>
                <li>• Add delivery instructions (e.g., gate code, floor)</li>
                <li>• Set your most frequent address as default</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Address Modal */}
      {showAddAddress && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="address-modal-title"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setShowAddAddress(false);
              setEditingAddress(null);
              setOtpSent(false);
              setOtpCode("");
              setPhoneVerified(false);
              setOtpError("");
            }
          }}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowAddAddress(false);
              setEditingAddress(null);
              setOtpSent(false);
              setOtpCode("");
              setPhoneVerified(false);
              setOtpError("");
            }}
          />

          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[var(--color-surface-container-lowest)] sm:rounded-3xl dark:bg-[var(--color-surface-container-lowest)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-6 py-4 dark:bg-[var(--color-surface-container-lowest)]">
              <div>
                <h2
                  id="address-modal-title"
                  className="text-xl font-extrabold text-[var(--color-on-surface)]"
                >
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </h2>
                <p className="text-xs text-[var(--color-outline)]">
                  {editingAddress ? "Update your address details" : "Enter your delivery address"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddAddress(false);
                  setEditingAddress(null);
                  setOtpSent(false);
                  setOtpCode("");
                  setPhoneVerified(false);
                  setOtpError("");
                }}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container)]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* Address Type */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-[var(--color-on-surface)]">
                  Address Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {addressTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setNewAddress({ ...newAddress, label: type.id })}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 py-4 transition-all ${
                        newAddress.label === type.id
                          ? `${type.color} border-transparent`
                          : "border-[var(--color-border-subtle)] hover:border-[var(--color-outline-variant)]"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-xl ${
                          newAddress.label === type.id ? "" : "text-[var(--color-outline-variant)]"
                        }`}
                      >
                        {type.icon}
                      </span>
                      <span className="text-sm font-bold">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label
                  htmlFor="full-name"
                  className="text-sm font-semibold text-[var(--color-on-surface)]"
                >
                  Full Name *
                </label>
                <input
                  id="full-name"
                  type="text"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="focus:border-primary focus:ring-primary/20 mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone-number"
                  className="text-sm font-semibold text-[var(--color-on-surface)]"
                >
                  Phone Number *
                </label>
                {!phoneVerified ? (
                  <div className="mt-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        id="phone-number"
                        type="tel"
                        value={newAddress.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="focus:border-primary focus:ring-primary/20 flex-1 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:outline-none"
                        inputMode="numeric"
                        maxLength={10}
                        disabled={otpSent}
                      />
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={
                          sendingOtp ||
                          otpCooldown > 0 ||
                          newAddress.phone.replace(/\D/g, "").length !== 10
                        }
                        className="bg-primary text-on-primary hover:bg-primary hover:text-on-primary/90 rounded-xl px-4 py-3 text-sm font-bold whitespace-nowrap transition-all disabled:opacity-50"
                      >
                        {sendingOtp
                          ? "Sending..."
                          : otpCooldown > 0
                            ? `Retry ${otpCooldown}s`
                            : "Send OTP"}
                      </button>
                    </div>
                    {otpSent && (
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          className="focus:border-primary focus:ring-primary/20 flex-1 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:outline-none"
                          placeholder="Enter 6-digit OTP"
                          value={otpCode}
                          onChange={(e) =>
                            setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          inputMode="numeric"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={verifyingOtp || otpCode.length !== 6}
                          className="rounded-xl bg-green-600 px-4 py-3 text-sm font-bold whitespace-nowrap text-white transition-all hover:bg-green-700 disabled:opacity-50"
                        >
                          {verifyingOtp ? "Verifying..." : "Verify"}
                        </button>
                      </div>
                    )}
                    {otpError && <p className="text-xs font-medium text-red-500">{otpError}</p>}
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex-1 rounded-xl border border-green-300 bg-[var(--color-surface-subtle)] px-4 py-3 text-sm font-medium text-green-700">
                      {newAddress.phone}
                    </span>
                    <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-600">
                      ✓ Verified
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneVerified(false);
                        setOtpSent(false);
                        setOtpCode("");
                        setNewAddress({ ...newAddress, phone: "" });
                      }}
                      className="text-accent text-xs font-bold hover:underline"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Street Address */}
              <div>
                <label
                  htmlFor="street-address"
                  className="text-sm font-semibold text-[var(--color-on-surface)]"
                >
                  Street Address *
                </label>
                <input
                  id="street-address"
                  type="text"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  placeholder="House/Flat/Building name, Street"
                  className="focus:border-primary focus:ring-primary/20 mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:outline-none"
                />
              </div>

              {/* Location Detect */}
              <button
                onClick={handleUseMyLocation}
                disabled={detectingLocation}
                className="border-primary text-accent hover:bg-surface flex w-full items-center justify-center gap-2 rounded-xl border bg-[var(--color-surface-container-lowest)] py-3 font-bold transition-colors"
              >
                <span className="material-symbols-outlined">
                  {detectingLocation ? "sync" : "my_location"}
                </span>
                {detectingLocation ? "Detecting Location..." : "Use My Current Location"}
              </button>
              {locationError && <p className="text-xs text-red-500">{locationError}</p>}

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="city"
                    className="text-sm font-semibold text-[var(--color-on-surface)]"
                  >
                    City *
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    placeholder="City"
                    className="focus:border-primary focus:ring-primary/20 mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="state"
                    className="text-sm font-semibold text-[var(--color-on-surface)]"
                  >
                    State *
                  </label>
                  <input
                    id="state"
                    type="text"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    placeholder="State"
                    className="focus:border-primary focus:ring-primary/20 mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:outline-none"
                  />
                </div>
              </div>

              {/* Postal Code */}
              <div>
                <label
                  htmlFor="pin-code"
                  className="text-sm font-semibold text-[var(--color-on-surface)]"
                >
                  PIN Code *
                </label>
                <input
                  id="pin-code"
                  type="text"
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                  placeholder="6-digit PIN code"
                  className="focus:border-primary focus:ring-primary/20 mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:outline-none"
                />
              </div>

              {/* Delivery Instructions */}
              <div>
                <label
                  htmlFor="delivery-instructions"
                  className="text-sm font-semibold text-[var(--color-on-surface)]"
                >
                  Delivery Instructions (Optional)
                </label>
                <textarea
                  id="delivery-instructions"
                  value={newAddress.instructions}
                  onChange={(e) => setNewAddress({ ...newAddress, instructions: e.target.value })}
                  placeholder="E.g., Ring bell, call on arrival, near park"
                  className="focus:border-primary focus:ring-primary/20 mt-1 h-20 w-full resize-none rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:outline-none"
                />
                <p className="mt-1 text-xs text-[var(--color-outline-variant)]">
                  Max 150 characters
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={
                  !newAddress.name ||
                  !newAddress.street ||
                  !newAddress.postal_code ||
                  !phoneVerified
                }
                className="bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary shadow-primary/30 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-extrabold shadow-xl transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="material-symbols-outlined">check</span>
                {editingAddress ? "Update Address" : "Save Address"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
