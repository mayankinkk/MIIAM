"use client";

import { useState } from "react";
import Link from "next/link";

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

const vehicles: Vehicle[] = [
  { id: "1", name: "Honda Activa", type: "scooter", model: "Activa 5G", number: "DL 01 AB 1234", insuranceExpiry: "2024-06-15", licenseExpiry: "2026-03-20", isDefault: true },
  { id: "2", name: "TVS Jupiter", type: "scooter", model: "Jupiter ZX", number: "DL 01 CD 5678", insuranceExpiry: "2024-08-20", licenseExpiry: "2025-11-15", isDefault: false },
];

const maintenanceRecords = [
  { date: "2024-01-10", type: "Oil Change", cost: 350, odometer: 4500 },
  { date: "2024-01-25", type: "Tire Pressure", cost: 100, odometer: 4600 },
  { date: "2024-02-05", type: "Brake Service", cost: 400, odometer: 4800 },
];

const fuelLog = [
  { date: "2024-02-10", liters: 3.5, cost: 280, odometer: 5200 },
  { date: "2024-02-15", liters: 3.2, cost: 256, odometer: 5350 },
  { date: "2024-02-20", liters: 4.0, cost: 320, odometer: 5500 },
];

export default function RiderVehiclePage() {
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showServiceAlert, setShowServiceAlert] = useState(false);
  const [activeTab, setActiveTab] = useState<"vehicles" | "maintenance" | "fuel">("vehicles");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(vehicles[0]);

  const daysUntilInsurance = Math.ceil((new Date(selectedVehicle.insuranceExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const daysUntilLicense = Math.ceil((new Date(selectedVehicle.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

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
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#4d212a]">Upcoming Service</h3>
                <button onClick={() => setShowServiceAlert(true)} className="text-xs text-[#0b50d5] font-bold">
                  Book Now
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { service: "General Service", due: "5000 km", status: "Due Soon" },
                  { service: "Oil Change", due: "5500 km", status: "Recommended" },
                  { service: "Tire Rotation", due: "6000 km", status: "OK" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-bold text-sm">{item.service}</p>
                      <p className="text-xs text-slate-400">Due at {item.due}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      item.status === "Due Soon" ? "bg-red-100 text-red-600" :
                      item.status === "Recommended" ? "bg-amber-100 text-amber-600" :
                      "bg-green-100 text-green-600"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-[#4d212a] mb-4">Service History</h3>
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
              <p className="text-center text-xs text-slate-400 mt-4">Total: ₹850</p>
            </div>
          </>
        )}

        {activeTab === "fuel" && (
          <>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-green-600">Total Spent</p>
                  <p className="text-2xl font-black text-green-700">₹856</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-green-600">Liters Used</p>
                  <p className="text-2xl font-black text-green-700">10.7L</p>
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

            <button className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">local_gas_station</span>
              Add Fuel Entry
            </button>
          </>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-600">policy</span>
            <span className="font-bold text-sm">Insurance</span>
          </button>
          <button className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600">build</span>
            <span className="font-bold text-sm">Service Center</span>
          </button>
        </div>
      </main>

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-xl mb-4">Add New Vehicle</h3>
            <div className="space-y-3">
              <select className="w-full p-3 border-2 border-slate-200 rounded-xl">
                <option>Select Vehicle Type</option>
                <option>Scooter</option>
                <option>Bike</option>
                <option>Car</option>
              </select>
              <input placeholder="Vehicle Name (e.g., Honda Activa)" className="w-full p-3 border-2 border-slate-200 rounded-xl" />
              <input placeholder="Model (e.g., Activa 5G)" className="w-full p-3 border-2 border-slate-200 rounded-xl" />
              <input placeholder="Vehicle Number (e.g., DL 01 AB 1234)" className="w-full p-3 border-2 border-slate-200 rounded-xl" />
              <input type="date" placeholder="Insurance Expiry" className="w-full p-3 border-2 border-slate-200 rounded-xl" />
              <input type="date" placeholder="License Expiry" className="w-full p-3 border-2 border-slate-200 rounded-xl" />
            </div>
            <button 
              onClick={() => { alert("Vehicle added successfully!"); setShowAddVehicle(false); }}
              className="w-full py-4 bg-[#0b50d5] text-white font-bold rounded-xl mt-4"
            >
              Add Vehicle
            </button>
            <button onClick={() => setShowAddVehicle(false)} className="w-full py-3 text-slate-500 font-bold mt-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      <RiderNavBar active="account" />
    </div>
  );
}

function RiderNavBar({ active }: { active: string }) {
  const navItems = [
    { name: "Map", href: "/rider/dashboard", icon: "map" },
    { name: "Orders", href: "/rider/orders", icon: "list_alt" },
    { name: "Wallet", href: "/rider/wallet", icon: "account_balance_wallet" },
    { name: "Account", href: "/rider/account", icon: "person" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-4 bg-white/90 backdrop-blur-xl shadow-[0px_-10px_30px_rgba(11,80,213,0.1)] rounded-t-[3rem]">
      {navItems.map(item => (
        <Link
          key={item.name}
          href={item.href}
          className={`flex flex-col items-center p-2 ${
            active === item.name.toLowerCase() ? "text-[#0b50d5]" : "text-[#814c55]"
          }`}
        >
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: active === item.name.toLowerCase() ? "'FILL' 1" : "'FILL' 0" }}>
            {item.icon}
          </span>
          <span className="text-[10px] font-bold">{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}