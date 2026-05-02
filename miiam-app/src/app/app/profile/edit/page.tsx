"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
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
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
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
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

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
      <div className="min-h-screen bg-[#fff4f4] flex justify-center pt-32">
        <div className="w-8 h-8 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <header className="fixed top-0 w-full z-50 flex items-center px-6 py-4 bg-[#fff4f4]/80 backdrop-blur-2xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
        <Link href="/app/profile" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ffe1e4] transition-all mr-4">
          <span className="material-symbols-outlined text-[#ba001c]">arrow_back</span>
        </Link>
        <span className="text-xl font-extrabold tracking-tight text-[#4d212a]">Edit Profile</span>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-[#f95630]/10 border border-[#f95630]/30 rounded-xl text-[#b02500] text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-[0px_10px_30px_rgba(77,33,42,0.04)] space-y-6">
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center border-b border-[#dd9ca6]/20 pb-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-[#ffe1e4] flex items-center justify-center text-[#ba001c] text-3xl font-bold mb-3 overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  formData.fullName?.charAt(0).toUpperCase() || "U"
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="w-6 h-6 border-2 border-[#ba001c] border-t-transparent rounded-full animate-spin" />
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
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-[#0b50d5] text-sm font-bold hover:underline disabled:opacity-50">
                {uploading ? "Uploading..." : "Change Photo"}
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#814c55] uppercase tracking-widest mb-2 px-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-[#ffecee] border-none rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#ba001c]/40 font-medium text-[#4d212a]"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#814c55] uppercase tracking-widest mb-2 px-1">Email Address</label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full bg-[#f8f9fa] border-none rounded-xl px-5 py-4 text-[#814c55] cursor-not-allowed opacity-70 font-medium"
              />
              <p className="text-[10px] text-[#814c55] mt-2 px-1 font-medium">Email address cannot be changed from this screen.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#814c55] uppercase tracking-widest mb-2 px-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#ffecee] border-none rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#ba001c]/40 font-medium text-[#4d212a]"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full bento-gradient-red text-white py-5 rounded-xl font-extrabold text-lg shadow-lg shadow-[#ba001c]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : "Save Changes"}
          </button>
        </form>
      </main>
    </>
  );
}
