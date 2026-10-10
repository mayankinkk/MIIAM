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

    const channel = supabase
      .channel("promo_codes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "promo_codes" }, () => {
        loadCoupons();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const loadCoupons = async () => {
    const { data } = await supabase.from("promo_codes").select("*");
    if (data) {
      setCoupons(
        data.map(
          (c: {
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
            created_at: c.created_at,
          })
        )
      );
    }
  };

  const filteredCoupons = coupons.filter((c) => (filter === "all" ? true : c.status === filter));

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
      uses_count: editingCoupon ? editingCoupon.used_count : 0,
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
    if (
      await confirm({
        title: "Delete",
        message: "Are you sure you want to delete this coupon?",
        variant: "danger",
      })
    ) {
      await supabase.from("promo_codes").delete().eq("id", id);
      loadCoupons();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-primary)] to-[#8a0014] p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Coupons & Promotions</h1>
            <p className="text-white/80">Manage promo codes and discounts</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-surface-container-lowest)] px-6 py-3 font-bold text-[var(--color-primary)] transition-all hover:bg-[var(--color-surface-container-lowest)]/90"
          >
            <span className="material-symbols-outlined">add</span>
            Create Coupon
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="-mt-8 grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-lg">
          <div className="mb-1 text-sm text-[var(--color-outline)]">Total Coupons</div>
          <div className="text-2xl font-black text-[var(--color-on-surface)]">{coupons.length}</div>
        </div>
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-lg">
          <div className="mb-1 text-sm text-[var(--color-outline)]">Active Coupons</div>
          <div className="text-2xl font-black text-green-600">{activeCoupons}</div>
        </div>
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-lg">
          <div className="mb-1 text-sm text-[var(--color-outline)]">Total Uses</div>
          <div className="text-2xl font-black text-[var(--color-on-surface)]">
            {coupons.reduce((s, c) => s + c.used_count, 0)}
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-lg">
          <div className="mb-1 text-sm text-[var(--color-outline)]">Total Discount Given</div>
          <div className="text-2xl font-black text-[var(--color-primary)]">
            ₹{totalDiscount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 pb-4">
        <div className="flex gap-2">
          {["all", "active", "expired", "exhausted"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as "all" | "active" | "expired" | "exhausted")}
              className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition-colors ${
                filter === f
                  ? "text-on-primary bg-[var(--color-primary)]"
                  : "border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table */}
      <div className="px-6 pb-6">
        <div className="overflow-x-auto rounded-2xl bg-[var(--color-surface-container-lowest)] shadow-lg">
          <table className="w-full">
            <caption className="sr-only">Coupons & Promotions</caption>
            <thead className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
              <tr>
                <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                  Code
                </th>
                <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                  Discount
                </th>
                <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                  Min Order
                </th>
                <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                  Usage
                </th>
                <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                  Valid Until
                </th>
                <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                  Status
                </th>
                <th className="p-4 text-left text-sm font-bold text-[var(--color-on-surface-variant)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-slate-50 hover:bg-pink-50/30">
                  <td className="p-4">
                    <span className="rounded-lg bg-[var(--color-surface-container)] px-3 py-1 font-bold text-[var(--color-on-surface)]">
                      {coupon.code}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-green-600">
                      {coupon.type === "percentage" ? `${coupon.value}%` : `₹${coupon.value}`}
                    </span>
                    {coupon.max_discount > 0 && (
                      <span className="ml-1 text-xs text-[var(--color-outline-variant)]">
                        (max ₹{coupon.max_discount})
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-[var(--color-on-surface-variant)]">
                    ₹{coupon.min_order}
                  </td>
                  <td className="p-4">
                    <div className="mb-1 h-2 w-24 rounded-full bg-[var(--color-surface-container)]">
                      <div
                        className="h-2 rounded-full bg-[var(--color-primary)]"
                        style={{
                          width: `${(coupon.used_count / coupon.usage_limit) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-[var(--color-outline)]">
                      {coupon.used_count}/{coupon.usage_limit}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-[var(--color-on-surface-variant)]">
                    {new Date(coupon.valid_until).toLocaleDateString("en-IN")}
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
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
                      className="mr-3 text-sm font-bold text-[var(--color-primary)] hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon.id)}
                      className="text-sm font-bold text-red-500 hover:underline"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-modal-title"
          onKeyDown={(e) => e.key === "Escape" && setShowModal(false)}
        >
          <div className="m-4 w-full max-w-lg rounded-3xl bg-[var(--color-surface-container-lowest)] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2
                id="coupon-modal-title"
                className="text-xl font-black text-[var(--color-on-surface)]"
              >
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCoupon(null);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--color-surface-container)]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="coupon-code"
                  className="mb-1 block text-sm font-bold text-[var(--color-on-surface)]"
                >
                  Coupon Code
                </label>
                <input
                  id="coupon-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  placeholder="e.g. SUMMER20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="coupon-discount-type"
                    className="mb-1 block text-sm font-bold text-[var(--color-on-surface)]"
                  >
                    Discount Type
                  </label>
                  <select
                    id="coupon-discount-type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as "percentage" | "fixed" })
                    }
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="coupon-value"
                    className="mb-1 block text-sm font-bold text-[var(--color-on-surface)]"
                  >
                    Value
                  </label>
                  <input
                    id="coupon-value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) })}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 outline-none focus:border-[var(--color-primary)]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="coupon-min-order"
                    className="mb-1 block text-sm font-bold text-[var(--color-on-surface)]"
                  >
                    Min Order (₹)
                  </label>
                  <input
                    id="coupon-min-order"
                    value={formData.min_order}
                    onChange={(e) =>
                      setFormData({ ...formData, min_order: parseInt(e.target.value) })
                    }
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="coupon-max-discount"
                    className="mb-1 block text-sm font-bold text-[var(--color-on-surface)]"
                  >
                    Max Discount (₹)
                  </label>
                  <input
                    id="coupon-max-discount"
                    value={formData.max_discount}
                    onChange={(e) =>
                      setFormData({ ...formData, max_discount: parseInt(e.target.value) })
                    }
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="coupon-valid-from"
                    className="mb-1 block text-sm font-bold text-[var(--color-on-surface)]"
                  >
                    Valid From
                  </label>
                  <input
                    id="coupon-valid-from"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 outline-none focus:border-[var(--color-primary)]"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="coupon-valid-until"
                    className="mb-1 block text-sm font-bold text-[var(--color-on-surface)]"
                  >
                    Valid Until
                  </label>
                  <input
                    id="coupon-valid-until"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 outline-none focus:border-[var(--color-primary)]"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="coupon-usage-limit"
                  className="mb-1 block text-sm font-bold text-[var(--color-on-surface)]"
                >
                  Usage Limit
                </label>
                <input
                  id="coupon-usage-limit"
                  value={formData.usage_limit}
                  onChange={(e) =>
                    setFormData({ ...formData, usage_limit: parseInt(e.target.value) })
                  }
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 outline-none focus:border-[var(--color-primary)]"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="coupon-service-type"
                  className="mb-1 block text-sm font-bold text-[var(--color-on-surface)]"
                >
                  Applicable To
                </label>
                <select
                  id="coupon-service-type"
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="all">All Services</option>
                  <option value="ac_repair">AC Repair</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>

              <button
                type="submit"
                className="text-on-primary w-full rounded-xl bg-[var(--color-primary)] py-4 font-bold transition-all hover:bg-[#a40017]"
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
