"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import { useTranslation } from "@/lib/i18n/useTranslation";
import logger from "@/lib/logger";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";

export default function EditProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { addToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    avatarUrl: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/app/profile");
          return;
        }
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setFormData({
            fullName: profile.full_name || "",
            phone: profile.phone || "",
            email: profile.email || user.email || "",
            avatarUrl: profile.avatar_url || "",
          });
        }
      } catch (err) {
        logger.error({ err }, "Failed to load profile");
      }
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error(t.profile.selectImage);
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, avatarUrl: data.publicUrl }));
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim()) {
      addToast(t.profile.enterFullName, "error");
      return;
    }
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      addToast(t.profile.invalidPhone, "error");
      return;
    }
    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      addToast(t.profile.invalidEmail, "error");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      full_name: formData.fullName,
      phone: formData.phone,
      avatar_url: formData.avatarUrl,
    });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
    } else {
      router.push("/app/profile");
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="bg-surface flex min-h-screen justify-center pt-32">
        <div className="w-full max-w-lg space-y-6 px-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-surface-container h-24 w-24 animate-pulse rounded-full" />
            <div className="bg-surface-container h-4 w-32 animate-pulse rounded" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="bg-surface-container h-3 w-20 animate-pulse rounded" />
                <div className="bg-surface-container h-12 animate-pulse rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="bg-surface/80 fixed top-0 z-50 flex w-full items-center px-6 py-4 shadow-[0px_20px_40px_rgba(0,0,0,0.06)] backdrop-blur-2xl dark:bg-[var(--color-surface)]/80">
        <Link
          href="/app/profile"
          aria-label="Go back"
          className="hover:bg-surface-container mr-4 flex h-10 w-10 items-center justify-center rounded-full transition-all"
        >
          <span className="material-symbols-outlined text-accent">arrow_back</span>
        </Link>
        <span className="text-on-surface text-xl font-extrabold tracking-tight">
          {t.settings.editProfile}
        </span>
      </header>

      <Breadcrumbs
        items={[
          { label: "Home", href: "/app/home" },
          { label: "Profile", href: "/app/profile" },
          { label: "Edit Profile" },
        ]}
      />

      <main className="mx-auto max-w-2xl px-6 pt-24 pb-32">
        {error && (
          <div className="bg-error-container/10 text-error mb-6 rounded-xl border border-[#f95630]/30 p-4 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6 rounded-xl bg-[var(--color-surface-container-lowest)] p-6 shadow-[0px_10px_30px_rgba(0,0,0,0.04)] dark:bg-[var(--color-surface-container)]">
            {/* Avatar Upload */}
            <div className="border-outline-variant/20 mb-6 flex flex-col items-center justify-center border-b pb-6">
              <div
                className="bg-surface-container text-accent group relative mb-3 flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full text-3xl font-bold"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.avatarUrl ? (
                  <BlurImage
                    src={formData.avatarUrl}
                    alt="Avatar"
                    fill
                    className="h-full w-full"
                    sizes="96px"
                  />
                ) : (
                  formData.fullName?.charAt(0).toUpperCase() || "U"
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-container-lowest)]/60">
                    <span className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-secondary text-sm font-bold hover:underline disabled:opacity-50"
              >
                {uploading ? t.profile.uploading : t.profile.changePhoto}
              </button>
            </div>

            <div>
              <label
                htmlFor="full-name"
                className="text-on-surface-variant mb-2 block px-1 text-xs font-bold tracking-widest uppercase"
              >
                {t.profile.fullName}
              </label>
              <input
                id="full-name"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="bg-surface-container-low focus:ring-primary/40 text-on-surface w-full rounded-xl border-none px-5 py-4 font-medium focus:ring-2 focus:outline-none dark:bg-[var(--color-surface-container)] dark:text-[var(--color-on-surface)]"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="email-address"
                className="text-on-surface-variant mb-2 block px-1 text-xs font-bold tracking-widest uppercase"
              >
                {t.profile.emailAddress}
              </label>
              <input
                id="email-address"
                type="email"
                disabled
                value={formData.email}
                className="text-on-surface-variant w-full cursor-not-allowed rounded-xl border-none bg-[#f8f9fa] px-5 py-4 font-medium opacity-70 dark:bg-[var(--color-surface-container)] dark:text-[var(--color-outline)]"
              />
              <p className="text-on-surface-variant mt-2 px-1 text-[10px] font-medium">
                {t.profile.emailCannotChange}
              </p>
            </div>

            <div>
              <label
                htmlFor="phone-number"
                className="text-on-surface-variant mb-2 block px-1 text-xs font-bold tracking-widest uppercase"
              >
                {t.profile.phoneNumber}
              </label>
              <input
                id="phone-number"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-surface-container-low focus:ring-primary/40 text-on-surface w-full rounded-xl border-none px-5 py-4 font-medium focus:ring-2 focus:outline-none dark:bg-[var(--color-surface-container)] dark:text-[var(--color-on-surface)]"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="bento-gradient-red text-on-primary shadow-primary/20 flex w-full items-center justify-center gap-2 rounded-xl py-5 text-lg font-extrabold shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70"
          >
            {saving ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t.profile.saving}
              </>
            ) : (
              t.common.save
            )}
          </button>
        </form>
      </main>
    </>
  );
}
