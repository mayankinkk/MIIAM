"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Vehicle {
  id: string;
  name: string;
  type: "bike" | "scooter" | "car";
  model: string;
  number: string;
  insuranceExpiry: string;
  licenseExpiry: string;
  isDefault: boolean;
}

interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  cost: number;
  odometer: number;
}

interface FuelEntry {
  id: string;
  date: string;
  liters: number;
  cost: number;
  odometer: number;
}

export default function RiderVehiclePage() {
  const supabase = createClient();
  const [riderId, setRiderId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [fuelLog, setFuelLog] = useState<FuelEntry[]>([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showServiceAlert, setShowServiceAlert] = useState(false);
  const [activeTab, setActiveTab] = useState<"vehicles" | "maintenance" | "fuel">("vehicles");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasInitialData, setHasInitialData] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: riderData } = await supabase.from("riders").select("id").eq("user_id", user.id).single();
      if (!riderData) { setLoading(false); return; }
      setRiderId(riderData.id);

      // Load vehicles
      const { data: vdata } = await supabase.from("rider_vehicles").select("*").eq("rider_id", riderData.id);
      if (vdata && vdata.length > 0) {
        const mapped: Vehicle[] = vdata.map(v => ({
          id: v.id,
          name: v.name,
          type: v.type as Vehicle["type"],
          model: v.model || "",
          number: v.number || "",
          insuranceExpiry: v.insurance_expiry || "",
          licenseExpiry: v.license_expiry || "",
          isDefault: v.is_default || false,
        }));
        setVehicles(mapped);
        if (!selectedVehicle) setSelectedVehicle(mapped[0]);
      }

      // Load maintenance records for first vehicle
      if (vdata && vdata[0]) {
        const { data: mdata } = await supabase.from("rider_vehicle_maintenance").select("*").eq("vehicle_id", vdata[0].id).order("date", { ascending: false });
        if (mdata) setMaintenanceRecords(mdata.map(m => ({ ...m, cost: Number(m.cost), date: m.date })));

        const { data: fdata } = await supabase.from("rider_vehicle_fuel").select("*").eq("vehicle_id", vdata[0].id).order("date", { ascending: false });
        if (fdata) setFuelLog(fdata.map(f => ({ ...f, cost: Number(f.cost), liters: Number(f.liters) })));
      }

      setHasInitialData(true);
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const now = useMemo(() => Date.now(), []);
  const daysUntilInsurance = selectedVehicle && selectedVehicle.insuranceExpiry
    ? Math.ceil((new Date(selectedVehicle.insuranceExpiry).getTime() - now) / (1000 * 60 * 60 * 24))
    : 365;
  const daysUntilLicense = selectedVehicle && selectedVehicle.licenseExpiry
    ? Math.ceil((new Date(selectedVehicle.licenseExpiry).getTime() - now) / (1000 * 60 * 60 * 24))
    : 365;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0b50d5] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500 font-medium">Loading vehicle info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-gradient-to-br from-slate-700 to-slate-900 text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">MIIAM</Link>
          <button onClick={() => setShowAddVehicle(true)} className="bg-white/20 p-2 rounded-lg">
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold mt-4">🚗 My Vehicle</h1>
        <p className="text-sm opacity-70">Manage your rides</p>
      </header>

      <main className="px-6 -mt-4 space-y-6 pb-32">
        {/* Alerts */}
        {daysUntilInsurance < 30 && (
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-red-700">Insurance Expiring Soon</p>
              <p className="text-xs text-red-500">Renew within {daysUntilInsurance} days</p>
            </div>
          </div>
        )}
        {daysUntilLicense < 60 && (
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-bold text-amber-700">License Renewal Reminder</p>
              <p className="text-xs text-amber-500">Valid until {daysUntilLicense} days</p>
            </div>
          </div>
        )}

        {/* Current Vehicle */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#4d212a]">Current Vehicle</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
          </div>
          
          {selectedVehicle ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl">
                  🛵
                </div>
                <div>
                  <h4 className="font-bold text-lg">{selectedVehicle.name}</h4>
                  <p className="text-sm text-slate-500">{selectedVehicle.model} • {selectedVehicle.number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400">Insurance Valid</p>
                  <p className={`font-bold ${daysUntilInsurance < 30 ? "text-red-500" : "text-green-600"}`}>
                    {daysUntilInsurance} days
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400">License Valid</p>
                  <p className={`font-bold ${daysUntilLicense < 60 ? "text-amber-500" : "text-green-600"}`}>
                    {daysUntilLicense} days
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <span className="material-symbols-outlined text-4xl">two_wheeler</span>
              <p className="mt-2 font-medium">No vehicle added yet</p>
              <p className="text-xs mt-1">Click + to add your vehicle</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl p-1 flex">
          {(["vehicles", "maintenance", "fuel"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === tab ? "bg-[#0b50d5] text-white" : "text-slate-500"
              }`}
            >
              {tab === "vehicles" ? "Vehicles" : tab === "maintenance" ? "Service" : "Fuel"}
            </button>
          ))}
        </div>

        {activeTab === "vehicles" && (
          <>
            {vehicles.map((vehicle) => (
              <div 
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle)}
                className={`bg-white rounded-2xl p-4 shadow-sm border-2 cursor-pointer transition-all ${
                  vehicle.isDefault ? "border-[#0b50d5]" : "border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">
                      {vehicle.type === "car" ? "🚗" : vehicle.type === "bike" ? "🏍️" : "🛵"}
                    </div>
                    <div>
                      <p className="font-bold text-[#4d212a]">{vehicle.name}</p>
                      <p className="text-xs text-slate-400">{vehicle.number}</p>
                    </div>
                  </div>
                  {vehicle.isDefault && (
                    <span className="text-xs bg-[#0b50d5] text-white px-2 py-1 rounded-full">Default</span>
                  )}
                </div>
              </div>
            ))}

            <button 
              onClick={() => setShowAddVehicle(true)}
              className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Add New Vehicle
            </button>
          </>
        )}

        {activeTab === "maintenance" && (
          <>
            {maintenanceRecords.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#4d212a]">Service History</h3>
                </div>
                <div className="space-y-3">
                  {maintenanceRecords.map((record, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border-b border-slate-100">
                      <div>
                        <p className="font-bold text-sm">{record.type}</p>
                        <p className="text-xs text-slate-400">{record.date} • {record.odometer} km</p>
                      </div>
                      <p className="font-bold">₹{record.cost}</p>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-slate-400 mt-4">Total: ₹{maintenanceRecords.reduce((s, r) => s + r.cost, 0)}</p>
              </div>
            )}
            {maintenanceRecords.length === 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm text-center py-8 text-slate-400">
                <span className="material-symbols-outlined text-4xl">build</span>
                <p className="mt-2 font-medium">No service records yet</p>
              </div>
            )}
          </>
        )}

        {activeTab === "fuel" && (
          <>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-green-600">Total Spent</p>
                  <p className="text-2xl font-black text-green-700">₹{fuelLog.reduce((s, f) => s + f.cost, 0)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-green-600">Liters Used</p>
                  <p className="text-2xl font-black text-green-700">{fuelLog.reduce((s, f) => s + f.liters, 0).toFixed(1)}L</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-[#4d212a] mb-4">Fuel Log</h3>
              <div className="space-y-3">
                {fuelLog.map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-bold text-sm">{log.liters}L filled</p>
                      <p className="text-xs text-slate-400">{log.date} • {log.odometer} km</p>
                    </div>
                    <p className="font-bold text-green-600">₹{log.cost}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Fuel entry feature coming soon", "info"))}
              className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">local_gas_station</span>
              Add Fuel Entry
            </button>
          </>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Insurance details coming soon", "info"))}
            className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-blue-600">policy</span>
            <span className="font-bold text-sm">Insurance</span>
          </button>
          <button
            onClick={() => import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Service center locator coming soon", "info"))}
            className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-amber-600">build</span>
            <span className="font-bold text-sm">Service Center</span>
          </button>
        </div>
      </main>

      {/* Add Vehicle Modal - saves to DB */}
      {showAddVehicle && (
        <AddVehicleModal 
          riderId={riderId}
          onClose={() => setShowAddVehicle(false)}
          onSaved={async () => {
            setShowAddVehicle(false);
            // Reload vehicles
            if (riderId) {
              const { data: vdata } = await supabase.from("rider_vehicles").select("*").eq("rider_id", riderId);
              if (vdata) {
                const mapped: Vehicle[] = vdata.map(v => ({
                  id: v.id,
                  name: v.name,
                  type: v.type as Vehicle["type"],
                  model: v.model || "",
                  number: v.number || "",
                  insuranceExpiry: v.insurance_expiry || "",
                  licenseExpiry: v.license_expiry || "",
                  isDefault: v.is_default || false,
                }));
                setVehicles(mapped);
                if (!selectedVehicle) setSelectedVehicle(mapped[0]);
              }
            }
          }}
        />
      )}
    </div>
  );
}

function AddVehicleModal({ riderId, onClose, onSaved }: { riderId: string | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [type, setType] = useState<"scooter" | "bike" | "car">("scooter");
  const [model, setModel] = useState("");
  const [number, setNumber] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !riderId) return;
    setSaving(true);
    try {
      await supabase.from("rider_vehicles").insert({
        rider_id: riderId,
        name: name.trim(),
        type,
        model: model.trim(),
        number: number.trim(),
        insurance_expiry: insuranceExpiry || null,
        license_expiry: licenseExpiry || null,
        is_default: false,
      });
      await onSaved();
    } catch (e) {
      console.error("Failed to save vehicle:", e);
      alert("Failed to save vehicle");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-xl mb-4">Add New Vehicle</h3>
        <div className="space-y-3">
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full p-3 border-2 border-slate-200 rounded-xl">
            <option value="scooter">Scooter</option>
            <option value="bike">Bike</option>
            <option value="car">Car</option>
          </select>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vehicle Name (e.g., Honda Activa)" className="w-full p-3 border-2 border-slate-200 rounded-xl" />
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model (e.g., Activa 5G)" className="w-full p-3 border-2 border-slate-200 rounded-xl" />
          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Vehicle Number (e.g., DL 01 AB 1234)" className="w-full p-3 border-2 border-slate-200 rounded-xl" />
          <input type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} placeholder="Insurance Expiry" className="w-full p-3 border-2 border-slate-200 rounded-xl" />
          <input type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} placeholder="License Expiry" className="w-full p-3 border-2 border-slate-200 rounded-xl" />
        </div>
        <button onClick={handleSave} disabled={saving || !name.trim()} className="w-full py-4 bg-[#0b50d5] text-white font-bold rounded-xl mt-4 disabled:opacity-50">
          {saving ? "Saving..." : "Add Vehicle"}
        </button>
        <button onClick={onClose} className="w-full py-3 text-slate-500 font-bold mt-2">Cancel</button>
      </div>
    </div>
  );
}