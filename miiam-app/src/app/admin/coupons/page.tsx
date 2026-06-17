"use client";

import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useConfirm } from "@/components/ui/ConfirmDialog";

type Coupon = {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order: number;
  max_discount: number;
  usage_limit: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  status: "active" | "expired" | "exhausted";
  service_type: string;
  created_at: string;
};

// removed mock coupons

export default function CouponsAdminPage() {
  const { confirm } = useConfirm();
  const supabase = useMemo(() => createClient(), []);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "exhausted">("all");

  const [formData, setFormData] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: 0,
    min_order: 0,
    max_discount: 0,
    usage_limit: 0,
    valid_from: "",
    valid_until: "",
    service_type: "all",
  });

  useEffect(() => {
    loadCoupons();
  }, [supabase]);

  const loadCoupons = async () => {
    const { data } = await supabase.from("promo_codes").select("*");
    if (data) {
      setCoupons(data.map((c: {
        id: string;
        code: string;
        discount_type: string;
        discount_value: number | null;
        min_order_amount: number | null;
        max_discount: number | null;
        usage_limit: number | null;
        uses_count: number | null;
        created_at: string;
        is_active: boolean;
        valid_until: string | null;
      }) => ({
        id: c.id,
        code: c.code,
        type: c.discount_type === "percentage" ? "percentage" : "fixed",
        value: c.discount_value || 0,
        min_order: c.min_order_amount || 0,
        max_discount: c.max_discount || 0,
        usage_limit: c.usage_limit || 100,
        used_count: c.uses_count || 0,
        valid_from: c.created_at,
        valid_until: c.valid_until || new Date(Date.now() + 86400000 * 30).toISOString(),
        status: c.is_active ? "active" : "expired",
        service_type: "all",
        created_at: c.created_at
      })));
    }
  };

  const filteredCoupons = coupons.filter((c) =>
    filter === "all" ? true : c.status === filter
  );

  const totalDiscount = coupons.reduce((sum, c) => sum + c.used_count * c.value, 0);
  const activeCoupons = coupons.filter((c) => c.status === "active").length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dbPayload = {
      code: formData.code.toUpperCase(),
      discount_type: formData.type,
      discount_value: formData.value,
      min_order_amount: formData.min_order,
      is_active: true,
      uses_count: editingCoupon ? editingCoupon.used_count : 0
    };

    if (editingCoupon) {
      await supabase.from("promo_codes").update(dbPayload).eq("id", editingCoupon.id);
    } else {
      await supabase.from("promo_codes").insert(dbPayload);
    }
    
    loadCoupons();
    setShowModal(false);
    setEditingCoupon(null);
    setFormData({
      code: "",
      type: "percentage",
      value: 0,
      min_order: 0,
      max_discount: 0,
      usage_limit: 0,
      valid_from: "",
      valid_until: "",
      service_type: "all",
    });
  };

  const deleteCoupon = async (id: string) => {
    if (await confirm({ title: "Delete", message: "Are you sure you want to delete this coupon?", variant: "danger" })) {
      await supabase.from("promo_codes").delete().eq("id", id);
      loadCoupons();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-primary)] to-[#8a0014] text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Coupons & Promotions</h1>
            <p className="text-white/80">Manage promo codes and discounts</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] px-6 py-3 rounded-xl font-bold hover:bg-[var(--color-surface-container-lowest)]/90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Create Coupon
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 -mt-8">
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 shadow-lg">
          <div className="text-sm text-[var(--color-outline)] mb-1">Total Coupons</div>
          <div className="text-2xl font-black text-[var(--color-on-surface)]">{coupons.length}</div>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 shadow-lg">
          <div className="text-sm text-[var(--color-outline)] mb-1">Active Coupons</div>
          <div className="text-2xl font-black text-green-600">{activeCoupons}</div>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 shadow-lg">
          <div className="text-sm text-[var(--color-outline)] mb-1">Total Uses</div>
          <div className="text-2xl font-black text-[var(--color-on-surface)]">
            {coupons.reduce((s, c) => s + c.used_count, 0)}
          </div>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 shadow-lg">
          <div className="text-sm text-[var(--color-outline)] mb-1">Total Discount Given</div>
          <div className="text-2xl font-black text-[var(--color-primary)]">₹{totalDiscount.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 pb-4">
        <div className="flex gap-2">
          {["all", "active", "expired", "exhausted"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-full font-bold text-sm capitalize transition-colors ${
                filter === f
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] border border-[var(--color-border-subtle)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table */}
      <div className="px-6 pb-6">
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-surface-subtle)] border-b border-[var(--color-border-subtle)]">
              <tr>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Code</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Discount</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Min Order</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Usage</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Valid Until</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Status</th>
                <th className="text-left p-4 font-bold text-[var(--color-on-surface-variant)] text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-slate-50 hover:bg-pink-50/30">
                  <td className="p-4">
                    <span className="font-bold text-[var(--color-on-surface)] bg-[var(--color-surface-container)] px-3 py-1 rounded-lg">
                      {coupon.code}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-green-600">
                      {coupon.type === "percentage"
                        ? `${coupon.value}%`
                        : `₹${coupon.value}`}
                    </span>
                    {coupon.max_discount > 0 && (
                      <span className="text-xs text-[var(--color-outline-variant)] ml-1">
                        (max ₹{coupon.max_discount})
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-[var(--color-on-surface-variant)]">₹{coupon.min_order}</td>
                  <td className="p-4">
                    <div className="w-24 bg-[var(--color-surface-container)] rounded-full h-2 mb-1">
                      <div
                        className="bg-[var(--color-primary)] h-2 rounded-full"
                        style={{
                          width: `${(coupon.used_count / coupon.usage_limit) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-[var(--color-outline)]">
                      {coupon.used_count}/{coupon.usage_limit}
                    </span>
                  </td>
                  <td className="p-4 text-[var(--color-on-surface-variant)] text-sm">
                    {new Date(coupon.valid_until).toLocaleDateString("en-IN")}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-bold ${
                        coupon.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : coupon.status === "exhausted"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-[var(--color-surface-container)] text-[var(--color-on-surface)]"
                      }`}
                    >
                      {coupon.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => {
                        setEditingCoupon(coupon);
                        setFormData(coupon);
                        setShowModal(true);
                      }}
                      className="text-[var(--color-primary)] font-bold text-sm hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon.id)}
                      className="text-red-500 font-bold text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl w-full max-w-lg p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-[var(--color-on-surface)]">
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCoupon(null);
                }}
                className="w-10 h-10 rounded-full hover:bg-[var(--color-surface-container)] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[var(--color-outline-variant)]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="w-full p-3 rounded-xl border border-[var(--color-border-subtle)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                  placeholder="e.g. SUMMER20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as any })
                    }
                    className="w-full p-3 rounded-xl border border-[var(--color-border-subtle)] focus:border-[var(--color-primary)] outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: parseInt(e.target.value) })
                    }
                    className="w-full p-3 rounded-xl border border-[var(--color-border-subtle)] focus:border-[var(--color-primary)] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-1">
                    Min Order (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.min_order}
                    onChange={(e) =>
                      setFormData({ ...formData, min_order: parseInt(e.target.value) })
                    }
                    className="w-full p-3 rounded-xl border border-[var(--color-border-subtle)] focus:border-[var(--color-primary)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-1">
                    Max Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) =>
                      setFormData({ ...formData, max_discount: parseInt(e.target.value) })
                    }
                    className="w-full p-3 rounded-xl border border-[var(--color-border-subtle)] focus:border-[var(--color-primary)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-1">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_from: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-[var(--color-border-subtle)] focus:border-[var(--color-primary)] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-[var(--color-border-subtle)] focus:border-[var(--color-primary)] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-1">
                  Usage Limit
                </label>
                <input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) =>
                    setFormData({ ...formData, usage_limit: parseInt(e.target.value) })
                  }
                  className="w-full p-3 rounded-xl border border-[var(--color-border-subtle)] focus:border-[var(--color-primary)] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--color-on-surface)] mb-1">
                  Applicable To
                </label>
                <select
                  value={formData.service_type}
                  onChange={(e) =>
                    setFormData({ ...formData, service_type: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-[var(--color-border-subtle)] focus:border-[var(--color-primary)] outline-none"
                >
                  <option value="all">All Services</option>
                  <option value="beauty">Beauty & Wellness</option>
                  <option value="ac_repair">AC Repair</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[var(--color-primary)] text-white rounded-xl font-bold hover:bg-[#a40017] transition-all"
              >
                {editingCoupon ? "Update Coupon" : "Create Coupon"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}