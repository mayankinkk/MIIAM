"use client";

import { useMemo, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import type { Rider } from "@/lib/types";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";
import BlurImage from "@/components/BlurImage";

const AdminRiderMap = dynamic(() => import("@/components/admin/AdminRiderMap"), { ssr: false });

function RidersPage() {
  const { confirm } = useConfirm();
  const supabase = useMemo(() => createClient(), []);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRider, setNewRider] = useState({
    email: "",
    phone: "",
    full_name: "",
    profile_photo: null as File | null,
    id_proof_type: "" as string,
    id_proof_image: null as File | null,
    vehicle_type: "motorcycle",
    vehicle_number: "",
  });
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"overview" | "earnings" | "orders" | "docs">(
    "overview"
  );

  useEffect(() => {
    if (searchParams.get("add") === "true") setShowAddModal(true);
  }, [searchParams]);

  useEffect(() => {
    loadRiders();
    const channel = supabase
      .channel("riders-tracker")
      .on("postgres_changes", { event: "*", schema: "public", table: "riders" }, () => loadRiders())
      .subscribe();
    const ordersChannel = supabase
      .channel("admin-orders-tracker")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () =>
        loadRiders()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(ordersChannel);
    };
  }, [supabase]);

  async function loadRiders() {
    setLoading(true);

    const { data: rawRiders, error: rawError } = await supabase.from("riders").select("*");

    const { data, error } = await supabase
      .from("riders")
      .select("*, profile:profiles(*)")
      .order("created_at", { ascending: false });

    if (error) {
      setRiders(rawRiders || []);
    } else {
      setRiders(data || []);
    }
    setLoading(false);
  }

  async function toggleOnline(riderId: string, isOnline: boolean) {
    await supabase.from("riders").update({ is_online: isOnline }).eq("id", riderId);
    loadRiders();
  }

  async function deleteRider(riderId: string) {
    try {
      const res = await fetch(`/api/riders?id=${riderId}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedRider(null);
        loadRiders();
      }
    } catch (err) {
      logger.error({ err }, "Failed to delete rider");
    }
  }

  async function addRider(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("email", newRider.email);
      formData.append("phone", newRider.phone);
      formData.append("full_name", newRider.full_name);
      formData.append("vehicle_type", newRider.vehicle_type);
      formData.append("vehicle_number", newRider.vehicle_number);
      formData.append("id_proof_type", newRider.id_proof_type);
      if (newRider.profile_photo) formData.append("profile_photo", newRider.profile_photo);
      if (newRider.id_proof_image) formData.append("id_proof_image", newRider.id_proof_image);

      const res = await fetch("/api/riders", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        useToastStore.getState().addToast(data.error || "Failed", "error");
        setSaving(false);
        return;
      }
      setShowAddModal(false);
      setNewRider({
        email: "",
        phone: "",
        full_name: "",
        profile_photo: null,
        id_proof_type: "",
        id_proof_image: null,
        vehicle_type: "motorcycle",
        vehicle_number: "",
      });
      loadRiders();
    } catch (err) {
      logger.error({ err }, "Failed to add rider");
      setSaving(false);
    }
  }

  const filteredRiders = riders.filter(
    (r) =>
      filter === "all" ||
      (filter === "online" && r.is_online) ||
      (filter === "offline" && !r.is_online)
  );
  const onlineCount = riders.filter((r) => r.is_online).length;
  const totalDeliveries = riders.reduce((s, r) => s + (r.total_deliveries || 0), 0);
  const avgRating = riders.length
    ? riders.reduce((s, r) => s + (r.rating || 0), 0) / riders.length
    : 0;

  if (loading) return <div className="px-8 py-12">Loading...</div>;

  return (
    <div className="px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Riders</h1>
          <p className="text-[var(--color-outline-variant)]">Manage delivery riders</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-on-primary flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 font-bold"
        >
          <span className="material-symbols-outlined">add</span> Add Rider
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
          <p className="mb-1 text-xs font-black text-[var(--color-outline-variant)] uppercase">
            Total Riders
          </p>
          <p className="text-3xl font-black">{riders.length}</p>
        </div>
        <div className="rounded-3xl border border-green-100 bg-green-50 p-6">
          <p className="mb-1 text-xs font-black text-green-600 uppercase">Online Now</p>
          <p className="text-3xl font-black text-green-600">{onlineCount}</p>
        </div>
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
          <p className="mb-1 text-xs font-black text-[var(--color-outline-variant)] uppercase">
            Total Deliveries
          </p>
          <p className="text-3xl font-black">{totalDeliveries}</p>
        </div>
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
          <p className="mb-1 text-xs font-black text-[var(--color-outline-variant)] uppercase">
            Avg Rating
          </p>
          <p className="flex items-center gap-1 text-3xl font-black">
            {avgRating.toFixed(1)}{" "}
            <span className="material-symbols-outlined text-xl text-amber-500">star</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] p-4">
            <h2 className="text-sm font-black text-[var(--color-on-surface)] uppercase">
              Live Map
            </h2>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
              <span className="text-xs font-bold text-[var(--color-outline-variant)]">Live</span>
            </div>
          </div>
          <div className="relative h-[400px] bg-[var(--color-surface-container)]">
            <AdminRiderMap riders={riders} onRiderClick={setSelectedRider} />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)]">
          <div className="border-b border-[var(--color-border-subtle)] p-4">
            <div className="flex gap-2">
              {(["all", "online", "offline"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold ${filter === f ? "text-on-primary bg-[var(--color-primary)]" : "bg-[var(--color-surface-subtle)] text-[var(--color-outline)]"}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {filteredRiders.map((rider) => (
              <div
                key={rider.id}
                className="cursor-pointer border-b border-slate-50 p-4 hover:bg-[var(--color-surface-subtle)]"
                onClick={() => setSelectedRider(rider)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-on-primary flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)] font-bold shadow-inner">
                    {rider.profile?.avatar_url ? (
                      <BlurImage
                        src={rider.profile.avatar_url}
                        alt={`${rider.name || "Rider"}'s avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      rider.name?.[0] || "R"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[var(--color-on-surface)]">
                      {rider.name || "Unknown Rider"}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`h-2 w-2 rounded-full ${rider.is_online ? "bg-green-500" : "bg-slate-300"}`}
                      ></span>
                      <span className="text-[var(--color-outline-variant)]">
                        {rider.is_online ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOnline(rider.id, !rider.is_online);
                      }}
                      className={`rounded-lg border px-2 py-1 text-[10px] font-bold uppercase transition-all ${rider.is_online ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}
                    >
                      {rider.is_online ? "Offline" : "Online"}
                    </button>
                    <div className="text-right">
                      <p className="flex items-center gap-1 text-xs font-black text-[var(--color-on-surface)]">
                        {(rider.rating || 0).toFixed(1)}{" "}
                        <span className="material-symbols-outlined text-sm text-amber-500">
                          star
                        </span>
                      </p>
                      <p className="text-[10px] text-[var(--color-outline-variant)]">
                        {rider.total_deliveries || 0} deliveries
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedRider && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-lg flex-col bg-[var(--color-surface-container-lowest)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/50 p-8">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[#ff7670] text-3xl font-black text-white">
                  {selectedRider.profile?.avatar_url ? (
                    <BlurImage
                      src={selectedRider.profile.avatar_url}
                      alt={`${selectedRider.name || "Selected rider"}'s avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    selectedRider.name?.[0] || "R"
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black text-[var(--color-on-surface)]">
                    {selectedRider.name || "Unknown Rider"}
                  </h2>
                  <p className="text-sm font-bold text-[var(--color-outline-variant)] uppercase">
                    {selectedRider.is_online ? "Active Now" : "Offline"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRider(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container)] text-[var(--color-outline-variant)]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex border-b border-[var(--color-border-subtle)] px-8">
              {(["overview", "earnings", "orders", "docs"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 px-4 py-4 text-xs font-black uppercase ${activeTab === tab ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-outline-variant)]"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto p-8">
              {activeTab === "overview" && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-green-50 p-4">
                      <p className="mb-1 text-[10px] font-black text-green-600 uppercase">
                        Total Deliveries
                      </p>
                      <p className="text-xl font-black text-green-700">
                        {selectedRider.total_deliveries || 0}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-primary)]/5 p-4">
                      <p className="mb-1 text-[10px] font-black text-[var(--color-primary)] uppercase">
                        Total Earnings
                      </p>
                      <p className="text-xl font-black text-[var(--color-primary)]">
                        ₹{selectedRider.total_earnings || 0}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-surface-subtle)] p-4">
                      <p className="mb-1 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                        Rating
                      </p>
                      <p className="text-xl font-black text-amber-500">
                        {(selectedRider.rating || 0).toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-3xl bg-[var(--color-surface-subtle)] p-6">
                      <p className="mb-1 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                        Vehicle
                      </p>
                      <p className="text-lg font-black capitalize">{selectedRider.vehicle_type}</p>
                      {selectedRider.vehicle_number && (
                        <p className="mt-1 inline-block rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold tracking-tighter text-[var(--color-primary)] uppercase">
                          {selectedRider.vehicle_number}
                        </p>
                      )}
                    </div>
                    <div className="rounded-3xl bg-[var(--color-surface-subtle)] p-6">
                      <p className="mb-1 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                        Status
                      </p>
                      <p className="text-lg font-black">
                        {selectedRider.is_online ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-[var(--color-outline-variant)] uppercase">
                      Contact
                    </h3>
                    <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4">
                      <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                        mail
                      </span>
                      <p className="font-bold">{selectedRider.profile?.email || "No email"}</p>
                    </div>
                    <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4">
                      <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                        call
                      </span>
                      <p className="font-bold">{selectedRider.phone || "No phone"}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-6">
                    <button
                      onClick={() => toggleOnline(selectedRider.id, !selectedRider.is_online)}
                      className={`flex-1 rounded-2xl border-2 py-4 text-xs font-black tracking-widest uppercase transition-all ${selectedRider.is_online ? "border-red-100 bg-red-50 text-red-600" : "border-green-100 bg-green-50 text-green-600"}`}
                    >
                      {selectedRider.is_online ? "Go Offline" : "Go Online"}
                    </button>
                  </div>
                </>
              )}
              {activeTab === "earnings" && (
                <>
                  <div className="rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
                    <p className="mb-2 text-[10px] font-black text-white/40 uppercase">
                      Total Earnings
                    </p>
                    <p className="text-4xl font-black">₹{selectedRider.total_earnings || 0}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-[var(--color-surface-subtle)] p-4">
                      <p className="mb-1 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                        This Month
                      </p>
                      <p className="text-xl font-black">₹0</p>
                    </div>
                    <div className="rounded-2xl bg-[var(--color-surface-subtle)] p-4">
                      <p className="mb-1 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                        Balance
                      </p>
                      <p className="text-xl font-black">
                        ₹{selectedRider.balance || selectedRider.total_earnings || 0}
                      </p>
                    </div>
                  </div>
                  <p className="text-center text-xs text-[var(--color-outline-variant)]">
                    Earnings are updated after each delivery
                  </p>
                </>
              )}

              {activeTab === "orders" && <RiderOrdersHistory riderId={selectedRider.id} />}

              {activeTab === "docs" && (
                <div className="space-y-4">
                  <div className="group flex items-center justify-between rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-surface-container)]">
                        {selectedRider.profile?.avatar_url ? (
                          <BlurImage
                            src={selectedRider.profile.avatar_url}
                            alt={`${selectedRider.name || "Selected rider"}'s avatar`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                            person
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[var(--color-on-surface)]">
                          Profile Photo
                        </p>
                        <p className="text-[10px] font-black text-green-500 uppercase">Uploaded</p>
                      </div>
                    </div>
                    {selectedRider.profile?.avatar_url && (
                      <a
                        href={selectedRider.profile.avatar_url}
                        target="_blank"
                        className="text-xs font-black text-[var(--color-primary)] uppercase"
                      >
                        View
                      </a>
                    )}
                  </div>
                  <div className="group flex items-center justify-between rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-surface-container)]">
                        {selectedRider.id_proof_image ? (
                          <BlurImage
                            src={selectedRider.id_proof_image}
                            alt={`${selectedRider.id_proof_type || "Govt ID"} proof image`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                            badge
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[var(--color-on-surface)]">
                          ID Proof ({selectedRider.id_proof_type || "Govt ID"})
                        </p>
                        <p
                          className={`text-[10px] font-black uppercase ${selectedRider.id_proof_image ? "text-green-500" : "text-amber-500"}`}
                        >
                          {selectedRider.id_proof_image ? "Uploaded" : "Missing"}
                        </p>
                      </div>
                    </div>
                    {selectedRider.id_proof_image && (
                      <a
                        href={selectedRider.id_proof_image}
                        target="_blank"
                        className="text-xs font-black text-[var(--color-primary)] uppercase"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[var(--color-surface-container-lowest)]">
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
              <h2 className="text-xl font-black text-[var(--color-on-surface)]">
                {isEditing ? "Edit Rider" : "Add Rider"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setIsEditing(false);
                }}
                className="p-2 text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={addRider} className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newRider.full_name}
                  onChange={(e) => setNewRider({ ...newRider, full_name: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-4 font-bold"
                  placeholder="Name"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={newRider.email}
                  onChange={(e) => setNewRider({ ...newRider, email: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-4 font-bold"
                  placeholder="Email"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  value={newRider.phone}
                  onChange={(e) => setNewRider({ ...newRider, phone: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-4 font-bold"
                  placeholder="+91XXXXXXXXXX"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                  Profile Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setNewRider({ ...newRider, profile_photo: e.target.files?.[0] || null })
                  }
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-4"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                  ID Proof
                </label>
                <select
                  value={newRider.id_proof_type}
                  onChange={(e) =>
                    setNewRider({
                      ...newRider,
                      id_proof_type: e.target.value,
                      id_proof_image: null,
                    })
                  }
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-4 font-bold"
                  required
                >
                  <option value="">Select</option>
                  <option value="aadhar">Aadhar</option>
                  <option value="dl">DL</option>
                  <option value="voter">Voter</option>
                  <option value="pan">Pan</option>
                </select>
              </div>
              {newRider.id_proof_type && (
                <div>
                  <label className="mb-2 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                    Upload {newRider.id_proof_type}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setNewRider({ ...newRider, id_proof_image: e.target.files?.[0] || null })
                    }
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] p-4"
                    required
                  />
                </div>
              )}
              <div>
                <label className="mb-2 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                  Vehicle
                </label>
                <select
                  value={newRider.vehicle_type}
                  onChange={(e) =>
                    setNewRider({ ...newRider, vehicle_type: e.target.value, vehicle_number: "" })
                  }
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-4 font-bold"
                >
                  <option value="motorcycle">Motorcycle</option>
                  <option value="scooty">Scooty</option>
                  <option value="bicycle">Bicycle</option>
                </select>
              </div>
              {(newRider.vehicle_type === "motorcycle" || newRider.vehicle_type === "scooty") && (
                <div>
                  <label className="mb-2 block text-xs font-bold text-[var(--color-outline-variant)] uppercase">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={newRider.vehicle_number}
                    onChange={(e) => setNewRider({ ...newRider, vehicle_number: e.target.value })}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] p-4 font-bold"
                    placeholder="Number"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={saving}
                className="text-on-primary w-full rounded-xl bg-[var(--color-primary)] px-6 py-4 font-bold hover:bg-[#a00019] disabled:opacity-50"
              >
                {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Rider"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      selectedRider?.id &&
                      (await confirm({
                        title: "Delete",
                        message: "Are you sure?",
                        variant: "danger",
                      }))
                    )
                      deleteRider(selectedRider.id);
                  }}
                  className="mt-2 w-full rounded-xl bg-red-50 py-4 text-xs font-black text-red-600 uppercase transition-all hover:bg-red-100"
                >
                  Delete Rider Account
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RiderTracking() {
  return (
    <Suspense fallback={<div className="px-8 py-12">Loading...</div>}>
      <RidersPage />
    </Suspense>
  );
}

function RiderOrdersHistory({ riderId }: { riderId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRiderOrders() {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("id, status, total_amount, delivery_fee, placed_at, delivered_at")
        .eq("rider_id", riderId)
        .order("placed_at", { ascending: false })
        .limit(20);
      setOrders(data || []);
      setLoading(false);
    }
    fetchRiderOrders();
  }, [riderId]);

  if (loading)
    return (
      <div className="py-8 text-center text-[var(--color-outline-variant)]">Loading orders...</div>
    );

  if (orders.length === 0)
    return (
      <div className="rounded-3xl border-2 border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] py-16 text-center">
        <span className="material-symbols-outlined mb-2 text-4xl text-[var(--color-outline-variant)]/60">
          delivery_dining
        </span>
        <p className="text-sm font-bold text-[var(--color-outline-variant)]">No deliveries yet</p>
      </div>
    );

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-4"
        >
          <div className="mb-2 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-[var(--color-outline)]">
                #{order.id.slice(0, 8)}
              </p>
              <p className="text-xs text-[var(--color-outline-variant)]">
                {order.placed_at
                  ? new Date(order.placed_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : ""}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-black ${order.status === "delivered" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"}`}
            >
              {order.status?.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">₹{order.total_amount}</p>
              <p className="text-[10px] text-[var(--color-outline-variant)]">Order Value</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-600">₹{order.delivery_fee || 0}</p>
              <p className="text-[10px] text-[var(--color-outline-variant)]">Rider Earned</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
