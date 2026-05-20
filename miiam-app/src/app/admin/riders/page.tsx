"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Rider } from "@/lib/types";

function RidersPage() {
  const supabase = createClient();
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
    console.log("DEBUG: Fetching riders...");
    
    // 1. Try a simple fetch first to see if riders exist at all
    const { data: rawRiders, error: rawError } = await supabase.from("riders").select("*");
    console.log("DEBUG: Raw Riders Data:", rawRiders);
    if (rawError) console.error("DEBUG: Raw Fetch Error:", rawError);

    // 2. Try the joined fetch
    const { data, error } = await supabase
      .from("riders")
      .select("*, profile:profiles(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("DEBUG: Join Fetch Error:", error);
      // Fallback to raw riders if join fails
      setRiders(rawRiders || []);
    } else {
      console.log("DEBUG: Final Riders with Profiles:", data);
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
    const formData = new FormData();
    formData.append("email", newRider.email);
    formData.append("phone", newRider.phone);
    formData.append("full_name", newRider.full_name);
    formData.append("vehicle_type", newRider.vehicle_type);
    
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
      if (!res.ok) { alert(data.error || "Failed"); setSaving(false); return; }
      setShowAddModal(false);
      setNewRider({ email: "", phone: "", full_name: "", profile_photo: null, id_proof_type: "", id_proof_image: null, vehicle_type: "motorcycle", vehicle_number: "" });
      setTimeout(() => window.location.reload(), 1000);
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
          <h1 className="text-3xl font-black text-slate-800">Riders</h1>
          <p className="text-slate-400">Manage delivery riders</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-[#ba001c] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">add</span> Add Rider
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100"><p className="text-xs font-black text-slate-400 uppercase mb-1">Total Riders</p><p className="text-3xl font-black">{riders.length}</p></div>
        <div className="bg-green-50 p-6 rounded-3xl border border-green-100"><p className="text-xs font-black text-green-600 uppercase mb-1">Online Now</p><p className="text-3xl font-black text-green-600">{onlineCount}</p></div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100"><p className="text-xs font-black text-slate-400 uppercase mb-1">Total Deliveries</p><p className="text-3xl font-black">{totalDeliveries}</p></div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100"><p className="text-xs font-black text-slate-400 uppercase mb-1">Avg Rating</p><p className="text-3xl font-black flex items-center gap-1">{avgRating.toFixed(1)} <span className="material-symbols-outlined text-amber-500 text-xl">star</span></p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-black text-slate-800 uppercase text-sm">Live Map</h2>
            <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span><span className="text-xs font-bold text-slate-400">Live</span></div>
          </div>
          <div className="h-[400px] bg-slate-100 flex items-center justify-center relative">
            {riders.filter(r => r.is_online).map((rider, i) => (
              <div key={rider.id} className="absolute w-4 h-4 bg-[#ba001c] rounded-full border-2 border-white shadow-lg animate-pulse" style={{ left: `${30 + (i * 10) % 60}%`, top: `${20 + (i * 15) % 60}%` }} onClick={() => setSelectedRider(rider)} />
            ))}
            <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-xl shadow-lg text-xs"><p className="font-bold text-slate-600">{onlineCount} riders online</p></div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex gap-2">
              {(["all", "online", "offline"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-2 rounded-lg text-xs font-bold ${filter === f ? "bg-[#ba001c] text-white" : "bg-slate-50 text-slate-500"}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {filteredRiders.map(rider => (
              <div key={rider.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedRider(rider)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#ba001c] text-white flex items-center justify-center font-bold overflow-hidden shadow-inner">
                    {rider.profile?.avatar_url ? (
                      <img 
                        src={rider.profile.avatar_url} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerText = rider.name?.[0] || "R";
                        }}
                      />
                    ) : (
                      rider.name?.[0] || "R"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 truncate">{rider.name || "Unknown Rider"}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full ${rider.is_online ? "bg-green-500" : "bg-slate-300"}`}></span>
                      <span className="text-slate-400">{rider.is_online ? "Online" : "Offline"}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-800 flex items-center gap-1">{(rider.rating || 0).toFixed(1)} <span className="material-symbols-outlined text-amber-500 text-sm">star</span></p>
                    <p className="text-[10px] text-slate-400">{rider.total_deliveries || 0} deliveries</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedRider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ba001c] to-[#ff7670] text-white text-3xl font-black flex items-center justify-center overflow-hidden">
                  {selectedRider.profile?.avatar_url ? (
                    <img src={selectedRider.profile.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    selectedRider.name?.[0] || "R"
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">{selectedRider.name || "Unknown Rider"}</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase">{selectedRider.is_online ? "Active Now" : "Offline"}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRider(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="flex px-8 border-b border-slate-100">
              {(["overview", "earnings", "orders", "docs"] as const).map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-4 text-xs font-black uppercase border-b-2 ${activeTab === tab ? "border-[#ba001c] text-[#ba001c]" : "border-transparent text-slate-400"}`}>{tab}</button>))}
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {activeTab === "overview" && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-green-600 uppercase mb-1">Total Deliveries</p>
                      <p className="text-xl font-black text-green-700">{selectedRider.total_deliveries || 0}</p>
                    </div>
                    <div className="bg-[#ba001c]/5 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-[#ba001c] uppercase mb-1">Total Earnings</p>
                      <p className="text-xl font-black text-[#ba001c]">₹{selectedRider.total_earnings || 0}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Rating</p>
                      <p className="text-xl font-black text-amber-500">{(selectedRider.rating || 0).toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Vehicle</p>
                      <p className="text-lg font-black capitalize">{selectedRider.vehicle_type}</p>
                      {selectedRider.vehicle_number && (
                        <p className="text-xs font-bold text-[#ba001c] mt-1 uppercase tracking-tighter bg-red-50 inline-block px-2 py-0.5 rounded-md">
                          {selectedRider.vehicle_number}
                        </p>
                      )}
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p><p className="text-lg font-black">{selectedRider.is_online ? "Online" : "Offline"}</p></div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase">Contact</h3>
                    <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4"><span className="material-symbols-outlined text-slate-400">mail</span><p className="font-bold">{selectedRider.profile?.email || "No email"}</p></div>
                    <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4"><span className="material-symbols-outlined text-slate-400">call</span><p className="font-bold">{selectedRider.phone || "No phone"}</p></div>
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
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">This Month</p>
                      <p className="text-xl font-black">₹0</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Balance</p>
                      <p className="text-xl font-black">₹{selectedRider.balance || selectedRider.total_earnings || 0}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 text-center">Earnings are updated after each delivery</p>
                </>
              )}
              
              {activeTab === "orders" && (
                <RiderOrdersHistory riderId={selectedRider.id} />
              )}

              {activeTab === "docs" && (
                <div className="space-y-4">
                  <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                        {selectedRider.profile?.avatar_url ? <img src={selectedRider.profile.avatar_url} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-400">person</span>}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">Profile Photo</p>
                        <p className="text-[10px] font-black uppercase text-green-500">Uploaded</p>
                      </div>
                    </div>
                    {selectedRider.profile?.avatar_url && <a href={selectedRider.profile.avatar_url} target="_blank" className="text-xs font-black text-[#ba001c] uppercase">View</a>}
                  </div>
                  <div className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                        {selectedRider.id_proof_image ? <img src={selectedRider.id_proof_image} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-slate-400">badge</span>}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">ID Proof ({selectedRider.id_proof_type || "Govt ID"})</p>
                        <p className={`text-[10px] font-black uppercase ${selectedRider.id_proof_image ? "text-green-500" : "text-amber-500"}`}>{selectedRider.id_proof_image ? "Uploaded" : "Missing"}</p>
                      </div>
                    </div>
                    {selectedRider.id_proof_image && <a href={selectedRider.id_proof_image} target="_blank" className="text-xs font-black text-[#ba001c] uppercase">View</a>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-black text-slate-800">{isEditing ? "Edit Rider" : "Add Rider"}</h2>
              <button onClick={() => { setShowAddModal(false); setIsEditing(false); }} className="text-slate-400 hover:text-slate-600 p-2"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={addRider} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Full Name</label><input type="text" required value={newRider.full_name} onChange={e => setNewRider({ ...newRider, full_name: e.target.value })} className="w-full p-4 rounded-xl border border-slate-200 font-bold" placeholder="Name" /></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email</label><input type="email" required value={newRider.email} onChange={e => setNewRider({ ...newRider, email: e.target.value })} className="w-full p-4 rounded-xl border border-slate-200 font-bold" placeholder="Email" /></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Phone</label><input type="tel" required value={newRider.phone} onChange={e => setNewRider({ ...newRider, phone: e.target.value })} className="w-full p-4 rounded-xl border border-slate-200 font-bold" placeholder="+91XXXXXXXXXX" /></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Profile Photo</label><input type="file" accept="image/*" onChange={e => setNewRider({ ...newRider, profile_photo: e.target.files?.[0] || null })} className="w-full p-4 rounded-xl border border-slate-200" /></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">ID Proof</label><select value={newRider.id_proof_type} onChange={e => setNewRider({ ...newRider, id_proof_type: e.target.value, id_proof_image: null })} className="w-full p-4 rounded-xl border border-slate-200 font-bold" required><option value="">Select</option><option value="aadhar">Aadhar</option><option value="dl">DL</option><option value="voter">Voter</option><option value="pan">Pan</option></select></div>
              {newRider.id_proof_type && <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Upload {newRider.id_proof_type}</label><input type="file" accept="image/*" onChange={e => setNewRider({ ...newRider, id_proof_image: e.target.files?.[0] || null })} className="w-full p-4 rounded-xl border border-slate-200" required /></div>}
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Vehicle</label><select value={newRider.vehicle_type} onChange={e => setNewRider({ ...newRider, vehicle_type: e.target.value, vehicle_number: "" })} className="w-full p-4 rounded-xl border border-slate-200 font-bold"><option value="motorcycle">Motorcycle</option><option value="scooty">Scooty</option><option value="bicycle">Bicycle</option></select></div>
              {(newRider.vehicle_type === "motorcycle" || newRider.vehicle_type === "scooty") && <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Vehicle Number</label><input type="text" value={newRider.vehicle_number} onChange={e => setNewRider({ ...newRider, vehicle_number: e.target.value })} className="w-full p-4 rounded-xl border border-slate-200 font-bold" placeholder="Number" /></div>}
              <button type="submit" disabled={saving} className="w-full bg-[#ba001c] text-white px-6 py-4 rounded-xl font-bold hover:bg-[#a00019] disabled:opacity-50">
                {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Rider"}
              </button>
              {isEditing && (
                <button type="button" onClick={() => { if (confirm("Delete?")) deleteRider(selectedRider?.id!); }} className="w-full py-4 rounded-xl font-black text-xs uppercase text-red-600 bg-red-50 hover:bg-red-100 transition-all mt-2">
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
  const supabase = createClient();
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

  if (loading) return <div className="py-8 text-center text-slate-400">Loading orders...</div>;

  if (orders.length === 0) return (
    <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
      <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">delivery_dining</span>
      <p className="text-sm font-bold text-slate-400">No deliveries yet</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {orders.map(order => (
        <div key={order.id} className="bg-white border border-slate-100 rounded-xl p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-bold text-slate-500">#{order.id.slice(0, 8)}</p>
              <p className="text-xs text-slate-400">{order.placed_at ? new Date(order.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}</p>
            </div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${order.status === "delivered" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
              {order.status?.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold">₹{order.total_amount}</p>
              <p className="text-[10px] text-slate-400">Order Value</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-600">₹{order.delivery_fee || 0}</p>
              <p className="text-[10px] text-slate-400">Rider Earned</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}