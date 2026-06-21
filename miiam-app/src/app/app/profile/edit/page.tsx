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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/auth/login");
          return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

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
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, avatarUrl: data.publicUrl }));
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
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      addToast(t.profile.invalidPhone, "error");
      return;
    }
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      addToast(t.profile.invalidEmail, "error");
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({
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
      <div className="min-h-screen bg-surface dark:bg-[var(--color-surface)] flex justify-center pt-32">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <header className="fixed top-0 w-full z-50 flex items-center px-6 py-4 bg-surface/80 dark:bg-[var(--color-surface)]/80 backdrop-blur-2xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
        <Link href="/app/profile" aria-label="Go back" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-all mr-4">
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </Link>
        <span className="text-xl font-extrabold tracking-tight text-on-surface">{t.settings.editProfile}</span>
      </header>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Profile', href: '/app/profile' }, { label: 'Edit Profile' }]} />

      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-error-container/10 border border-[#f95630]/30 rounded-xl text-error text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] rounded-xl p-6 shadow-[0px_10px_30px_rgba(77,33,42,0.04)] space-y-6">
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center border-b border-outline-variant/20 pb-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center text-primary text-3xl font-bold mb-3 overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {formData.avatarUrl ? (
                  <BlurImage src={formData.avatarUrl} alt="Avatar" fill className="w-full h-full" sizes="96px" />
                ) : (
                  formData.fullName?.charAt(0).toUpperCase() || "U"
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-[var(--color-surface-container-lowest)]/60 flex items-center justify-center">
                    <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-secondary text-sm font-bold hover:underline disabled:opacity-50">
                {uploading ? t.profile.uploading : t.profile.changePhoto}
              </button>
            </div>

            <div>
              <label htmlFor="full-name" className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 px-1">{t.profile.fullName}</label>
              <input
                id="full-name"
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-surface-container-low dark:bg-[var(--color-surface-container)] border-none rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-on-surface dark:text-[var(--color-on-surface)]"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email-address" className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 px-1">{t.profile.emailAddress}</label>
              <input
                id="email-address"
                type="email"
                disabled
                value={formData.email}
                className="w-full bg-[#f8f9fa] dark:bg-[var(--color-surface-container)] border-none rounded-xl px-5 py-4 text-on-surface-variant dark:text-[var(--color-outline)] cursor-not-allowed opacity-70 font-medium"
              />
              <p className="text-[10px] text-on-surface-variant mt-2 px-1 font-medium">{t.profile.emailCannotChange}</p>
            </div>

            <div>
              <label htmlFor="phone-number" className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 px-1">{t.profile.phoneNumber}</label>
              <input
                id="phone-number"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-surface-container-low dark:bg-[var(--color-surface-container)] border-none rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium text-on-surface dark:text-[var(--color-on-surface)]"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full bento-gradient-red text-white py-5 rounded-xl font-extrabold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
          >
                {saving ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t.profile.saving}
                  </>
                ) : t.common.save}
          </button>
        </form>
      </main>
    </>
  );
}
