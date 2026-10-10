"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import logger from "@/lib/logger";

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
  const supabase = useMemo(() => createClient(), []);
  const { t } = useTranslation();
  const [riderId, setRiderId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [fuelLog, setFuelLog] = useState<FuelEntry[]>([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showServiceAlert, setShowServiceAlert] = useState(false);
  const [showAddFuelModal, setShowAddFuelModal] = useState(false);
  const [fuelForm, setFuelForm] = useState({
    liters: "",
    cost: "",
    odometer: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [activeTab, setActiveTab] = useState<"vehicles" | "maintenance" | "fuel">("vehicles");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasInitialData, setHasInitialData] = useState(false);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: riderData } = await supabase
        .from("riders")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!riderData) {
        setLoading(false);
        return;
      }
      setRiderId(riderData.id);

      // Load vehicles
      const { data: vdata } = await supabase
        .from("rider_vehicles")
        .select("*")
        .eq("rider_id", riderData.id);
      if (vdata && vdata.length > 0) {
        const mapped: Vehicle[] = vdata.map(
          (v: {
            id: string;
            name: string;
            type: string;
            model: string | null;
            number: string | null;
            insurance_expiry: string | null;
            license_expiry: string | null;
            is_default: boolean | null;
          }) => ({
            model: v.model || "",
            number: v.number || "",
            insuranceExpiry: v.insurance_expiry || "",
            licenseExpiry: v.license_expiry || "",
            isDefault: v.is_default || false,
          })
        );
        setVehicles(mapped);
        if (!selectedVehicle) setSelectedVehicle(mapped[0]);
      }

      // Load maintenance records for first vehicle
      if (vdata && vdata[0]) {
        const { data: mdata } = await supabase
          .from("rider_vehicle_maintenance")
          .select("*")
          .eq("vehicle_id", vdata[0].id)
          .order("date", { ascending: false });
        if (mdata)
          setMaintenanceRecords(
            mdata.map(
              (m: {
                id: string;
                vehicle_id: string;
                cost: number | string;
                date: string;
                [key: string]: unknown;
              }) => ({ ...m, cost: Number(m.cost), date: m.date })
            )
          );

        const { data: fdata } = await supabase
          .from("rider_vehicle_fuel")
          .select("*")
          .eq("vehicle_id", vdata[0].id)
          .order("date", { ascending: false });
        if (fdata)
          setFuelLog(
            fdata.map(
              (f: {
                id: string;
                vehicle_id: string;
                cost: number | string;
                liters: number | string;
                date: string;
                [key: string]: unknown;
              }) => ({ ...f, cost: Number(f.cost), liters: Number(f.liters) })
            )
          );
      }

      setHasInitialData(true);
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const now = useMemo(() => Date.now(), []);
  const daysUntilInsurance =
    selectedVehicle && selectedVehicle.insuranceExpiry
      ? Math.ceil(
          (new Date(selectedVehicle.insuranceExpiry).getTime() - now) / (1000 * 60 * 60 * 24)
        )
      : 365;
  const daysUntilLicense =
    selectedVehicle && selectedVehicle.licenseExpiry
      ? Math.ceil((new Date(selectedVehicle.licenseExpiry).getTime() - now) / (1000 * 60 * 60 * 24))
      : 365;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-container-lowest)]">
        <div className="text-center">
          <div className="border-brand-secondary mx-auto h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="mt-4 font-medium text-[var(--color-outline)]">Loading vehicle info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
      <header className="rounded-b-[3rem] bg-gradient-to-br from-slate-700 to-slate-900 p-6 pb-8 text-white">
        <div className="flex items-center justify-between">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">
            MIIAM
          </Link>
          <button
            onClick={() => setShowAddVehicle(true)}
            className="rounded-lg bg-[var(--color-surface-container-lowest)]/20 p-2"
            aria-label="Add vehicle"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
        <h1 className="mt-4 text-2xl font-bold">🚗 My Vehicle</h1>
        <p className="text-sm opacity-70">Manage your rides</p>
      </header>

      <main className="-mt-4 space-y-6 px-6 pb-32">
        {/* Alerts */}
        {daysUntilInsurance < 30 && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-red-700">Insurance Expiring Soon</p>
              <p className="text-xs text-red-500">Renew within {daysUntilInsurance} days</p>
            </div>
          </div>
        )}
        {daysUntilLicense < 60 && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-bold text-amber-700">License Renewal Reminder</p>
              <p className="text-xs text-amber-500">Valid until {daysUntilLicense} days</p>
            </div>
          </div>
        )}

        {/* Current Vehicle */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-[var(--color-on-surface)]">Current Vehicle</h3>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
              Active
            </span>
          </div>

          {selectedVehicle ? (
            <>
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface-container)] text-3xl">
                  🛵
                </div>
                <div>
                  <h4 className="text-lg font-bold">{selectedVehicle.name}</h4>
                  <p className="text-sm text-[var(--color-outline)]">
                    {selectedVehicle.model} • {selectedVehicle.number}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--color-surface-subtle)] p-3">
                  <p className="text-[10px] text-[var(--color-outline-variant)]">Insurance Valid</p>
                  <p
                    className={`font-bold ${daysUntilInsurance < 30 ? "text-red-500" : "text-green-600"}`}
                  >
                    {daysUntilInsurance} days
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--color-surface-subtle)] p-3">
                  <p className="text-[10px] text-[var(--color-outline-variant)]">License Valid</p>
                  <p
                    className={`font-bold ${daysUntilLicense < 60 ? "text-amber-500" : "text-green-600"}`}
                  >
                    {daysUntilLicense} days
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-[var(--color-outline-variant)]">
              <span className="material-symbols-outlined text-4xl">two_wheeler</span>
              <p className="mt-2 font-medium">No vehicle added yet</p>
              <p className="mt-1 text-xs">Click + to add your vehicle</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-[var(--color-surface-container-lowest)] p-1">
          {(["vehicles", "maintenance", "fuel"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-all ${
                activeTab === tab ? "bg-brand-secondary text-white" : "text-[var(--color-outline)]"
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
                className={`cursor-pointer rounded-2xl border-2 bg-[var(--color-surface-container-lowest)] p-4 shadow-sm transition-all ${
                  vehicle.isDefault ? "border-brand-secondary" : "border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-container)] text-2xl">
                      {vehicle.type === "car" ? "🚗" : vehicle.type === "bike" ? "🏍️" : "🛵"}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--color-on-surface)]">{vehicle.name}</p>
                      <p className="text-xs text-[var(--color-outline-variant)]">
                        {vehicle.number}
                      </p>
                    </div>
                  </div>
                  {vehicle.isDefault && (
                    <span className="bg-brand-secondary rounded-full px-2 py-1 text-xs text-white">
                      Default
                    </span>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowAddVehicle(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-outline-variant)] py-4 font-bold text-[var(--color-outline)]"
            >
              <span className="material-symbols-outlined">add</span>
              {t.vehicle.addNewVehicle}
            </button>
          </>
        )}

        {activeTab === "maintenance" && (
          <>
            {maintenanceRecords.length > 0 && (
              <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-[var(--color-on-surface)]">Service History</h3>
                </div>
                <div className="space-y-3">
                  {maintenanceRecords.map((record, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b border-[var(--color-border-subtle)] p-3"
                    >
                      <div>
                        <p className="text-sm font-bold">{record.type}</p>
                        <p className="text-xs text-[var(--color-outline-variant)]">
                          {record.date} • {record.odometer} km
                        </p>
                      </div>
                      <p className="font-bold">₹{record.cost}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-center text-xs text-[var(--color-outline-variant)]">
                  Total: ₹{maintenanceRecords.reduce((s, r) => s + r.cost, 0)}
                </p>
              </div>
            )}
            {maintenanceRecords.length === 0 && (
              <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 py-8 text-center text-[var(--color-outline-variant)] shadow-sm">
                <span className="material-symbols-outlined text-4xl">build</span>
                <p className="mt-2 font-medium">No service records yet</p>
              </div>
            )}
          </>
        )}

        {activeTab === "fuel" && (
          <>
            <div className="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-green-600">Total Spent</p>
                  <p className="text-2xl font-black text-green-700">
                    ₹{fuelLog.reduce((s, f) => s + f.cost, 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-green-600">Liters Used</p>
                  <p className="text-2xl font-black text-green-700">
                    {fuelLog.reduce((s, f) => s + f.liters, 0).toFixed(1)}L
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-sm">
              <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Fuel Log</h3>
              <div className="space-y-3">
                {fuelLog.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3"
                  >
                    <div>
                      <p className="text-sm font-bold">{log.liters}L filled</p>
                      <p className="text-xs text-[var(--color-outline-variant)]">
                        {log.date} • {log.odometer} km
                      </p>
                    </div>
                    <p className="font-bold text-green-600">₹{log.cost}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowAddFuelModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] py-4 font-bold text-[var(--color-on-surface-variant)]"
            >
              <span className="material-symbols-outlined">local_gas_station</span>
              Add Fuel Entry
            </button>
          </>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              const vehicle = vehicles.find((v) => v.isDefault) || vehicles[0];
              if (vehicle?.insuranceExpiry) {
                const daysUntil = Math.ceil(
                  (new Date(vehicle.insuranceExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                import("@/lib/store/toastStore").then((m) =>
                  m.useToastStore
                    .getState()
                    .addToast(
                      daysUntil > 0
                        ? `Insurance expires in ${daysUntil} days (${vehicle.insuranceExpiry})`
                        : `Insurance expired on ${vehicle.insuranceExpiry}!`,
                      daysUntil > 30 ? "success" : "error"
                    )
                );
              } else {
                import("@/lib/store/toastStore").then((m) =>
                  m.useToastStore
                    .getState()
                    .addToast("Add a vehicle first to view insurance details", "info")
                );
              }
            }}
            className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-sm"
          >
            <span className="material-symbols-outlined text-accent">policy</span>
            <span className="text-sm font-bold">Insurance</span>
          </button>
          <button
            onClick={() =>
              window.open("https://www.google.com/maps/search/service+center+near+me", "_blank")
            }
            className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-sm"
          >
            <span className="material-symbols-outlined text-amber-600">build</span>
            <span className="text-sm font-bold">Service Center</span>
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
              const { data: vdata } = await supabase
                .from("rider_vehicles")
                .select("*")
                .eq("rider_id", riderId);
              if (vdata) {
                const mapped: Vehicle[] = vdata.map(
                  (v: {
                    id: string;
                    name: string;
                    type: string;
                    model: string | null;
                    number: string | null;
                    insurance_expiry: string | null;
                    license_expiry: string | null;
                    is_default: boolean | null;
                  }) => ({
                    model: v.model || "",
                    number: v.number || "",
                    insuranceExpiry: v.insurance_expiry || "",
                    licenseExpiry: v.license_expiry || "",
                    isDefault: v.is_default || false,
                  })
                );
                setVehicles(mapped);
                if (!selectedVehicle) setSelectedVehicle(mapped[0]);
              }
            }
          }}
        />
      )}

      {/* Add Fuel Entry Modal */}
      {showAddFuelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--color-surface-container-lowest)] p-6">
            <h3 className="mb-4 text-lg font-bold">{t.vehicle.addFuelEntry}</h3>
            <div className="space-y-3">
              <input
                type="date"
                value={fuelForm.date}
                onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })}
                aria-label={t.vehicle.fuelDate}
                className="w-full rounded-xl border border-[var(--color-border-subtle)] px-4 py-3 text-sm"
              />
              <input
                type="number"
                placeholder="Liters"
                value={fuelForm.liters}
                onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
                aria-label={t.vehicle.fuelLiters}
                className="w-full rounded-xl border border-[var(--color-border-subtle)] px-4 py-3 text-sm"
              />
              <input
                type="number"
                placeholder="Cost (₹)"
                value={fuelForm.cost}
                onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })}
                aria-label={t.vehicle.fuelCost}
                className="w-full rounded-xl border border-[var(--color-border-subtle)] px-4 py-3 text-sm"
              />
              <input
                type="number"
                placeholder="Odometer (km)"
                value={fuelForm.odometer}
                onChange={(e) => setFuelForm({ ...fuelForm, odometer: e.target.value })}
                aria-label={t.vehicle.fuelOdometer}
                className="w-full rounded-xl border border-[var(--color-border-subtle)] px-4 py-3 text-sm"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAddFuelModal(false)}
                className="flex-1 rounded-xl border border-[var(--color-border-subtle)] py-3 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!fuelForm.liters || !fuelForm.cost || !riderId) {
                    import("@/lib/store/toastStore").then((m) =>
                      m.useToastStore.getState().addToast("Please fill liters and cost", "error")
                    );
                    return;
                  }
                  await supabase.from("rider_fuel_entries").insert({
                    rider_id: riderId,
                    date: fuelForm.date,
                    liters: Number(fuelForm.liters),
                    cost: Number(fuelForm.cost),
                    odometer: Number(fuelForm.odometer) || 0,
                  });
                  setFuelLog((prev) => [
                    {
                      id: `new_${Date.now()}`,
                      date: fuelForm.date,
                      liters: Number(fuelForm.liters),
                      cost: Number(fuelForm.cost),
                      odometer: Number(fuelForm.odometer) || 0,
                    },
                    ...prev,
                  ]);
                  import("@/lib/store/toastStore").then((m) =>
                    m.useToastStore.getState().addToast("Fuel entry added!", "success")
                  );
                  setShowAddFuelModal(false);
                  setFuelForm({
                    liters: "",
                    cost: "",
                    odometer: "",
                    date: new Date().toISOString().split("T")[0],
                  });
                }}
                className="bg-brand-secondary flex-1 rounded-xl py-3 text-sm font-bold text-white"
              >
                {t.vehicle.saveEntry}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddVehicleModal({
  riderId,
  onClose,
  onSaved,
}: {
  riderId: string | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const supabase = useMemo(() => createClient(), []);
  const { t } = useTranslation();
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
      logger.error(
        { err: e instanceof Error ? e : new Error(String(e)) },
        "Failed to save vehicle"
      );
      import("@/lib/store/toastStore").then((m) =>
        m.useToastStore.getState().addToast("Failed to save vehicle", "error")
      );
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-vehicle-title"
        className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-container-lowest)] p-6"
      >
        <h3 id="add-vehicle-title" className="mb-4 text-xl font-bold">
          {t.vehicle.addNewVehicle}
        </h3>
        <div className="space-y-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "scooter" | "bike" | "car")}
            aria-label={t.vehicle.vehicleType}
            className="w-full rounded-xl border-2 border-[var(--color-border-subtle)] p-3"
          >
            <option value="scooter">Scooter</option>
            <option value="bike">Bike</option>
            <option value="car">Car</option>
          </select>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vehicle Name (e.g., Honda Activa)"
            aria-label={t.vehicle.vehicleName}
            className="w-full rounded-xl border-2 border-[var(--color-border-subtle)] p-3"
          />
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model (e.g., Activa 5G)"
            aria-label={t.vehicle.vehicleModel}
            className="w-full rounded-xl border-2 border-[var(--color-border-subtle)] p-3"
          />
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Vehicle Number (e.g., DL 01 AB 1234)"
            aria-label={t.vehicle.vehicleNumber}
            className="w-full rounded-xl border-2 border-[var(--color-border-subtle)] p-3"
          />
          <input
            type="date"
            value={insuranceExpiry}
            onChange={(e) => setInsuranceExpiry(e.target.value)}
            placeholder="Insurance Expiry"
            aria-label={t.vehicle.insuranceExpiry}
            className="w-full rounded-xl border-2 border-[var(--color-border-subtle)] p-3"
          />
          <input
            type="date"
            value={licenseExpiry}
            onChange={(e) => setLicenseExpiry(e.target.value)}
            placeholder="License Expiry"
            aria-label={t.vehicle.licenseExpiry}
            className="w-full rounded-xl border-2 border-[var(--color-border-subtle)] p-3"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="bg-brand-secondary mt-4 w-full rounded-xl py-4 font-bold text-white disabled:opacity-50"
        >
          {saving ? t.vehicle.saving : t.vehicle.addVehicle}
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full py-3 font-bold text-[var(--color-outline)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
