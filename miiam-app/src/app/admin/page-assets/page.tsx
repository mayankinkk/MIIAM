"use client";

import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/ImageUpload";
import BlurImage from "@/components/BlurImage";

interface PageAsset {
  id: string;
  section: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  is_active: boolean;
  updated_at: string;
}

const SECTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  food_hero: {
    label: "Food Page Hero",
    icon: "restaurant",
    color: "bg-orange-50 border-orange-200",
  },
  home_hero: { label: "Home Page Hero", icon: "home", color: "bg-accent/10 border-accent/30" },
  grocery_hero: {
    label: "Grocery Page Hero",
    icon: "local_grocery_store",
    color: "bg-green-50 border-green-200",
  },
};

const DEFAULT_SECTIONS = Object.keys(SECTION_LABELS);

export default function PageAssetsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [assets, setAssets] = useState<PageAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAsset, setEditingAsset] = useState<PageAsset | null>(null);
  const [editForm, setEditForm] = useState({
    image_url: "",
    title: "",
    subtitle: "",
    is_active: true,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState({ section: "", image_url: "", title: "", subtitle: "" });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadAssets = async () => {
    const { data } = await supabase.from("page_assets").select("*").order("section");
    if (data) setAssets(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleEdit = (asset: PageAsset) => {
    setEditingAsset(asset);
    setEditForm({
      image_url: asset.image_url,
      title: asset.title || "",
      subtitle: asset.subtitle || "",
      is_active: asset.is_active,
    });
  };

  const handleSave = async () => {
    if (!editingAsset) return;
    setSaving(true);
    const { error } = await supabase
      .from("page_assets")
      .update({
        image_url: editForm.image_url,
        title: editForm.title || null,
        subtitle: editForm.subtitle || null,
        is_active: editForm.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingAsset.id);

    setSaving(false);
    if (!error) {
      setSaveSuccess(editingAsset.section);
      setEditingAsset(null);
      await loadAssets();
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  const handleAdd = async () => {
    if (!newForm.section || !newForm.image_url) return;
    setSaving(true);
    const { error } = await supabase.from("page_assets").upsert(
      {
        section: newForm.section.toLowerCase().replace(/\s+/g, "_"),
        image_url: newForm.image_url,
        title: newForm.title || null,
        subtitle: newForm.subtitle || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "section" }
    );
    setSaving(false);
    if (!error) {
      setShowAddModal(false);
      setNewForm({ section: "", image_url: "", title: "", subtitle: "" });
      await loadAssets();
    }
  };

  const handleToggleActive = async (asset: PageAsset) => {
    await supabase.from("page_assets").update({ is_active: !asset.is_active }).eq("id", asset.id);
    await loadAssets();
  };

  const handleDelete = async (asset: PageAsset) => {
    if (
      !confirm(
        `Delete "${SECTION_LABELS[asset.section]?.label || asset.section}"? This cannot be undone.`
      )
    )
      return;
    await supabase.from("page_assets").delete().eq("id", asset.id);
    await loadAssets();
  };

  const missingSections = DEFAULT_SECTIONS.filter((s) => !assets.some((a) => a.section === s));

  if (loading) {
    return (
      <div className="flex items-center justify-center px-8 py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 px-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Content Manager
          </h1>
          <p className="text-[var(--color-outline)]">
            Control hero banners and images shown to customers on each page.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-on-primary rounded-xl bg-[var(--color-primary)] px-6 py-3 font-bold shadow-lg shadow-red-900/10 transition-all hover:scale-105 active:scale-95"
        >
          + Add Section
        </button>
      </div>

      {/* Success toast */}
      {saveSuccess && (
        <div className="animate-pop-in fixed top-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-green-500 px-6 py-3 font-bold text-white shadow-lg">
          <span className="material-symbols-outlined">check_circle</span>
          {SECTION_LABELS[saveSuccess]?.label || saveSuccess} updated!
        </div>
      )}

      {/* Missing sections notice */}
      {missingSections.length > 0 && (
        <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <span className="material-symbols-outlined mt-0.5 flex-shrink-0 text-2xl text-amber-500">
            warning
          </span>
          <div>
            <p className="mb-1 font-bold text-amber-800">
              Some page sections don't have assets yet
            </p>
            <p className="text-sm text-amber-700">
              Missing: {missingSections.map((s) => SECTION_LABELS[s]?.label || s).join(", ")}
            </p>
            <p className="mt-1 text-xs text-amber-600">
              Run the SQL migration first, then they'll appear here automatically.
            </p>
          </div>
        </div>
      )}

      {/* Assets grid */}
      <div className="space-y-6">
        {assets.map((asset) => {
          const meta = SECTION_LABELS[asset.section];
          return (
            <div
              key={asset.id}
              className={`overflow-hidden rounded-3xl border bg-[var(--color-surface-container-lowest)] shadow-sm ${meta?.color || "border-[var(--color-border-subtle)]"}`}
            >
              <div className="flex flex-col md:flex-row">
                {/* Preview */}
                <div className="relative h-48 flex-shrink-0 bg-[var(--color-surface-container)] md:h-auto md:w-72">
                  <BlurImage
                    src={asset.image_url}
                    alt={asset.title || asset.section}
                    className="h-full w-full object-cover"
                    fill
                  />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-4">
                    {asset.title && (
                      <p className="text-lg leading-tight font-black text-white">{asset.title}</p>
                    )}
                    {asset.subtitle && (
                      <p className="mt-0.5 text-xs text-white/80">{asset.subtitle}</p>
                    )}
                  </div>
                  {!asset.is_active && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-container-lowest)]/70">
                      <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-600">
                        INACTIVE
                      </span>
                    </div>
                  )}
                </div>

                {/* Info & Controls */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-container)]">
                        <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">
                          {meta?.icon || "image"}
                        </span>
                      </div>
                      <div>
                        <p className="font-black text-[var(--color-on-surface)]">
                          {meta?.label || asset.section}
                        </p>
                        <p className="font-mono text-xs text-[var(--color-outline-variant)]">
                          {asset.section}
                        </p>
                      </div>
                      <div
                        className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${asset.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-[var(--color-surface-container)] text-[var(--color-outline)]"}`}
                      >
                        {asset.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>

                    <div className="space-y-2 rounded-xl bg-[var(--color-surface-subtle)] p-4">
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-[var(--color-outline-variant)] uppercase">
                          Image URL
                        </p>
                        <p className="truncate font-mono text-sm text-[var(--color-on-surface)]">
                          {asset.image_url}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-[var(--color-outline-variant)] uppercase">
                            Title
                          </p>
                          <p className="text-sm text-[var(--color-on-surface)]">
                            {asset.title || (
                              <span className="text-[var(--color-outline-variant)]/60 italic">
                                none
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-[var(--color-outline-variant)] uppercase">
                            Subtitle
                          </p>
                          <p className="text-sm text-[var(--color-on-surface)]">
                            {asset.subtitle || (
                              <span className="text-[var(--color-outline-variant)]/60 italic">
                                none
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] text-[var(--color-outline-variant)]/60">
                        Updated: {new Date(asset.updated_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => handleEdit(asset)}
                      className="text-on-primary flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-bold transition-all hover:bg-[#a00018] active:scale-95"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(asset)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:scale-95 ${
                        asset.is_active
                          ? "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-red-50 hover:text-red-600"
                          : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                      }`}
                    >
                      {asset.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(asset)}
                      className="rounded-xl bg-[var(--color-surface-container)] px-4 py-2.5 text-sm font-bold text-[var(--color-on-surface-variant)] transition-all hover:bg-red-50 hover:text-red-600 active:scale-95"
                      aria-label={`Delete ${SECTION_LABELS[asset.section]?.label || asset.section}`}
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {assets.length === 0 && (
          <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-16 text-center">
            <span className="material-symbols-outlined mb-3 block text-4xl text-[var(--color-outline-variant)]/60">
              image_not_supported
            </span>
            <p className="font-bold text-[var(--color-outline)]">No page assets found.</p>
            <p className="mt-1 text-sm text-[var(--color-outline-variant)]">
              Run the SQL migration to create the page_assets table first.
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-[var(--color-surface-container-lowest)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] p-6">
              <div>
                <h2 className="text-xl font-black text-[var(--color-on-surface)]">
                  Edit {SECTION_LABELS[editingAsset.section]?.label || editingAsset.section}
                </h2>
                <p className="mt-0.5 font-mono text-xs text-[var(--color-outline-variant)]">
                  {editingAsset.section}
                </p>
              </div>
              <button
                onClick={() => setEditingAsset(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container)]"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-4 p-6">
              {/* Live preview */}
              {editForm.image_url && (
                <div className="relative h-36 overflow-hidden rounded-2xl bg-[var(--color-surface-container)]">
                  <BlurImage
                    src={editForm.image_url}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    fill
                  />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-4">
                    {editForm.title && <p className="font-black text-white">{editForm.title}</p>}
                    {editForm.subtitle && (
                      <p className="text-xs text-white/80">{editForm.subtitle}</p>
                    )}
                  </div>
                </div>
              )}

              <ImageUpload
                value={editForm.image_url}
                onChange={(url) => setEditForm({ ...editForm, image_url: url })}
                bucket="menu-images"
                folder="page-assets"
                label="Hero Image"
                previewHeight="h-32"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold tracking-widest text-[var(--color-outline)] uppercase">
                    Title
                  </label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full rounded-xl bg-[var(--color-surface-subtle)] px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
                    placeholder="e.g. Gourmet Selection"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold tracking-widest text-[var(--color-outline)] uppercase">
                    Subtitle
                  </label>
                  <input
                    value={editForm.subtitle}
                    onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                    className="w-full rounded-xl bg-[var(--color-surface-subtle)] px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
                    placeholder="e.g. Order from top restaurants"
                  />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-3">
                <div
                  onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}
                  className={`h-7 w-12 cursor-pointer rounded-full p-1 transition-colors ${editForm.is_active ? "bg-green-500" : "bg-[var(--color-surface-container-high)]"}`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-[var(--color-surface-container-lowest)] shadow transition-transform ${editForm.is_active ? "translate-x-5" : ""}`}
                  />
                </div>
                <span className="text-sm font-semibold text-[var(--color-on-surface)]">
                  {editForm.is_active ? "Active (shown to users)" : "Inactive (hidden)"}
                </span>
              </label>
            </div>

            <div className="flex gap-3 border-t border-[var(--color-border-subtle)] p-6">
              <button
                onClick={() => setEditingAsset(null)}
                className="flex-1 rounded-xl border border-[var(--color-border-subtle)] py-3 text-sm font-bold hover:bg-[var(--color-surface-subtle)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.image_url}
                className="text-on-primary flex-1 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold transition-all hover:bg-[#a00018] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--color-surface-container-lowest)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] p-6">
              <h2 className="text-xl font-black text-[var(--color-on-surface)]">
                Add Page Section
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-container)]"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-bold tracking-widest text-[var(--color-outline)] uppercase">
                  Section Key *
                </label>
                <input
                  value={newForm.section}
                  onChange={(e) => setNewForm({ ...newForm, section: e.target.value })}
                  className="w-full rounded-xl bg-[var(--color-surface-subtle)] px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
                  placeholder="e.g. food_hero, home_hero"
                />
                <p className="mt-1 text-[10px] text-[var(--color-outline-variant)]">
                  Use snake_case. Existing keys will be updated.
                </p>
              </div>
              <ImageUpload
                value={newForm.image_url}
                onChange={(url) => setNewForm({ ...newForm, image_url: url })}
                bucket="menu-images"
                folder="page-assets"
                label="Hero Image"
                previewHeight="h-32"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold tracking-widest text-[var(--color-outline)] uppercase">
                    Title
                  </label>
                  <input
                    value={newForm.title}
                    onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                    className="w-full rounded-xl bg-[var(--color-surface-subtle)] px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold tracking-widest text-[var(--color-outline)] uppercase">
                    Subtitle
                  </label>
                  <input
                    value={newForm.subtitle}
                    onChange={(e) => setNewForm({ ...newForm, subtitle: e.target.value })}
                    className="w-full rounded-xl bg-[var(--color-surface-subtle)] px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 border-t border-[var(--color-border-subtle)] p-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 rounded-xl border border-[var(--color-border-subtle)] py-3 text-sm font-bold hover:bg-[var(--color-surface-subtle)]"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !newForm.section || !newForm.image_url}
                className="text-on-primary flex-1 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-bold transition-all hover:bg-[#a00018] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Add Section"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
