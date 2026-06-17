"use client";

import { useEffect, useState } from "react";
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
  created_at: string;
}

export default function VerificationPage() {
  const supabase = createClient();
  const [vendors, setVendors] = useState<VendorVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState<VendorVerification | null>(null);

  useEffect(() => {
    loadVendors();
  }, [supabase]);

  async function loadVendors() {
    setLoading(true);
    const { data } = await supabase
      .from("vendors")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setVendors(data);
    setLoading(false);
  }

  const updateVendorStatus = async (vendorId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("vendors")
        .update({ status: newStatus })
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
        v.id === vendorId ? { ...v, status: newStatus as any } : v
      ));

      setSelectedVendor(null);
    } catch (error: any) {
      console.error("Error updating vendor:", error);
      useToastStore.getState().addToast(`Failed: ${error.message}`, "error");
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
    active: "bg-green-100 text-green-700",
    inactive: "bg-[var(--color-surface-container)] text-[var(--color-on-surface)]",
    suspended: "bg-red-100 text-red-700",
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
                <th className="p-4 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">Cuisine</th>
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
                      <span className="bg-[var(--color-surface-container)] px-2 py-1 rounded text-[10px] font-bold">
                        {vendor.cuisine || "Not set"}
                      </span>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-black text-lg">Vendor Details</h2>
              <button onClick={() => setSelectedVendor(null)} className="text-[var(--color-outline-variant)]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Shop Name</p>
                  <p className="font-bold">{selectedVendor.shop_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Owner</p>
                  <p className="font-bold">{selectedVendor.owner_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Phone</p>
                  <p className="font-bold">{selectedVendor.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Email</p>
                  <p className="font-bold text-sm">{selectedVendor.email || "Not provided"}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Address</p>
                <p className="text-sm">{selectedVendor.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Cuisine</p>
                  <p className="font-bold">{selectedVendor.cuisine || "Not set"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase">Status</p>
                  <span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${statusColors[selectedVendor.status]}`}>
                    {selectedVendor.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                {selectedVendor.status !== "active" ? (
                  <>
                    <button
                      onClick={() => updateVendorStatus(selectedVendor.id, "active")}
                      className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold"
                    >
                      Approve Partner
                    </button>
                    <button
                      onClick={() => updateVendorStatus(selectedVendor.id, "suspended")}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => updateVendorStatus(selectedVendor.id, "suspended")}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold"
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
