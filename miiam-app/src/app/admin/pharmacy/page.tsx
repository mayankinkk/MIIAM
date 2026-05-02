"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const supabase = createClient();

const mockOrders = [
  { id: "MED001", customer: "Rahul S.", items: "Dolo 650, Crosin, Vitamins", total: 185, status: "delivered", date: "Today, 9:00 AM", prescription: false },
  { id: "MED002", customer: "Priya K.", items: "Diabetes medicines (Rx)", total: 890, status: "preparing", date: "Today, 10:45 AM", prescription: true },
  { id: "MED003", customer: "Vikram M.", items: "Pain relief, muscle relaxant", total: 145, status: "delivered", date: "Yesterday", prescription: false },
  { id: "MED004", customer: "Anita R.", items: "Baby care medicines", total: 320, status: "shipped", date: "Yesterday", prescription: false },
  { id: "MED005", customer: "Suresh P.", items: "Chronic medicines (Rx)", total: 1250, status: "delivered", date: "2 days ago", prescription: true },
];

const mockPrescriptions = [
  { id: "RX001", customer: "Priya K.", medicines: "Metformin, Glipizide", submittedAt: "Today, 10:00 AM", status: "pending" },
  { id: "RX002", customer: "Suresh P.", medicines: "Telmisartan, Amlodipine", submittedAt: "Yesterday", status: "approved" },
  { id: "RX003", customer: "Anita R.", medicines: "Cetrizine", submittedAt: "Yesterday", status: "approved" },
];

const mockPartners = [
  { id: "PH001", name: "Health Plus Pharmacy", orders: 156, rating: 4.7, status: "active" },
  { id: "PH002", name: "MediCare Store", orders: 98, rating: 4.5, status: "active" },
  { id: "PH003", name: "Apollo Pharmacy", orders: 245, rating: 4.8, status: "active" },
];

const mockCategories = ["Pain Relief", "Antibiotics", "Vitamins", "Diabetes", "Blood Pressure", "Heart Care", "Cold & Flu", "Skin Care", "Baby Care"];

interface Medicine {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
  requires_prescription: boolean;
}

