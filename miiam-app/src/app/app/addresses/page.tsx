"use client";

import { useState } from "react";
import Link from "next/link";

const addressTypes = [
  { id: "home", icon: "home", label: "Home", color: "bg-blue-100 text-blue-700" },
  { id: "office", icon: "business", label: "Office", color: "bg-purple-100 text-purple-700" },
  { id: "other", icon: "place", label: "Other", color: "bg-slate-100 text-slate-700" },
];

const defaultAddresses = [
  {
    id: "addr1",
    label: "Home",
    icon: "home",
    name: "Priya Sharma",
    street: "456, ABC Apartments, Ring Road",
    city: "Guwahati",
    state: "Assam",
    postal_code: "781001",
    is_default: true,
    phone: "9876543210",
    instructions: "Ring bell twice",
  },
  {
    id: "addr2",
    label: "Office",
    icon: "business",
    name: "Priya Sharma",
    street: "789, Tech Park, GS Road",
    city: "Guwahati",
    state: "Assam",
    postal_code: "781005",
    is_default: false,
    phone: "9876543210",
    instructions: "Carry ID card",
  },
];

export default function AddressBookPage() {
  const savedFromStorage = JSON.parse(localStorage.getItem('miiam_addresses') || '[]');
  const mergedAddresses = savedFromStorage.length > 0 ? savedFromStorage : defaultAddresses;
  const [addresses, setAddresses] = useState(mergedAddresses);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<typeof savedAddresses[0] | null>(null);
  const [newAddress, setNewAddress] = useState({
    label: "home",
    name: "",
    street: "",
    city: "Guwahati",
    state: "Assam",
    postal_code: "",
    phone: "",
    instructions: "",
  });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const handleUseMyLocation = () => {
    setDetectingLocation(true);
    setLocationError("");

    if ("geolocation" in navigator) {
      const handleSuccess = (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log("Location detected:", latitude, longitude, "accuracy:", accuracy, "m");
        
        setNewAddress((prev) => ({
          ...prev,
          street: `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`,
          postal_code: accuracy < 100 ? "High Accuracy" : "Medium Accuracy",
        }));
        setDetectingLocation(false);
      };

      const handleError = (error: GeolocationPositionError) => {
        if (error.code === error.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(handleSuccess, () => {
            setLocationError("Location timed out. Using fallback...");
            setNewAddress((prev) => ({ ...prev, street: "Location unavailable" }));
            setDetectingLocation(false);
          }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
          return;
        }
        setLocationError("Unable to detect location. Please enter manually.");
        setDetectingLocation(false);
      };

      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 25000,
        maximumAge: 0,
      });
    } else {
      setLocationError("Location not supported by your browser.");
      setDetectingLocation(false);
    }
  };

  const handleSetDefault = (addressId: string) => {
    const selectedAddress = addresses.find(addr => addr.id === addressId);
    if (selectedAddress) {
      const fullAddress = `${selectedAddress.name}, ${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.postal_code}`;
      localStorage.setItem('miiam_selected_address', JSON.stringify({ address: fullAddress }));
    }
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        is_default: addr.id === addressId,
      }))
    );
  };

  const handleSelectAddress = (address: typeof addresses[0]) => {
    const fullAddress = `${address.name}, ${address.street}, ${address.city}, ${address.state} - ${address.postal_code}`;
    localStorage.setItem('miiam_selected_address', JSON.stringify({ address: fullAddress }));
    window.location.href = '/app/checkout';
  };

  const handleDelete = (addressId: string) => {
    if (confirm("Delete this address?")) {
      const updatedAddresses = addresses.filter((addr) => addr.id !== addressId);
      setAddresses(updatedAddresses);
      localStorage.setItem('miiam_addresses', JSON.stringify(updatedAddresses));
    }
  };

  const handleSave = () => {
    const addressData = {
      ...newAddress,
      id: editingAddress?.id || "addr" + Date.now(),
      icon: newAddress.label,
    };

    if (editingAddress) {
      const updatedAddresses = addresses.map((addr) => (addr.id === editingAddress.id ? { ...addr, ...addressData } : addr));
      setAddresses(updatedAddresses);
      localStorage.setItem('miiam_addresses', JSON.stringify(updatedAddresses));
    } else {
      const updatedAddresses = [...addresses, addressData as typeof addresses[0]];
      setAddresses(updatedAddresses);
      localStorage.setItem('miiam_addresses', JSON.stringify(updatedAddresses));
    }

    setShowAddAddress(false);
    setEditingAddress(null);
    setNewAddress({
      label: "home",
      name: "",
      street: "",
      city: "Guwahati",
      state: "Assam",
      postal_code: "",
      phone: "",
      instructions: "",
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/app/profile" className="text-2xl font-black text-[#ba001c] tracking-tighter">
            MIIAM
          </Link>
          <Link href="/app/profile" className="text-sm font-bold text-slate-600 hover:text-[#ba001c]">
            Cancel
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <section className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">My Addresses</h1>
          <p className="text-slate-500">Manage your delivery addresses</p>
        </section>

        {/* Saved Addresses */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Saved Addresses</h2>
            <span className="text-xs text-slate-500">{addresses.length} addresses</span>
          </div>

          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white rounded-2xl overflow-hidden shadow-sm transition-all ${
                  address.is_default ? "ring-2 ring-[#ba001c]" : ""
                }`}
              >
                {address.is_default && (
                  <div className="bg-[#ba001c] text-white text-xs font-bold px-4 py-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Default Address
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      address.label === "Home" ? "bg-blue-100" :
                      address.label === "Office" ? "bg-purple-100" : "bg-slate-100"
                    }`}>
                      <span className={`material-symbols-outlined text-xl ${
                        address.label === "Home" ? "text-blue-700" :
                        address.label === "Office" ? "text-purple-700" : "text-slate-700"
                      }`}>
                        {address.icon}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{address.label}</h3>
                        {address.is_default && (
                          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-800 mt-2">{address.name}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {address.street}, {address.city}
                      </p>
                      <p className="text-sm text-slate-500">{address.state} - {address.postal_code}</p>
                      {address.instructions && (
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">info</span>
                          {address.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 flex">
                  <button
                    onClick={() => handleSelectAddress(address)}
                    className="flex-1 py-3 text-[#ba001c] font-bold text-sm border-r border-slate-100 hover:bg-[#fff4f4] transition-colors"
                  >
                    Select for Delivery
                  </button>
                </div>
                <div className="border-t border-slate-100 flex">
                  {!address.is_default && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="flex-1 py-3 text-blue-600 font-bold text-sm border-r border-slate-100 hover:bg-blue-50 transition-colors"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingAddress(address);
                      setNewAddress({
                        label: address.label.toLowerCase(),
                        name: address.name,
                        street: address.street,
                        city: address.city,
                        state: address.state,
                        postal_code: address.postal_code,
                        phone: address.phone,
                        instructions: address.instructions,
                      });
                      setShowAddAddress(true);
                    }}
                    className="flex-1 py-3 text-slate-600 font-bold text-sm border-r border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="flex-1 py-3 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Add New Address Button */}
        <div className="space-y-3">
          <Link
            href="/app/addresses/add"
            className="w-full py-4 bg-[#ba001c] text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 hover:bg-[#a40017] transition-colors shadow-lg shadow-[#ba001c]/20"
          >
            <span className="material-symbols-outlined">add_location</span>
            Add New Address
          </Link>
          <Link
            href="/app/addresses/add"
            className="w-full py-3 bg-[#0b50d5] text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-[#0940b0] transition-colors"
          >
            <span className="material-symbols-outlined">my_location</span>
            Auto Detect on Map
          </Link>
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600">info</span>
            <div>
              <p className="font-bold text-blue-900 text-sm">Delivery Tips</p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1">
                <li>• Add clear, complete addresses for smoother deliveries</li>
                <li>• Include landmark or building name if available</li>
                <li>• Add delivery instructions (e.g., gate code, floor)</li>
                <li>• Set your most frequent address as default</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Address Modal */}
      {showAddAddress && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            setShowAddAddress(false);
            setEditingAddress(null);
          }} />

          <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingAddress ? "Update your address details" : "Enter your delivery address"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddAddress(false);
                  setEditingAddress(null);
                }}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Address Type */}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-3">Address Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {addressTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setNewAddress({ ...newAddress, label: type.id })}
                      className={`py-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${
                        newAddress.label === type.id
                          ? `${type.color} border-transparent`
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-xl ${
                        newAddress.label === type.id ? "" : "text-slate-400"
                      }`}>
                        {type.icon}
                      </span>
                      <span className="text-sm font-bold">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/20"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-semibold text-slate-700">Phone Number *</label>
                <input
                  type="tel"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/20"
                />
              </div>

              {/* Street Address */}
              <div>
                <label className="text-sm font-semibold text-slate-700">Street Address *</label>
                <input
                  type="text"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  placeholder="House/Flat/Building name, Street"
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/20"
                />
              </div>

              {/* Location Detect */}
              <button
                onClick={handleUseMyLocation}
                disabled={detectingLocation}
                className="w-full py-3 bg-white border border-[#ba001c] text-[#ba001c] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#fff4f4] transition-colors"
              >
                <span className="material-symbols-outlined">{detectingLocation ? "sync" : "my_location"}</span>
                {detectingLocation ? "Detecting Location..." : "Use My Current Location"}
              </button>
              {locationError && (
                <p className="text-xs text-red-500">{locationError}</p>
              )}

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700">City *</label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    placeholder="City"
                    className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">State *</label>
                  <input
                    type="text"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    placeholder="State"
                    className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/20"
                  />
                </div>
              </div>

              {/* Postal Code */}
              <div>
                <label className="text-sm font-semibold text-slate-700">PIN Code *</label>
                <input
                  type="text"
                  value={newAddress.postal_code}
                  onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                  placeholder="6-digit PIN code"
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/20"
                />
              </div>

              {/* Delivery Instructions */}
              <div>
                <label className="text-sm font-semibold text-slate-700">Delivery Instructions (Optional)</label>
                <textarea
                  value={newAddress.instructions}
                  onChange={(e) => setNewAddress({ ...newAddress, instructions: e.target.value })}
                  placeholder="E.g., Ring bell, call on arrival, near park"
                  className="w-full mt-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/20 resize-none h-20"
                />
                <p className="text-xs text-slate-400 mt-1">Max 150 characters</p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!newAddress.name || !newAddress.street || !newAddress.postal_code}
                className="w-full py-4 bg-[#ba001c] text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 hover:bg-[#a40017] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xl shadow-[#ba001c]/30"
              >
                <span className="material-symbols-outlined">check</span>
                {editingAddress ? "Update Address" : "Save Address"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}