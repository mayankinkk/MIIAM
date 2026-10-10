"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";

interface VendorVerification {
  id: string;
  shop_name: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  cuisine: string;
  status: "pending" | "active" | "inactive" | "suspended";
  gst_number: string | null;
  fssai_number: string | null;
  pan_number: string | null;
  type: string;
  city: string;
  state: string;
  pincode: string;
  description: string | null;
  created_at: string;
}

export default function VerificationPage() {
  const supabase = useMemo(() => createClient(), []);
  const [vendors, setVendors] = useState<VendorVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState<VendorVerification | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    loadVendors();
  }, [supabase]);

  async function loadVendors() {
    setLoading(true);
    const { data } = await supabase
      .from("vendors")
      .select(
        "id, shop_name, owner_name, phone, email, address, cuisine, status, gst_number, fssai_number, pan_number, type, city, state, pincode, description, created_at"
      )
      .order("created_at", { ascending: false });
    if (data) setVendors(data);
    setLoading(false);
  }

  const updateVendorStatus = async (vendorId: string, newStatus: string, reason?: string) => {
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      if (reason) updates.rejection_reason = reason;

      const { error } = await supabase.from("vendors").update(updates).eq("id", vendorId);

      if (error) throw error;

      // If approving, also update the user's profile role to vendor
      if (newStatus === "active") {
        const vendor = vendors.find((v) => v.id === vendorId);
        if (vendor?.email) {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", vendor.email)
            .maybeSingle();

          if (userProfile) {
            await supabase.from("profiles").update({ role: "vendor" }).eq("id", userProfile.id);
          }
        }
      }

      setVendors(
        vendors.map((v) =>
          v.id === vendorId ? { ...v, status: newStatus as VendorVerification["status"] } : v
        )
      );

      setSelectedVendor(null);
    } catch (error: unknown) {
      logger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "Error updating vendor"
      );
      useToastStore.getState().addToast(`Failed: ${(error as Error).message}`, "error");
    }
  };

  const deleteVendor = async (vendorId: string, shopName: string) => {
    if (!confirm(`Delete "${shopName}" permanently? This cannot be undone.`)) return;

    try {
      // Delete related records that don't have ON DELETE CASCADE
      await supabase.from("reviews").delete().eq("vendor_id", vendorId);
      await supabase.from("recurring_schedules").delete().eq("vendor_id", vendorId);
      await supabase.from("service_bookings").delete().eq("vendor_id", vendorId);
      await supabase.from("orders").delete().eq("vendor_id", vendorId);

      const { error } = await supabase.from("vendors").delete().eq("id", vendorId);
      if (error) throw error;
      setVendors(vendors.filter((v) => v.id !== vendorId));
      setSelectedVendor(null);
      useToastStore.getState().addToast(`"${shopName}" deleted`, "success");
    } catch (error: unknown) {
      logger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "Error deleting vendor"
      );
      useToastStore.getState().addToast(`Failed: ${(error as Error).message}`, "error");
    }
  };

  const filtered = vendors.filter((v) => {
    if (filter === "all") return true;
    if (filter === "pending") return v.status === "pending";
    return v.status === filter;
  });

  const pendingCount = vendors.filter((v) => v.status === "pending").length;
  const approvedToday = vendors.filter((v) => v.status === "active").length;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    inactive: "bg-[var(--color-surface-container)] text-[var(--color-on-surface)]",
    suspended: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  if (loading) return <div className="px-8">Loading verifications...</div>;

  return (
    <div className="space-y-8 px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-on-surface)]">
            Vendor Verifications
          </h1>
          <p className="text-sm text-[var(--color-outline-variant)]">
            Review and approve partner applications
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
          <p className="mb-1 text-[10px] font-bold text-[var(--color-outline-variant)] uppercase">
            Pending Review
          </p>
          <p className="text-3xl font-black text-yellow-600">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
          <p className="mb-1 text-[10px] font-bold text-[var(--color-outline-variant)] uppercase">
            Active Partners
          </p>
          <p className="text-3xl font-black text-green-600">{approvedToday}</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
          <p className="mb-1 text-[10px] font-bold text-[var(--color-outline-variant)] uppercase">
            Total Vendors
          </p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{vendors.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
          <p className="mb-1 text-[10px] font-bold text-[var(--color-outline-variant)] uppercase">
            Suspended
          </p>
          <p className="text-3xl font-black text-red-600">
            {vendors.filter((v) => v.status === "suspended").length}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "pending", "active", "inactive", "suspended"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg px-4 py-2 text-xs font-bold uppercase ${
              filter === status
                ? "text-on-primary bg-[var(--color-primary)]"
                : "border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)]"
            }`}
          >
            {status === "all" ? "All" : status}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                  Shop
                </th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                  Owner
                </th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                  Contact
                </th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                  Documents
                </th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                  Status
                </th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                  Date
                </th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--color-outline-variant)]">
                    No vendors found
                  </td>
                </tr>
              ) : (
                filtered.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-[var(--color-surface-subtle)]">
                    <td className="p-4">
                      <p className="font-bold text-[var(--color-on-surface)]">{vendor.shop_name}</p>
                      <p className="text-[10px] text-[var(--color-outline-variant)]">
                        {vendor.id.slice(0, 8)}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[var(--color-on-surface)]">
                        {vendor.owner_name}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-[var(--color-on-surface-variant)]">{vendor.phone}</p>
                      <p className="text-[10px] text-[var(--color-outline-variant)]">
                        {vendor.email}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {vendor.gst_number && (
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded bg-green-100 text-[10px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            title={`GST: ${vendor.gst_number}`}
                          >
                            G
                          </span>
                        )}
                        {vendor.fssai_number && (
                          <span
                            className="bg-accent/10 dark:bg-accent/20 text-accent dark:text-accent flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
                            title={`FSSAI: ${vendor.fssai_number}`}
                          >
                            F
                          </span>
                        )}
                        {vendor.pan_number && (
                          <span
                            className="bg-accent/10 dark:bg-accent/20 text-accent dark:text-accent flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
                            title={`PAN: ${vendor.pan_number}`}
                          >
                            P
                          </span>
                        )}
                        {!vendor.gst_number && !vendor.fssai_number && !vendor.pan_number && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            None
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${statusColors[vendor.status] || ""}`}
                      >
                        {vendor.status}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--color-outline-variant)]">
                      {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {vendor.status !== "active" && (
                          <>
                            <button
                              onClick={() => updateVendorStatus(vendor.id, "active")}
                              className="rounded-lg bg-green-600 px-3 py-1 font-bold text-white hover:opacity-90"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateVendorStatus(vendor.id, "suspended")}
                              className="rounded-lg bg-red-600 px-3 py-1 font-bold text-white hover:opacity-90"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedVendor(vendor)}
                          className="rounded-lg bg-[var(--color-surface-container)] px-3 py-1 font-bold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                        >
                          View
                        </button>
                        <button
                          onClick={() => deleteVendor(vendor.id, vendor.shop_name)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 font-bold text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVendor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kyc-modal-title"
          onKeyDown={(e) => e.key === "Escape" && setSelectedVendor(null)}
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[var(--color-surface-container-lowest)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
              <h2
                id="kyc-modal-title"
                className="text-lg font-black text-[var(--color-on-surface)]"
              >
                KYC Review
              </h2>
              <button
                onClick={() => setSelectedVendor(null)}
                aria-label="Close"
                className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface)]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">
                    Shop Name
                  </p>
                  <p className="font-bold text-[var(--color-on-surface)]">
                    {selectedVendor.shop_name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Owner</p>
                  <p className="font-bold text-[var(--color-on-surface)]">
                    {selectedVendor.owner_name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Phone</p>
                  <p className="font-bold text-[var(--color-on-surface)]">{selectedVendor.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Email</p>
                  <p className="text-sm font-bold text-[var(--color-on-surface)]">
                    {selectedVendor.email || "Not provided"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Address</p>
                <p className="text-sm text-[var(--color-on-surface)]">
                  {selectedVendor.address}, {selectedVendor.city}, {selectedVendor.state} -{" "}
                  {selectedVendor.pincode}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">
                    Store Type
                  </p>
                  <p className="font-bold text-[var(--color-on-surface)] capitalize">
                    {selectedVendor.type}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">
                    Cuisine
                  </p>
                  <p className="font-bold text-[var(--color-on-surface)]">
                    {selectedVendor.cuisine || "Not set"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-xl bg-[var(--color-surface-subtle)] p-4">
                <p className="text-xs font-black tracking-widest text-[var(--color-on-surface)] uppercase">
                  Documents (KYC)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={`rounded-lg border p-3 ${selectedVendor.gst_number ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "border-[var(--color-border-subtle)]"}`}
                  >
                    <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">
                      GST Number
                    </p>
                    <p
                      className={`mt-1 text-sm font-bold ${selectedVendor.gst_number ? "text-green-700 dark:text-green-300" : "text-[var(--color-outline-variant)]"}`}
                    >
                      {selectedVendor.gst_number || "Not provided"}
                    </p>
                  </div>
                  <div
                    className={`rounded-lg border p-3 ${selectedVendor.fssai_number ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "border-[var(--color-border-subtle)]"}`}
                  >
                    <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">
                      FSSAI Number
                    </p>
                    <p
                      className={`mt-1 text-sm font-bold ${selectedVendor.fssai_number ? "text-green-700 dark:text-green-300" : "text-[var(--color-outline-variant)]"}`}
                    >
                      {selectedVendor.fssai_number || "Not provided"}
                    </p>
                  </div>
                  <div
                    className={`rounded-lg border p-3 ${selectedVendor.pan_number ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "border-[var(--color-border-subtle)]"}`}
                  >
                    <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">
                      PAN Number
                    </p>
                    <p
                      className={`mt-1 text-sm font-bold ${selectedVendor.pan_number ? "text-green-700 dark:text-green-300" : "text-[var(--color-outline-variant)]"}`}
                    >
                      {selectedVendor.pan_number || "Not provided"}
                    </p>
                  </div>
                </div>
                {!selectedVendor.gst_number &&
                  !selectedVendor.fssai_number &&
                  !selectedVendor.pan_number && (
                    <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      No documents submitted. Vendor should upload GST/FSSAI/PAN.
                    </p>
                  )}
              </div>

              {selectedVendor.description && (
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">
                    Description
                  </p>
                  <p className="text-sm text-[var(--color-on-surface)]">
                    {selectedVendor.description}
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="review-notes"
                  className="text-[10px] text-[var(--color-outline-variant)] uppercase"
                >
                  Admin Review Notes
                </label>
                <textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Optional notes about this vendor..."
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-3 py-2 text-sm text-[var(--color-on-surface)]"
                />
              </div>

              <div className="flex gap-3 border-t border-[var(--color-border-subtle)] pt-4">
                {selectedVendor.status !== "active" ? (
                  <>
                    <button
                      onClick={() => {
                        if (
                          !confirm(
                            `Approve ${selectedVendor.shop_name}? They will be able to receive orders.`
                          )
                        )
                          return;
                        updateVendorStatus(selectedVendor.id, "active");
                        setSelectedVendor(null);
                      }}
                      className="flex-1 rounded-xl bg-green-600 py-3 font-bold text-white transition-colors hover:bg-green-700"
                    >
                      Approve Partner
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Rejection reason (optional):");
                        updateVendorStatus(selectedVendor.id, "suspended", reason || undefined);
                        setSelectedVendor(null);
                      }}
                      className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white transition-colors hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      if (
                        !confirm(
                          `Suspend ${selectedVendor.shop_name}? They will no longer receive orders.`
                        )
                      )
                        return;
                      const reason = prompt("Suspension reason (optional):");
                      updateVendorStatus(selectedVendor.id, "suspended", reason || undefined);
                      setSelectedVendor(null);
                    }}
                    className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white transition-colors hover:bg-red-700"
                  >
                    Suspend Partner
                  </button>
                )}
                <button
                  onClick={() => deleteVendor(selectedVendor.id, selectedVendor.shop_name)}
                  className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
