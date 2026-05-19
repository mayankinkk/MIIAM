"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient();
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
      setCoupons(data.map(c => ({
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
    if (confirm("Are you sure you want to delete this coupon?")) {
      await supabase.from("promo_codes").delete().eq("id", id);
      loadCoupons();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#ba001c] to-[#8a0014] text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Coupons & Promotions</h1>
            <p className="text-white/80">Manage promo codes and discounts</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-[#ba001c] px-6 py-3 rounded-xl font-bold hover:bg-white/90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Create Coupon
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 -mt-8">
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="text-sm text-slate-500 mb-1">Total Coupons</div>
          <div className="text-2xl font-black text-slate-800">{coupons.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="text-sm text-slate-500 mb-1">Active Coupons</div>
          <div className="text-2xl font-black text-green-600">{activeCoupons}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="text-sm text-slate-500 mb-1">Total Uses</div>
          <div className="text-2xl font-black text-slate-800">
            {coupons.reduce((s, c) => s + c.used_count, 0)}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="text-sm text-slate-500 mb-1">Total Discount Given</div>
          <div className="text-2xl font-black text-[#ba001c]">₹{totalDiscount.toLocaleString()}</div>
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
                  ? "bg-[#ba001c] text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Code</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Discount</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Min Order</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Usage</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Valid Until</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Status</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-slate-50 hover:bg-pink-50/30">
                  <td className="p-4">
                    <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
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
                      <span className="text-xs text-slate-400 ml-1">
                        (max ₹{coupon.max_discount})
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-600">₹{coupon.min_order}</td>
                  <td className="p-4">
                    <div className="w-24 bg-slate-100 rounded-full h-2 mb-1">
                      <div
                        className="bg-[#ba001c] h-2 rounded-full"
                        style={{
                          width: `${(coupon.used_count / coupon.usage_limit) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {coupon.used_count}/{coupon.usage_limit}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 text-sm">
                    {new Date(coupon.valid_until).toLocaleDateString("en-IN")}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-bold ${
                        coupon.status === "active"
                          ? "bg-green-100 text-green-700"
                          : coupon.status === "exhausted"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
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
                      className="text-[#ba001c] font-bold text-sm hover:underline mr-3"
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
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-800">
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCoupon(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#ba001c] focus:ring-2 focus:ring-[#ba001c]/20 outline-none"
                  placeholder="e.g. SUMMER20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as any })
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#ba001c] outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: parseInt(e.target.value) })
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#ba001c] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Min Order (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.min_order}
                    onChange={(e) =>
                      setFormData({ ...formData, min_order: parseInt(e.target.value) })
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#ba001c] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Max Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) =>
                      setFormData({ ...formData, max_discount: parseInt(e.target.value) })
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#ba001c] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_from: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#ba001c] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#ba001c] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Usage Limit
                </label>
                <input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) =>
                    setFormData({ ...formData, usage_limit: parseInt(e.target.value) })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#ba001c] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Applicable To
                </label>
                <select
                  value={formData.service_type}
                  onChange={(e) =>
                    setFormData({ ...formData, service_type: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-[#ba001c] outline-none"
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
                className="w-full py-4 bg-[#ba001c] text-white rounded-xl font-bold hover:bg-[#a40017] transition-all"
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