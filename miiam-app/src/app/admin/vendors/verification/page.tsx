"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";

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
      .select("id, shop_name, owner_name, phone, email, address, cuisine, status, gst_number, fssai_number, pan_number, type, city, state, pincode, description, created_at")
      .order("created_at", { ascending: false });
    if (data) setVendors(data);
    setLoading(false);
  }

  const updateVendorStatus = async (vendorId: string, newStatus: string, reason?: string) => {
    try {
      const updates: Record<string, unknown> = { status: newStatus };
      if (reason) updates.rejection_reason = reason;
      updates.reviewed_at = new Date().toISOString();

      const { error } = await supabase
        .from("vendors")
        .update(updates)
        .eq("id", vendorId);

      if (error) throw error;

      // If approving, also update the user's profile role to vendor
      if (newStatus === "active") {
        const vendor = vendors.find(v => v.id === vendorId);
        if (vendor?.email) {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", vendor.email)
            .maybeSingle();

          if (userProfile) {
            await supabase
              .from("profiles")
              .update({ role: "vendor" })
              .eq("id", userProfile.id);
          }
        }
      }

      setVendors(vendors.map(v => 
        v.id === vendorId ? { ...v, status: newStatus as VendorVerification["status"] } : v
      ));

      setSelectedVendor(null);
    } catch (error: unknown) {
      console.error("Error updating vendor:", error);
      useToastStore.getState().addToast(`Failed: ${(error as Error).message}`, "error");
    }
  };

  const filtered = vendors.filter(v => {
    if (filter === "all") return true;
    if (filter === "pending") return v.status === "pending";
    return v.status === filter;
  });

  const pendingCount = vendors.filter(v => v.status === "pending").length;
  const approvedToday = vendors.filter(v => v.status === "active").length;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    inactive: "bg-[var(--color-surface-container)] text-[var(--color-on-surface)]",
    suspended: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  if (loading) return <div className="px-8">Loading verifications...</div>;

  return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Vendor Verifications</h1>
          <p className="text-[var(--color-outline-variant)] text-sm">Review and approve partner applications</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface-container-lowest)] p-5 rounded-2xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-[10px] font-bold text-[var(--color-outline-variant)] uppercase mb-1">Pending Review</p>
          <p className="text-3xl font-black text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-5 rounded-2xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-[10px] font-bold text-[var(--color-outline-variant)] uppercase mb-1">Active Partners</p>
          <p className="text-3xl font-black text-green-600">{approvedToday}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-5 rounded-2xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-[10px] font-bold text-[var(--color-outline-variant)] uppercase mb-1">Total Vendors</p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{vendors.length}</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-5 rounded-2xl border border-[var(--color-border-subtle)] shadow-sm">
          <p className="text-[10px] font-bold text-[var(--color-outline-variant)] uppercase mb-1">Suspended</p>
          <p className="text-3xl font-black text-red-600">{vendors.filter(v => v.status === "suspended").length}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "active", "inactive", "suspended"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${
              filter === status
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] border border-[var(--color-border-subtle)]"
            }`}
          >
            {status === "all" ? "All" : status}
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Shop</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Owner</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Contact</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Documents</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Status</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Date</th>
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Actions</th>
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
                      <p className="text-[10px] text-[var(--color-outline-variant)]">{vendor.id.slice(0, 8)}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[var(--color-on-surface)]">{vendor.owner_name}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-[var(--color-on-surface-variant)]">{vendor.phone}</p>
                      <p className="text-[10px] text-[var(--color-outline-variant)]">{vendor.email}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {vendor.gst_number && <span className="w-5 h-5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center justify-center text-[10px] font-bold" title={`GST: ${vendor.gst_number}`}>G</span>}
                        {vendor.fssai_number && <span className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold" title={`FSSAI: ${vendor.fssai_number}`}>F</span>}
                        {vendor.pan_number && <span className="w-5 h-5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center justify-center text-[10px] font-bold" title={`PAN: ${vendor.pan_number}`}>P</span>}
                        {!vendor.gst_number && !vendor.fssai_number && !vendor.pan_number && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">None</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${statusColors[vendor.status] || ""}`}>
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
                              className="px-3 py-1 bg-green-600 text-white rounded-lg font-bold hover:opacity-90"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateVendorStatus(vendor.id, "suspended")}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg font-bold hover:opacity-90"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedVendor(vendor)}
                          className="px-3 py-1 bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] rounded-lg font-bold hover:bg-[var(--color-surface-container-high)]"
                        >
                          View
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="kyc-modal-title" onKeyDown={(e) => e.key === "Escape" && setSelectedVendor(null)}>
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center justify-between sticky top-0 bg-[var(--color-surface-container-lowest)] z-10">
              <h2 id="kyc-modal-title" className="font-black text-lg text-[var(--color-on-surface)]">KYC Review</h2>
              <button onClick={() => setSelectedVendor(null)} aria-label="Close" className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface)]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Shop Name</p>
                  <p className="font-bold text-[var(--color-on-surface)]">{selectedVendor.shop_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Owner</p>
                  <p className="font-bold text-[var(--color-on-surface)]">{selectedVendor.owner_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Phone</p>
                  <p className="font-bold text-[var(--color-on-surface)]">{selectedVendor.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Email</p>
                  <p className="font-bold text-sm text-[var(--color-on-surface)]">{selectedVendor.email || "Not provided"}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Address</p>
                <p className="text-sm text-[var(--color-on-surface)]">{selectedVendor.address}, {selectedVendor.city}, {selectedVendor.state} - {selectedVendor.pincode}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Store Type</p>
                  <p className="font-bold text-[var(--color-on-surface)] capitalize">{selectedVendor.type}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Cuisine</p>
                  <p className="font-bold text-[var(--color-on-surface)]">{selectedVendor.cuisine || "Not set"}</p>
                </div>
              </div>

              <div className="bg-[var(--color-surface-subtle)] rounded-xl p-4 space-y-3">
                <p className="text-xs font-black text-[var(--color-on-surface)] uppercase tracking-widest">Documents (KYC)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-3 rounded-lg border ${selectedVendor.gst_number ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "border-[var(--color-border-subtle)]"}`}>
                    <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">GST Number</p>
                    <p className={`font-bold text-sm mt-1 ${selectedVendor.gst_number ? "text-green-700 dark:text-green-300" : "text-[var(--color-outline-variant)]"}`}>
                      {selectedVendor.gst_number || "Not provided"}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg border ${selectedVendor.fssai_number ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "border-[var(--color-border-subtle)]"}`}>
                    <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">FSSAI Number</p>
                    <p className={`font-bold text-sm mt-1 ${selectedVendor.fssai_number ? "text-green-700 dark:text-green-300" : "text-[var(--color-outline-variant)]"}`}>
                      {selectedVendor.fssai_number || "Not provided"}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg border ${selectedVendor.pan_number ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "border-[var(--color-border-subtle)]"}`}>
                    <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">PAN Number</p>
                    <p className={`font-bold text-sm mt-1 ${selectedVendor.pan_number ? "text-green-700 dark:text-green-300" : "text-[var(--color-outline-variant)]"}`}>
                      {selectedVendor.pan_number || "Not provided"}
                    </p>
                  </div>
                </div>
                {!selectedVendor.gst_number && !selectedVendor.fssai_number && !selectedVendor.pan_number && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    No documents submitted. Vendor should upload GST/FSSAI/PAN.
                  </p>
                )}
              </div>

              {selectedVendor.description && (
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Description</p>
                  <p className="text-sm text-[var(--color-on-surface)]">{selectedVendor.description}</p>
                </div>
              )}

              <div>
                <label htmlFor="review-notes" className="text-[10px] text-[var(--color-outline-variant)] uppercase">Admin Review Notes</label>
                <textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Optional notes about this vendor..."
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border border-[var(--color-border-subtle)] rounded-lg text-sm text-[var(--color-on-surface)] bg-[var(--color-surface-container-lowest)]"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[var(--color-border-subtle)]">
                {selectedVendor.status !== "active" ? (
                  <>
                    <button
                      onClick={() => {
                        if (!confirm(`Approve ${selectedVendor.shop_name}? They will be able to receive orders.`)) return;
                        updateVendorStatus(selectedVendor.id, "active");
                        setSelectedVendor(null);
                      }}
                      className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
                    >
                      Approve Partner
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Rejection reason (optional):");
                        updateVendorStatus(selectedVendor.id, "suspended", reason || undefined);
                        setSelectedVendor(null);
                      }}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      if (!confirm(`Suspend ${selectedVendor.shop_name}? They will no longer receive orders.`)) return;
                      const reason = prompt("Suspension reason (optional):");
                      updateVendorStatus(selectedVendor.id, "suspended", reason || undefined);
                      setSelectedVendor(null);
                    }}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                  >
                    Suspend Partner
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
