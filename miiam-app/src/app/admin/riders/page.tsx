"use client";

import { useMemo, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import type { Rider } from "@/lib/types";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToastStore } from "@/lib/store/toastStore";
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
    email: "", phone: "", full_name: "", 
    profile_photo: null as File | null,
    id_proof_type: "" as string,
    id_proof_image: null as File | null,
    vehicle_type: "motorcycle",
    vehicle_number: "",
  });
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"overview" | "earnings" | "orders" | "docs">("overview");
  
  useEffect(() => {
    if (searchParams.get("add") === "true") setShowAddModal(true);
  }, [searchParams]);

  useEffect(() => {
    loadRiders();
    const channel = supabase.channel("riders-tracker")
      .on("postgres_changes", { event: "*", schema: "public", table: "riders" }, () => loadRiders())
      .subscribe();
    const ordersChannel = supabase.channel("admin-orders-tracker")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => loadRiders())
      .subscribe();
    return () => { supabase.removeChannel(channel); supabase.removeChannel(ordersChannel); };
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
      if (res.ok) { setSelectedRider(null); loadRiders(); }
    } catch (err) { console.error(err); }
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
      if (!res.ok) { useToastStore.getState().addToast(data.error || "Failed", "error"); setSaving(false); return; }
      setShowAddModal(false);
      setNewRider({ email: "", phone: "", full_name: "", profile_photo: null, id_proof_type: "", id_proof_image: null, vehicle_type: "motorcycle", vehicle_number: "" });
      loadRiders();
    } catch (err) { console.error(err); setSaving(false); }
  }

  const filteredRiders = riders.filter(r => filter === "all" || (filter === "online" && r.is_online) || (filter === "offline" && !r.is_online));
  const onlineCount = riders.filter(r => r.is_online).length;
  const totalDeliveries = riders.reduce((s, r) => s + (r.total_deliveries || 0), 0);
  const avgRating = riders.length ? riders.reduce((s, r) => s + (r.rating || 0), 0) / riders.length : 0;

  if (loading) return <div className="px-8 py-12">Loading...</div>;

  return (
    <div className="px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-on-surface)]">Riders</h1>
          <p className="text-[var(--color-outline-variant)]">Manage delivery riders</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">add</span> Add Rider
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)]"><p className="text-xs font-black text-[var(--color-outline-variant)] uppercase mb-1">Total Riders</p><p className="text-3xl font-black">{riders.length}</p></div>
        <div className="bg-green-50 p-6 rounded-3xl border border-green-100"><p className="text-xs font-black text-green-600 uppercase mb-1">Online Now</p><p className="text-3xl font-black text-green-600">{onlineCount}</p></div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)]"><p className="text-xs font-black text-[var(--color-outline-variant)] uppercase mb-1">Total Deliveries</p><p className="text-3xl font-black">{totalDeliveries}</p></div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)]"><p className="text-xs font-black text-[var(--color-outline-variant)] uppercase mb-1">Avg Rating</p><p className="text-3xl font-black flex items-center gap-1">{avgRating.toFixed(1)} <span className="material-symbols-outlined text-amber-500 text-xl">star</span></p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
            <h2 className="font-black text-[var(--color-on-surface)] uppercase text-sm">Live Map</h2>
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span><span className="text-xs font-bold text-[var(--color-outline-variant)]">Live</span></div>
          </div>
          <div className="h-[400px] bg-[var(--color-surface-container)] relative">
            <AdminRiderMap riders={riders} onRiderClick={setSelectedRider} />
          </div>
        </div>

        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border-subtle)]">
            <div className="flex gap-2">
              {(["all", "online", "offline"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-2 rounded-lg text-xs font-bold ${filter === f ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-subtle)] text-[var(--color-outline)]"}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {filteredRiders.map(rider => (
              <div key={rider.id} className="p-4 border-b border-slate-50 hover:bg-[var(--color-surface-subtle)] cursor-pointer" onClick={() => setSelectedRider(rider)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold overflow-hidden shadow-inner">
                    {rider.profile?.avatar_url ? (
<BlurImage 
  src={rider.profile.avatar_url} 
  alt={`${rider.name || 'Rider'}'s avatar`}
  className="w-full h-full object-cover"
/>
                    ) : (
                      rider.name?.[0] || "R"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[var(--color-on-surface)] truncate">{rider.name || "Unknown Rider"}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full ${rider.is_online ? "bg-green-500" : "bg-slate-300"}`}></span>
                      <span className="text-[var(--color-outline-variant)]">{rider.is_online ? "Online" : "Offline"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleOnline(rider.id, !rider.is_online); }}
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border transition-all ${rider.is_online ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                    >
                      {rider.is_online ? "Offline" : "Online"}
                    </button>
                    <div className="text-right">
                      <p className="text-xs font-black text-[var(--color-on-surface)] flex items-center gap-1">{(rider.rating || 0).toFixed(1)} <span className="material-symbols-outlined text-amber-500 text-sm">star</span></p>
                      <p className="text-[10px] text-[var(--color-outline-variant)]">{rider.total_deliveries || 0} deliveries</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedRider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg h-full shadow-2xl flex flex-col">
            <div className="p-8 border-b border-[var(--color-border-subtle)] flex justify-between items-center bg-[var(--color-surface-subtle)]/50">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[#ff7670] text-white text-3xl font-black flex items-center justify-center overflow-hidden">
                  {selectedRider.profile?.avatar_url ? (
                    <BlurImage src={selectedRider.profile.avatar_url} alt={`${selectedRider.name || 'Selected rider'}'s avatar`} className="w-full h-full object-cover" />
                  ) : (
                    selectedRider.name?.[0] || "R"
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black text-[var(--color-on-surface)]">{selectedRider.name || "Unknown Rider"}</h2>
                  <p className="text-sm font-bold text-[var(--color-outline-variant)] uppercase">{selectedRider.is_online ? "Active Now" : "Offline"}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRider(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-surface-container)] text-[var(--color-outline-variant)]"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex px-8 border-b border-[var(--color-border-subtle)]">
              {(["overview", "earnings", "orders", "docs"] as const).map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-4 text-xs font-black uppercase border-b-2 ${activeTab === tab ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-outline-variant)]"}`}>{tab}</button>))}
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {activeTab === "overview" && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-green-600 uppercase mb-1">Total Deliveries</p>
                      <p className="text-xl font-black text-green-700">{selectedRider.total_deliveries || 0}</p>
                    </div>
                    <div className="bg-[var(--color-primary)]/5 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-[var(--color-primary)] uppercase mb-1">Total Earnings</p>
                      <p className="text-xl font-black text-[var(--color-primary)]">₹{selectedRider.total_earnings || 0}</p>
                    </div>
                    <div className="bg-[var(--color-surface-subtle)] p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-[var(--color-outline-variant)] uppercase mb-1">Rating</p>
                      <p className="text-xl font-black text-amber-500">{(selectedRider.rating || 0).toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--color-surface-subtle)] p-6 rounded-3xl">
                      <p className="text-[10px] font-black text-[var(--color-outline-variant)] uppercase mb-1">Vehicle</p>
                      <p className="text-lg font-black capitalize">{selectedRider.vehicle_type}</p>
                      {selectedRider.vehicle_number && (
                        <p className="text-xs font-bold text-[var(--color-primary)] mt-1 uppercase tracking-tighter bg-red-50 inline-block px-2 py-0.5 rounded-md">
                          {selectedRider.vehicle_number}
                        </p>
                      )}
                    </div>
                    <div className="bg-[var(--color-surface-subtle)] p-6 rounded-3xl"><p className="text-[10px] font-black text-[var(--color-outline-variant)] uppercase mb-1">Status</p><p className="text-lg font-black">{selectedRider.is_online ? "Online" : "Offline"}</p></div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-[var(--color-outline-variant)] uppercase">Contact</h3>
                    <div className="p-4 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-2xl flex items-center gap-4"><span className="material-symbols-outlined text-[var(--color-outline-variant)]">mail</span><p className="font-bold">{selectedRider.profile?.email || "No email"}</p></div>
                    <div className="p-4 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-2xl flex items-center gap-4"><span className="material-symbols-outlined text-[var(--color-outline-variant)]">call</span><p className="font-bold">{selectedRider.phone || "No phone"}</p></div>
                  </div>
                  <div className="flex gap-3 pt-6">
                    <button 
                      onClick={() => toggleOnline(selectedRider.id, !selectedRider.is_online)} 
                      className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${selectedRider.is_online ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"}`}
                    >
                      {selectedRider.is_online ? "Go Offline" : "Go Online"}
                    </button>
                  </div>
                </>
              )}
              {activeTab === "earnings" && (
                <>
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] text-white">
                    <p className="text-[10px] font-black text-white/40 uppercase mb-2">Total Earnings</p>
                    <p className="text-4xl font-black">₹{selectedRider.total_earnings || 0}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--color-surface-subtle)] p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-[var(--color-outline-variant)] uppercase mb-1">This Month</p>
                      <p className="text-xl font-black">₹0</p>
                    </div>
                    <div className="bg-[var(--color-surface-subtle)] p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-[var(--color-outline-variant)] uppercase mb-1">Balance</p>
                      <p className="text-xl font-black">₹{selectedRider.balance || selectedRider.total_earnings || 0}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-outline-variant)] text-center">Earnings are updated after each delivery</p>
                </>
              )}
              
              {activeTab === "orders" && (
                <RiderOrdersHistory riderId={selectedRider.id} />
              )}

              {activeTab === "docs" && (
                <div className="space-y-4">
                  <div className="p-5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-container)] overflow-hidden flex items-center justify-center">
                        {selectedRider.profile?.avatar_url ? <BlurImage src={selectedRider.profile.avatar_url} alt={`${selectedRider.name || 'Selected rider'}'s avatar`} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-[var(--color-outline-variant)]">person</span>}
                      </div>
                      <div>
                        <p className="font-black text-[var(--color-on-surface)] text-sm">Profile Photo</p>
                        <p className="text-[10px] font-black uppercase text-green-500">Uploaded</p>
                      </div>
                    </div>
                    {selectedRider.profile?.avatar_url && <a href={selectedRider.profile.avatar_url} target="_blank" className="text-xs font-black text-[var(--color-primary)] uppercase">View</a>}
                  </div>
                  <div className="p-5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-container)] overflow-hidden flex items-center justify-center">
                        {selectedRider.id_proof_image ? <BlurImage src={selectedRider.id_proof_image} alt={`${selectedRider.id_proof_type || 'Govt ID'} proof image`} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-[var(--color-outline-variant)]">badge</span>}
                      </div>
                      <div>
                        <p className="font-black text-[var(--color-on-surface)] text-sm">ID Proof ({selectedRider.id_proof_type || "Govt ID"})</p>
                        <p className={`text-[10px] font-black uppercase ${selectedRider.id_proof_image ? "text-green-500" : "text-amber-500"}`}>{selectedRider.id_proof_image ? "Uploaded" : "Missing"}</p>
                      </div>
                    </div>
                    {selectedRider.id_proof_image && <a href={selectedRider.id_proof_image} target="_blank" className="text-xs font-black text-[var(--color-primary)] uppercase">View</a>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--color-border-subtle)] flex justify-between items-center sticky top-0 bg-[var(--color-surface-container-lowest)]">
              <h2 className="text-xl font-black text-[var(--color-on-surface)]">{isEditing ? "Edit Rider" : "Add Rider"}</h2>
              <button onClick={() => { setShowAddModal(false); setIsEditing(false); }} className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)] p-2"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={addRider} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Full Name</label><input type="text" required value={newRider.full_name} onChange={e => setNewRider({ ...newRider, full_name: e.target.value })} className="w-full p-4 rounded-xl border border-[var(--color-border-subtle)] font-bold" placeholder="Name" /></div>
              <div><label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Email</label><input type="email" required value={newRider.email} onChange={e => setNewRider({ ...newRider, email: e.target.value })} className="w-full p-4 rounded-xl border border-[var(--color-border-subtle)] font-bold" placeholder="Email" /></div>
              <div><label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Phone</label><input type="tel" required value={newRider.phone} onChange={e => setNewRider({ ...newRider, phone: e.target.value })} className="w-full p-4 rounded-xl border border-[var(--color-border-subtle)] font-bold" placeholder="+91XXXXXXXXXX" /></div>
              <div><label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Profile Photo</label><input type="file" accept="image/*" onChange={e => setNewRider({ ...newRider, profile_photo: e.target.files?.[0] || null })} className="w-full p-4 rounded-xl border border-[var(--color-border-subtle)]" /></div>
              <div><label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">ID Proof</label><select value={newRider.id_proof_type} onChange={e => setNewRider({ ...newRider, id_proof_type: e.target.value, id_proof_image: null })} className="w-full p-4 rounded-xl border border-[var(--color-border-subtle)] font-bold" required><option value="">Select</option><option value="aadhar">Aadhar</option><option value="dl">DL</option><option value="voter">Voter</option><option value="pan">Pan</option></select></div>
              {newRider.id_proof_type && <div><label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Upload {newRider.id_proof_type}</label><input type="file" accept="image/*" onChange={e => setNewRider({ ...newRider, id_proof_image: e.target.files?.[0] || null })} className="w-full p-4 rounded-xl border border-[var(--color-border-subtle)]" required /></div>}
              <div><label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Vehicle</label><select value={newRider.vehicle_type} onChange={e => setNewRider({ ...newRider, vehicle_type: e.target.value, vehicle_number: "" })} className="w-full p-4 rounded-xl border border-[var(--color-border-subtle)] font-bold"><option value="motorcycle">Motorcycle</option><option value="scooty">Scooty</option><option value="bicycle">Bicycle</option></select></div>
              {(newRider.vehicle_type === "motorcycle" || newRider.vehicle_type === "scooty") && <div><label className="block text-xs font-bold text-[var(--color-outline-variant)] uppercase mb-2">Vehicle Number</label><input type="text" value={newRider.vehicle_number} onChange={e => setNewRider({ ...newRider, vehicle_number: e.target.value })} className="w-full p-4 rounded-xl border border-[var(--color-border-subtle)] font-bold" placeholder="Number" /></div>}
              <button type="submit" disabled={saving} className="w-full bg-[var(--color-primary)] text-white px-6 py-4 rounded-xl font-bold hover:bg-[#a00019] disabled:opacity-50">
                {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Rider"}
              </button>
              {isEditing && (
                <button type="button" onClick={async () => { if (selectedRider?.id && await confirm({ title: "Delete", message: "Are you sure?", variant: "danger" })) deleteRider(selectedRider.id); }} className="w-full py-4 rounded-xl font-black text-xs uppercase text-red-600 bg-red-50 hover:bg-red-100 transition-all mt-2">
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

  if (loading) return <div className="py-8 text-center text-[var(--color-outline-variant)]">Loading orders...</div>;

  if (orders.length === 0) return (
    <div className="text-center py-16 bg-[var(--color-surface-subtle)] rounded-3xl border-2 border-dashed border-[var(--color-border-subtle)]">
      <span className="material-symbols-outlined text-4xl text-[var(--color-outline-variant)]/60 mb-2">delivery_dining</span>
      <p className="text-sm font-bold text-[var(--color-outline-variant)]">No deliveries yet</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {orders.map(order => (
        <div key={order.id} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-bold text-[var(--color-outline)]">#{order.id.slice(0, 8)}</p>
              <p className="text-xs text-[var(--color-outline-variant)]">{order.placed_at ? new Date(order.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}</p>
            </div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${order.status === "delivered" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"}`}>
              {order.status?.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center">
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