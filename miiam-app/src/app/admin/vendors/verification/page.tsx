"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface VendorVerification {
  id: string;
  shop_name: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  cuisine: string;
  status: "pending" | "active" | "inactive" | "suspended";
  submitted_at: string;
  document_status: "pending" | "submitted" | "verified" | "rejected";
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

  const updateVendorStatus = async (vendorId: string, newStatus: string, action: "approve" | "reject") => {
    try {
      const { error } = await supabase
        .from("vendors")
        .update({ 
          status: newStatus,
          document_status: action === "approve" ? "verified" : "rejected"
        })
        .eq("id", vendorId);

      if (error) throw error;

      setVendors(vendors.map(v => 
        v.id === vendorId ? { 
          ...v, 
          status: newStatus as any,
          document_status: (action === "approve" ? "verified" : "rejected") as any
        } : v
      ));

      alert(`Vendor ${action === "approve" ? "approved" : "rejected"} successfully!`);
      setSelectedVendor(null);
    } catch (error: any) {
      console.error("Error updating vendor:", error);
      alert(`Failed: ${error.message}`);
    }
  };

  const filtered = vendors.filter(v => {
    if (filter === "all") return true;
    if (filter === "pending") return v.status === "pending" || v.status === "inactive";
    return v.status === filter;
  });

  const pendingCount = vendors.filter(v => v.status === "pending" || v.status === "inactive").length;
  const approvedToday = vendors.filter(v => v.status === "active").length;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    inactive: "bg-slate-100 text-slate-700",
    suspended: "bg-red-100 text-red-700",
  };

  const docStatusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    submitted: "bg-blue-100 text-blue-700",
    verified: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  if (loading) return <div className="px-8">Loading verifications...</div>;

  return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Vendor Verifications</h1>
          <p className="text-slate-400 text-sm">Review and approve partner applications</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pending Review</p>
          <p className="text-3xl font-black text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Active Partners</p>
          <p className="text-3xl font-black text-green-600">{approvedToday}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Vendors</p>
          <p className="text-3xl font-black text-slate-800">{vendors.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Suspended</p>
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
                ? "bg-[#ba001c] text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {status === "all" ? "All" : status}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Shop</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Owner</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Contact</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Cuisine</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Status</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Date</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No vendors found
                  </td>
                </tr>
              ) : (
                filtered.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{vendor.shop_name}</p>
                      <p className="text-[10px] text-slate-400">{vendor.id.slice(0, 8)}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-700">{vendor.owner_name}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-600">{vendor.phone}</p>
                      <p className="text-[10px] text-slate-400">{vendor.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold">
                        {vendor.cuisine || "Not set"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${statusColors[vendor.status] || ""}`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {vendor.submitted_at ? new Date(vendor.submitted_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {vendor.status !== "active" && (
                          <>
                            <button
                              onClick={() => updateVendorStatus(vendor.id, "active", "approve")}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg font-bold hover:opacity-90"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateVendorStatus(vendor.id, "suspended", "reject")}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg font-bold hover:opacity-90"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedVendor(vendor)}
                          className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200"
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
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-black text-lg">Vendor Details</h2>
              <button onClick={() => setSelectedVendor(null)} className="text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Shop Name</p>
                  <p className="font-bold">{selectedVendor.shop_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Owner</p>
                  <p className="font-bold">{selectedVendor.owner_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Phone</p>
                  <p className="font-bold">{selectedVendor.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Email</p>
                  <p className="font-bold text-sm">{selectedVendor.email || "Not provided"}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Address</p>
                <p className="text-sm">{selectedVendor.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Cuisine</p>
                  <p className="font-bold">{selectedVendor.cuisine || "Not set"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Status</p>
                  <span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${statusColors[selectedVendor.status]}`}>
                    {selectedVendor.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                {selectedVendor.status !== "active" ? (
                  <>
                    <button
                      onClick={() => updateVendorStatus(selectedVendor.id, "active", "approve")}
                      className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold"
                    >
                      Approve Partner
                    </button>
                    <button
                      onClick={() => updateVendorStatus(selectedVendor.id, "suspended", "reject")}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => updateVendorStatus(selectedVendor.id, "suspended", "reject")}
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