const statusColors: Record<string, string> = {
  delivered: "bg-green-100 text-green-700",
  preparing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

const rxStatusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function PharmacyAdmin() {
  const [activeTab, setActiveTab] = useState("orders");

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: "",
    category: "Pain Relief",
    price: "",
    stock: "",
    image_url: "",
    imageFile: null as File | null,
    requires_prescription: false,
  });

  const tabs = [
    { id: "orders", label: "Orders" },
    { id: "prescriptions", label: "Prescriptions" },
    { id: "medicines", label: "Medicines" },
    { id: "partners", label: "Partners" },
    { id: "analytics", label: "Analytics" },
  ];

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pharmacy_medicines")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMedicines(data || []);
    } catch (error) {
      console.error("Error loading medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `pharmacy-products/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from("pharmacy-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from("pharmacy-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setNewMedicine({ ...newMedicine, image_url: url, imageFile: file });
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.name || !newMedicine.price || !newMedicine.category) {
      alert("Please fill in all required fields");
      return;
    }

    setUploading(true);
    try {
      let imageUrl = newMedicine.image_url;
      
      if (newMedicine.imageFile) {
        const uploaded = await handleImageUpload(newMedicine.imageFile);
        if (uploaded) imageUrl = uploaded;
      }

      const { data, error } = await supabase.from("pharmacy_medicines").insert({
        name: newMedicine.name,
        category: newMedicine.category,
        price: parseFloat(newMedicine.price),
        stock: parseInt(newMedicine.stock) || 0,
        image_url: imageUrl,
        requires_prescription: newMedicine.requires_prescription,
        is_active: true,
      }).select().single();

      if (error) throw error;

      if (data) {
        setMedicines([data, ...medicines]);
      }
      
      setNewMedicine({ name: "", category: "Pain Relief", price: "", stock: "", image_url: "", imageFile: null, requires_prescription: false });
      setShowAddModal(false);
      alert("Medicine added successfully!");
    } catch (error: any) {
      console.error("Error adding medicine:", error);
      alert(`Failed to add medicine: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!newMedicine.name || !newMedicine.price || !newMedicine.category) {
      alert("Please fill in all required fields");
      return;
    }

    setUploading(true);
    try {
      let imageUrl = newMedicine.image_url;
      
      if (newMedicine.imageFile) {
        const uploaded = await handleImageUpload(newMedicine.imageFile);
        if (uploaded) imageUrl = uploaded;
      }

      const { data, error } = await supabase
        .from("pharmacy_medicines")
        .update({
          name: newMedicine.name,
          category: newMedicine.category,
          price: parseFloat(newMedicine.price),
          stock: parseInt(newMedicine.stock) || 0,
          image_url: imageUrl,
          requires_prescription: newMedicine.requires_prescription,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingMedicine!.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMedicines(medicines.map(m => m.id === editingMedicine!.id ? data : m));
      }
      
      resetModal();
      alert("Medicine updated successfully!");
    } catch (error: any) {
      console.error("Error updating medicine:", error);
      alert(`Failed to update medicine: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (!confirm("Delete this medicine?")) return;
    
    try {
      const { error } = await supabase.from("pharmacy_medicines").delete().eq("id", id);
      if (error) throw error;
      
      setMedicines(medicines.filter(m => m.id !== id));
      alert("Medicine deleted!");
    } catch (error: any) {
      console.error("Error deleting medicine:", error);
      alert(`Failed to delete: ${error.message}`);
    }
  };

  const openEditModal = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setNewMedicine({
      name: medicine.name,
      category: medicine.category,
      price: medicine.price.toString(),
      stock: medicine.stock.toString(),
      image_url: medicine.image_url,
      imageFile: null,
      requires_prescription: medicine.requires_prescription,
    });
    setShowAddModal(true);
  };

  const resetModal = () => {
    setShowAddModal(false);
    setEditingMedicine(null);
    setNewMedicine({ name: "", category: "Pain Relief", price: "", stock: "", image_url: "", imageFile: null, requires_prescription: false });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Total Orders</p>
            <p className="text-3xl font-black text-slate-800 mt-1">856</p>
            <p className="text-green-600 text-sm mt-2">↑ 15% from last week</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Prescription Orders</p>
            <p className="text-3xl font-black text-slate-800 mt-1">124</p>
            <p className="text-green-600 text-sm mt-2">↑ 8% from last week</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Revenue</p>
            <p className="text-3xl font-black text-slate-800 mt-1">₹2.8L</p>
            <p className="text-green-600 text-sm mt-2">↑ 18% from last week</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-400 text-sm">Partner Pharmacies</p>
            <p className="text-3xl font-black text-slate-800 mt-1">32</p>
            <p className="text-green-600 text-sm mt-2">↑ 2 new this month</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-lg font-bold text-sm ${
                activeTab === tab.id
                  ? "bg-[#ba001c] text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Order ID</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Customer</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Items</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Total</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Rx</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Status</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Date</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockOrders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{order.id}</td>
                    <td className="p-4 text-slate-600">{order.customer}</td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">{order.items}</td>
                    <td className="p-4 font-bold text-slate-800">₹{order.total}</td>
                    <td className="p-4">
                      {order.prescription ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">Rx Required</span>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">{order.date}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => alert(`Viewing order ${order.id}`)}
                        className="text-[#ba001c] font-bold text-sm hover:underline cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "prescriptions" && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Rx ID</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Customer</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Medicines</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Submitted</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Status</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockPrescriptions.map((rx) => (
                  <tr key={rx.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{rx.id}</td>
                    <td className="p-4 text-slate-600">{rx.customer}</td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">{rx.medicines}</td>
                    <td className="p-4 text-slate-500 text-sm">{rx.submittedAt}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${rxStatusColors[rx.status]}`}>
                        {rx.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => alert(`Reviewing prescription ${rx.id}`)}
                        className="text-[#ba001c] font-bold text-sm hover:underline cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "medicines" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-[#ba001c] text-white rounded-lg font-bold text-sm hover:bg-[#a00018]"
              >
                + Add Medicine
              </button>
            </div>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading medicines...</div>
            ) : medicines.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No medicines yet. Add your first medicine!</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {medicines.map((medicine) => (
                  <div key={medicine.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-40 bg-slate-100 relative">
                      {medicine.image_url ? (
                        <Image src={medicine.image_url} alt={medicine.name} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="material-symbols-outlined text-4xl text-slate-300">medication</span>
                        </div>
                      )}
                      {medicine.requires_prescription && (
                        <span className="absolute top-2 right-2 px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded">Rx</span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-bold text-[#ba001c] uppercase">{medicine.category}</p>
                      <p className="font-bold text-slate-800 mt-1">{medicine.name}</p>
                      <div className="flex justify-between items-center mt-3">
                        <p className="text-xl font-black text-slate-800">₹{medicine.price}</p>
                        <span className="text-xs text-slate-400">Stock: {medicine.stock}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => openEditModal(medicine)}
                          className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMedicine(medicine.id)}
                          className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "partners" && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Partner ID</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Name</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Orders</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Rating</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Status</th>
                  <th className="text-left p-4 font-bold text-slate-600 text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockPartners.map((partner) => (
                  <tr key={partner.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{partner.id}</td>
                    <td className="p-4 text-slate-600">{partner.name}</td>
                    <td className="p-4 text-slate-800 font-bold">{partner.orders}</td>
                    <td className="p-4 text-slate-600">{partner.rating}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        {partner.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => alert(`Viewing partner ${partner.id}`)}
                        className="text-[#ba001c] font-bold text-sm hover:underline cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300">analytics</span>
            <p className="text-slate-500 mt-4">Analytics coming soon</p>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">{editingMedicine ? "Edit Medicine" : "Add New Medicine"}</h3>
                <button onClick={resetModal} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Medicine Image</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-[#ba001c] transition-colors">
                    {newMedicine.image_url ? (
                      <div className="relative h-32 w-full">
                        <Image src={newMedicine.image_url} alt="Preview" fill className="object-contain" />
                        <button
                          type="button"
                          onClick={() => setNewMedicine({ ...newMedicine, image_url: "", imageFile: null })}
                          className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <span className="material-symbols-outlined text-3xl text-slate-300">add_photo_alternate</span>
                        <p className="text-xs text-slate-400 mt-1">Click to upload image</p>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    value={newMedicine.name}
                    onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                    placeholder="e.g., Dolo 650"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Category *</label>
                  <select
                    value={newMedicine.category}
                    onChange={(e) => setNewMedicine({ ...newMedicine, category: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
                  >
                    {mockCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      value={newMedicine.price}
                      onChange={(e) => setNewMedicine({ ...newMedicine, price: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">Stock</label>
                    <input
                      type="number"
                      value={newMedicine.stock}
                      onChange={(e) => setNewMedicine({ ...newMedicine, stock: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requires_prescription"
                    checked={newMedicine.requires_prescription}
                    onChange={(e) => setNewMedicine({ ...newMedicine, requires_prescription: e.target.checked })}
                    className="w-4 h-4 text-[#ba001c]"
                  />
                  <label htmlFor="requires_prescription" className="text-sm text-slate-600">Requires Prescription</label>
                </div>
                <button
                  type="button"
                  onClick={() => editingMedicine ? handleSaveEdit() : handleAddMedicine()}
                  disabled={uploading}
                  className="w-full py-3 bg-[#ba001c] text-white rounded-xl font-bold hover:bg-[#a00018] disabled:opacity-50"
                >
                  {uploading ? "Saving..." : editingMedicine ? "Save Changes" : "Add Medicine"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}