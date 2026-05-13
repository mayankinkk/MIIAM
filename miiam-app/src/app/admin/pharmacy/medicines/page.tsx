"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

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

export default function PharmacyMedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, lowStock: 0, outOfStock: 0, prescription: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [saving, setSaving] = useState(false);

  const [newMedicine, setNewMedicine] = useState({
    name: "",
    category: "Pain Relief",
    price: "",
    stock: "",
    image_url: "",
    requires_prescription: false,
  });

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

      const lowStock = data?.filter((m: Medicine) => m.stock > 0 && m.stock < 10).length || 0;
      const outOfStock = data?.filter((m: Medicine) => m.stock === 0).length || 0;
      const prescription = data?.filter((m: Medicine) => m.requires_prescription).length || 0;

      setStats({
        total: data?.length || 0,
        lowStock,
        outOfStock,
        prescription,
      });
    } catch (error) {
      console.error("Error loading medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (medicineId: string, newStock: number) => {
    try {
      const { error } = await supabase
        .from("pharmacy_medicines")
        .update({ stock: newStock })
        .eq("id", medicineId);

      if (error) throw error;
      loadMedicines();
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const handleSave = async () => {
    if (!newMedicine.name || !newMedicine.price) {
      alert("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      if (editingMedicine) {
        const { error } = await supabase
          .from("pharmacy_medicines")
          .update({
            name: newMedicine.name,
            category: newMedicine.category,
            price: parseFloat(newMedicine.price),
            stock: parseInt(newMedicine.stock) || 0,
            image_url: newMedicine.image_url,
            requires_prescription: newMedicine.requires_prescription,
          })
          .eq("id", editingMedicine.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("pharmacy_medicines").insert({
          name: newMedicine.name,
          category: newMedicine.category,
          price: parseFloat(newMedicine.price),
          stock: parseInt(newMedicine.stock) || 100,
          image_url: newMedicine.image_url,
          requires_prescription: newMedicine.requires_prescription,
        });

        if (error) throw error;
      }

      resetModal();
      loadMedicines();
      alert(editingMedicine ? "Medicine updated!" : "Medicine added!");
    } catch (error: any) {
      console.error("Error saving:", error);
      alert("Failed: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this medicine?")) return;

    try {
      const { error } = await supabase.from("pharmacy_medicines").delete().eq("id", id);
      if (error) throw error;
      setMedicines(medicines.filter(m => m.id !== id));
      alert("Medicine deleted!");
    } catch (error: any) {
      console.error("Error deleting:", error);
      alert("Failed: " + error.message);
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
      requires_prescription: medicine.requires_prescription,
    });
    setShowAddModal(true);
  };

  const resetModal = () => {
    setShowAddModal(false);
    setEditingMedicine(null);
    setNewMedicine({ name: "", category: "Pain Relief", price: "", stock: "", image_url: "", requires_prescription: false });
  };

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = searchTerm === "" || medicine.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || medicine.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/pharmacy" className="text-slate-400 hover:text-slate-600">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-800">Pharmacy Medicines</h1>
          <p className="text-slate-500 text-sm">Manage medicine inventory and stock</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-[#ba001c] text-white rounded-lg font-bold text-sm hover:bg-[#a00018]">
          + Add Medicine
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-xs font-bold">TOTAL MEDICINES</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <p className="text-yellow-600 text-xs font-bold">LOW STOCK</p>
          <p className="text-2xl font-black text-yellow-700 mt-1">{stats.lowStock}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
          <p className="text-red-600 text-xs font-bold">OUT OF STOCK</p>
          <p className="text-2xl font-black text-red-700 mt-1">{stats.outOfStock}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <p className="text-blue-600 text-xs font-bold">PRESCRIPTION</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{stats.prescription}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by medicine name..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#ba001c]"
        >
          <option value="all">All Categories</option>
          {mockCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading medicines...</div>
      ) : filteredMedicines.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl">
          <span className="material-symbols-outlined text-5xl text-slate-300">medication</span>
          <p className="mt-4 font-bold">No medicines found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedicines.map((medicine) => (
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
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Rx
                  </div>
                )}
                {medicine.stock === 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Out of Stock
                  </div>
                )}
                {medicine.stock > 0 && medicine.stock < 10 && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Low Stock
                  </div>
                )}
              </div>
              <div className="p-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{medicine.category}</span>
                <p className="font-bold text-slate-800 mt-2">{medicine.name}</p>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-xl font-black text-slate-800">₹{medicine.price}</p>
                  <span className={`text-xs ${medicine.stock === 0 ? "text-red-600 font-bold" : medicine.stock < 10 ? "text-yellow-600 font-bold" : "text-slate-400"}`}>
                    Stock: {medicine.stock}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => updateStock(medicine.id, Math.max(0, medicine.stock - 1))} className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200">-</button>
                  <span className="flex-1 text-center font-bold text-slate-800">{medicine.stock}</span>
                  <button onClick={() => updateStock(medicine.id, medicine.stock + 1)} className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200">+</button>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEditModal(medicine)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-200">Edit</button>
                  <button onClick={() => handleDelete(medicine.id)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs hover:bg-red-100">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">{editingMedicine ? "Edit Medicine" : "Add Medicine"}</h2>
                <button onClick={resetModal} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined text-3xl">close</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Medicine Name *</label>
                <input type="text" value={newMedicine.name} onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="Enter medicine name" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Category *</label>
                <select value={newMedicine.category} onChange={(e) => setNewMedicine({ ...newMedicine, category: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none">
                  {mockCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Price (₹) *</label>
                  <input type="number" value={newMedicine.price} onChange={(e) => setNewMedicine({ ...newMedicine, price: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Stock</label>
                  <input type="number" value={newMedicine.stock} onChange={(e) => setNewMedicine({ ...newMedicine, stock: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="100" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Image URL</label>
                <input type="text" value={newMedicine.image_url} onChange={(e) => setNewMedicine({ ...newMedicine, image_url: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:border-[#ba001c] focus:outline-none" placeholder="https://..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="prescription" checked={newMedicine.requires_prescription} onChange={(e) => setNewMedicine({ ...newMedicine, requires_prescription: e.target.checked })} className="w-4 h-4" />
                <label htmlFor="prescription" className="text-sm text-slate-600">Requires Prescription</label>
              </div>
            </div>
            <div className="p-6 border-t flex gap-4">
              <button onClick={resetModal} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-[#ba001c] text-white rounded-xl font-bold text-sm hover:bg-[#a00018] disabled:opacity-50">
                {saving ? "Saving..." : editingMedicine ? "Update" : "Add Medicine"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}