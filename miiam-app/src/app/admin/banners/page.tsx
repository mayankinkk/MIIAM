"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeGradientClass } from "@/lib/gradient-utils";
import ImageUpload from "@/components/ImageUpload";
import BlurImage from "@/components/BlurImage";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  gradient: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  position: number;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function BannerManagement() {
  const supabase = useMemo(() => createClient(), []);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: "",
    subtitle: "",
    badge: "",
    gradient: "from-primary to-primary-container",
    image_url: "",
    link_url: "",
  });

  async function loadBanners() {
    const { data } = await supabase.from("banners").select("*").order("position");
    if (data)
      setBanners(data.map((b: Banner) => ({ ...b, gradient: normalizeGradientClass(b.gradient) })));
    setLoading(false);
  }

  useEffect(() => {
    loadBanners();

    const channel = supabase
      .channel("banners-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => {
        loadBanners();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function addBanner() {
    if (!newBanner.title) return;
    const { data, error } = await supabase
      .from("banners")
      .insert([
        {
          title: newBanner.title,
          subtitle: newBanner.subtitle,
          badge: newBanner.badge,
          gradient: newBanner.gradient,
          image_url: newBanner.image_url,
          link_url: newBanner.link_url || null,
          is_active: true,
          position: banners.length + 1,
        },
      ])
      .select()
      .single();
    if (!error && data) {
      setBanners([...banners, data]);
      setShowAdd(false);
      setNewBanner({
        title: "",
        subtitle: "",
        badge: "",
        gradient: "from-primary to-primary-container",
        image_url: "",
        link_url: "",
      });
    }
  }

  async function toggleBanner(id: string, isActive: boolean) {
    await supabase.from("banners").update({ is_active: !isActive }).eq("id", id);
    loadBanners();
  }

  async function deleteBanner(id: string) {
    await supabase.from("banners").delete().eq("id", id);
    setBanners(banners.filter((b) => b.id !== id));
  }

  async function reorderBanners(fromIndex: number, toIndex: number) {
    const newBanners = [...banners];
    const [moved] = newBanners.splice(fromIndex, 1);
    newBanners.splice(toIndex, 0, moved);
    setBanners(newBanners);

    for (let i = 0; i < newBanners.length; i++) {
      await supabase
        .from("banners")
        .update({ position: i + 1 })
        .eq("id", newBanners[i].id);
    }
  }

  if (loading) return <div className="px-8">Loading banners...</div>;

  return (
    <div className="space-y-8 px-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Banner Management
          </h1>
          <p className="text-[var(--color-outline)]">Manage homepage banners and carousels.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="text-on-primary rounded-xl bg-[var(--color-primary)] px-6 py-3 font-bold shadow-lg shadow-red-900/10 transition-all hover:scale-105 active:scale-95"
        >
          + Add Banner
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="mb-1 text-xs font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
            Total Banners
          </p>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{banners.length}</p>
        </div>
        <div className="rounded-3xl border border-green-100 bg-green-50 p-6 shadow-sm dark:border-green-800/30 dark:bg-green-900/20">
          <p className="mb-1 text-xs font-black tracking-widest text-green-600 uppercase dark:text-green-400">
            Active
          </p>
          <p className="text-3xl font-black text-green-600 dark:text-green-400">
            {banners.filter((b) => b.is_active).length}
          </p>
        </div>
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="mb-1 text-xs font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
            Inactive
          </p>
          <p className="text-3xl font-black text-[var(--color-outline-variant)]">
            {banners.filter((b) => !b.is_active).length}
          </p>
        </div>
      </div>

      {/* Banner Reorder */}
      <div className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="border-b border-[var(--color-border-subtle)] p-4">
          <h2 className="text-sm font-black tracking-widest text-[var(--color-on-surface)] uppercase">
            Active Banners (Drag to reorder)
          </h2>
        </div>
        <div className="divide-y divide-slate-50">
          {banners
            .filter((b) => b.is_active)
            .map((banner, index) => (
              <div
                key={banner.id}
                className="flex items-center gap-4 p-4 hover:bg-[var(--color-surface-subtle)]"
              >
                <div className="cursor-move text-[var(--color-outline-variant)]">
                  <span className="material-symbols-outlined">drag_indicator</span>
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-surface-container-high)] text-xs font-bold">
                  {index + 1}
                </span>
                <div className="h-16 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                  {banner.image_url ? (
                    <BlurImage
                      src={banner.image_url}
                      alt={`Banner: ${banner.title || "Untitled"}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`h-full w-full bg-gradient-to-r ${banner.gradient || "from-primary to-primary-container"}`}
                    />
                  )}
                </div>
                <div className="flex-1">
                  {banner.badge && (
                    <span className="rounded bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">
                      {banner.badge}
                    </span>
                  )}
                  <p className="font-bold text-[var(--color-on-surface)]">{banner.title}</p>
                  {banner.subtitle && (
                    <p className="text-xs text-[var(--color-outline-variant)]">{banner.subtitle}</p>
                  )}
                  {banner.link_url && (
                    <p className="truncate text-xs text-[var(--color-outline-variant)]">
                      {banner.link_url}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleBanner(banner.id, banner.is_active)}
                    className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => deleteBanner(banner.id)}
                    className="p-2 text-[var(--color-outline-variant)] hover:text-red-500"
                    aria-label={`Delete banner: ${banner.title}`}
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          {banners.filter((b) => b.is_active).length === 0 && (
            <div className="p-8 text-center text-[var(--color-outline-variant)]">
              No active banners
            </div>
          )}
        </div>
      </div>

      {/* Inactive Banners */}
      <div className="overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] shadow-sm">
        <div className="border-b border-[var(--color-border-subtle)] p-4">
          <h2 className="text-sm font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
            Inactive Banners
          </h2>
        </div>
        <div className="divide-y divide-slate-50">
          {banners
            .filter((b) => !b.is_active)
            .map((banner) => (
              <div key={banner.id} className="flex items-center gap-4 p-4 opacity-60">
                <div className="h-16 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                  {banner.image_url ? (
                    <BlurImage
                      src={banner.image_url}
                      alt={`Banner: ${banner.title || "Untitled"}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`h-full w-full bg-gradient-to-r ${banner.gradient || "from-primary to-primary-container"}`}
                    />
                  )}
                </div>
                <div className="flex-1">
                  {banner.badge && (
                    <span className="rounded bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">
                      {banner.badge}
                    </span>
                  )}
                  <p className="font-bold text-[var(--color-on-surface)]">{banner.title}</p>
                  {banner.subtitle && (
                    <p className="text-xs text-[var(--color-outline-variant)]">{banner.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleBanner(banner.id, banner.is_active)}
                    className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-600"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => deleteBanner(banner.id)}
                    className="p-2 text-[var(--color-outline-variant)] hover:text-red-500"
                    aria-label={`Delete banner: ${banner.title}`}
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            ))}
          {banners.filter((b) => !b.is_active).length === 0 && (
            <div className="p-4 text-center text-sm text-[var(--color-outline-variant)]">
              No inactive banners
            </div>
          )}
        </div>
      </div>

      {/* Add Banner Modal */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="banner-modal-title"
          onKeyDown={(e) => e.key === "Escape" && setShowAdd(false)}
        >
          <div className="w-full max-w-md rounded-3xl bg-[var(--color-surface-container-lowest)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] p-6">
              <h2
                id="banner-modal-title"
                className="text-xl font-black text-[var(--color-on-surface)]"
              >
                Add Banner
              </h2>
              <button
                onClick={() => setShowAdd(false)}
                className="text-[var(--color-outline-variant)] hover:text-[var(--color-on-surface-variant)]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label
                  htmlFor="banner-badge"
                  className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase"
                >
                  Badge (optional)
                </label>
                <input
                  id="banner-badge"
                  value={newBanner.badge}
                  onChange={(e) => setNewBanner({ ...newBanner, badge: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                  placeholder="e.g. FLASH SALE, NEW USER"
                />
              </div>
              <div>
                <label
                  htmlFor="banner-title"
                  className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase"
                >
                  Title
                </label>
                <input
                  id="banner-title"
                  value={newBanner.title}
                  onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                  placeholder="Banner title"
                />
              </div>
              <div>
                <label
                  htmlFor="banner-subtitle"
                  className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase"
                >
                  Subtitle (optional)
                </label>
                <input
                  id="banner-subtitle"
                  value={newBanner.subtitle}
                  onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                  placeholder="e.g. On orders above ₹299"
                />
              </div>
              <div>
                <label
                  htmlFor="banner-gradient"
                  className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase"
                >
                  Gradient
                </label>
                <select
                  id="banner-gradient"
                  value={newBanner.gradient}
                  onChange={(e) => setNewBanner({ ...newBanner, gradient: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                >
                  <option value="from-primary to-primary-container">Primary</option>
                  <option value="from-orange-500 to-red-500">Orange-Red</option>
                  <option value="from-green-500 to-emerald-500">Green</option>
                  <option value="from-accent to-accent/70">MIIAM Green</option>
                  <option value="from-deal to-deal/70">Deal Orange</option>
                  <option value="from-amber-500 to-yellow-300">Amber-Yellow</option>
                  <option value="from-pink-500 to-rose-400">Pink-Rose</option>
                  <option value="from-teal-500 to-cyan-400">Teal-Cyan</option>
                </select>
                <div className={`mt-2 h-8 rounded-lg bg-gradient-to-r ${newBanner.gradient}`} />
              </div>
              <ImageUpload
                value={newBanner.image_url}
                onChange={(url) => setNewBanner({ ...newBanner, image_url: url })}
                bucket="menu-images"
                folder="banners"
                label="Banner Image (optional — gradient used if no image)"
                previewHeight="h-32"
              />
              <div>
                <label
                  htmlFor="banner-link"
                  className="mb-1 block text-xs font-bold text-[var(--color-outline-variant)] uppercase"
                >
                  Link (optional)
                </label>
                <input
                  id="banner-link"
                  value={newBanner.link_url}
                  onChange={(e) => setNewBanner({ ...newBanner, link_url: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)]/10 focus:outline-none"
                  placeholder="/app/vendor/123"
                />
              </div>
              <button
                onClick={addBanner}
                className="text-on-primary w-full rounded-xl bg-[var(--color-primary)] py-3 font-bold hover:bg-[#a00018]"
              >
                Add Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
