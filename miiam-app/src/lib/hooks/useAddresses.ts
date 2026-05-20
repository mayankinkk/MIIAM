"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useCallback } from "react";

interface Address {
  id: string;
  user_id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
  created_at: string;
}

export function useAddresses() {
  const supabase = createClient();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/addresses?user_id=${user.id}`);
    const data = await res.json();

    if (data.addresses) {
      setAddresses(data.addresses);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const addAddress = async (addressData: Omit<Address, "id" | "user_id" | "created_at">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addressData, user_id: user.id }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    await loadAddresses();
    return data.address;
  };

  const updateAddress = async (id: string, addressData: Partial<Address>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const res = await fetch("/api/addresses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addressData, id, user_id: user.id }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    await loadAddresses();
    return data.address;
  };

  const deleteAddress = async (id: string) => {
    const res = await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    await loadAddresses();
  };

  const setDefault = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    await updateAddress(id, { is_default: true });
  };

  const defaultAddress = addresses.find(a => a.is_default);

  return {
    addresses,
    loading,
    error,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefault,
    defaultAddress,
    refresh: loadAddresses,
  };
}