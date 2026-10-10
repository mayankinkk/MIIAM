"use client";

import { useMemo, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import BlurImage from "@/components/BlurImage";

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  author: string;
  read_time: number;
  views: number;
  published: boolean;
  created_at: string;
};

const categories = ["All", "AC Care", "Plumbing", "Beauty", "Electrical", "Cleaning", "General"];

export default function BlogAdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("General");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formAuthor, setFormAuthor] = useState("MIIAM Team");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPosts(data as BlogPost[]);
    setLoading(false);
  }

  const openCreateModal = () => {
    setEditingPost(null);
    setFormTitle("");
    setFormCategory("General");
    setFormExcerpt("");
    setFormContent("");
    setFormImage("");
    setFormAuthor("MIIAM Team");
    setShowModal(true);
  };

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post);
    setFormTitle(post.title);
    setFormCategory(post.category);
    setFormExcerpt(post.excerpt);
    setFormContent(post.content || "");
    setFormImage(post.image);
    setFormAuthor(post.author);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      useToastStore.getState().addToast("Please enter a title", "error");
      return;
    }
    setSaving(true);
    try {
      if (editingPost) {
        const { error } = await supabase
          .from("blog_posts")
          .update({
            title: formTitle.trim(),
            category: formCategory,
            excerpt: formExcerpt.trim(),
            content: formContent.trim(),
            image: formImage.trim(),
            author: formAuthor.trim(),
          })
          .eq("id", editingPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert({
          title: formTitle.trim(),
          category: formCategory,
          excerpt: formExcerpt.trim(),
          content: formContent.trim(),
          image: formImage.trim(),
          author: formAuthor.trim(),
          published: false,
          views: 0,
          read_time: Math.max(1, Math.ceil(formContent.split(" ").length / 200)),
        });
        if (error) throw error;
      }
      setShowModal(false);
      loadPosts();
    } catch (err: unknown) {
      useToastStore
        .getState()
        .addToast(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      await supabase.from("blog_posts").update({ published: !post.published }).eq("id", post.id);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, published: !p.published } : p))
      );
    } catch (err: unknown) {
      useToastStore
        .getState()
        .addToast(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await supabase.from("blog_posts").delete().eq("id", id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      useToastStore
        .getState()
        .addToast(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchCategory = activeCategory === "All" || post.category === activeCategory;
    const matchSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);
  const publishedCount = posts.filter((p) => p.published).length;

  return (
    <div className="min-h-screen bg-[var(--color-surface-subtle)]">
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Blog & Tips</h1>
            <p className="text-white/80">Maintenance guides and helpful articles</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-surface-container-lowest)] px-6 py-3 font-bold text-green-600 transition-all hover:bg-[var(--color-surface-container-lowest)]/90"
          >
            <span className="material-symbols-outlined">add</span>
            New Article
          </button>
        </div>
      </div>

      <div className="-mt-8 grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-lg">
          <div className="mb-1 text-sm text-[var(--color-outline)]">Total Articles</div>
          <div className="text-2xl font-black text-[var(--color-on-surface)]">{posts.length}</div>
        </div>
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-lg">
          <div className="mb-1 text-sm text-[var(--color-outline)]">Published</div>
          <div className="text-2xl font-black text-green-600">{publishedCount}</div>
        </div>
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-lg">
          <div className="mb-1 text-sm text-[var(--color-outline)]">Total Views</div>
          <div className="text-2xl font-black text-[var(--color-on-surface)]">
            {totalViews.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-lg">
          <div className="mb-1 text-sm text-[var(--color-outline)]">Avg Views</div>
          <div className="text-2xl font-black text-[var(--color-on-surface)]">
            {posts.length > 0 ? Math.round(totalViews / posts.length).toLocaleString() : "0"}
          </div>
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-green-600 text-white"
                    : "border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-outline-variant)]">
              search
            </span>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search blog articles"
              className="w-full rounded-xl border border-[var(--color-border-subtle)] py-2 pr-4 pl-10 focus:border-green-500 focus:outline-none md:w-64"
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">
              article
            </span>
            <p className="mt-3 font-medium text-[var(--color-outline-variant)]">No articles yet</p>
            <button
              onClick={openCreateModal}
              className="mt-4 text-sm font-bold text-green-600 hover:underline"
            >
              Create your first article
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="overflow-hidden rounded-2xl bg-[var(--color-surface-container-lowest)] shadow-lg transition-shadow hover:shadow-xl"
              >
                <div className="relative h-40">
                  {post.image ? (
                    <BlurImage
                      src={post.image}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100">
                      <span className="material-symbols-outlined text-4xl text-green-300">
                        image
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-[var(--color-surface-container-lowest)]/90 px-2 py-1 text-xs font-bold text-[var(--color-on-surface)] backdrop-blur">
                      {post.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => togglePublish(post)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        post.published
                          ? "bg-green-500 text-white"
                          : "bg-[var(--color-surface-container-high)] text-[var(--color-outline)]"
                      }`}
                      aria-label={
                        post.published ? `Unpublish: ${post.title}` : `Publish: ${post.title}`
                      }
                    >
                      <span className="material-symbols-outlined text-sm">
                        {post.published ? "visibility" : "visibility_off"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="mb-2 line-clamp-2 font-bold text-[var(--color-on-surface)]">
                    {post.title}
                  </h3>
                  <p className="mb-3 line-clamp-2 text-sm text-[var(--color-outline)]">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-xs text-[var(--color-outline-variant)]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {post.read_time || 5} min read
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      {post.views || 0}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-[var(--color-border-subtle)] pt-4">
                    <button
                      onClick={() => openEditModal(post)}
                      className="flex-1 text-sm font-bold text-green-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="flex-1 text-sm font-bold text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="blog-modal-title"
          onKeyDown={(e) => e.key === "Escape" && setShowModal(false)}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[var(--color-surface-container-lowest)]">
            <div className="border-b border-[var(--color-border-subtle)] p-6">
              <div className="flex items-center justify-between">
                <h2
                  id="blog-modal-title"
                  className="text-xl font-black text-[var(--color-on-surface)]"
                >
                  {editingPost ? "Edit Article" : "Create New Article"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--color-surface-container)]"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                    close
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-bold text-[var(--color-on-surface)]">
                  Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 outline-none focus:border-green-500"
                  placeholder="Enter article title"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[var(--color-on-surface)]">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 outline-none focus:border-green-500"
                >
                  {categories
                    .filter((c) => c !== "All")
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[var(--color-on-surface)]">
                  Excerpt
                </label>
                <textarea
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                  className="w-full resize-none rounded-xl border border-[var(--color-border-subtle)] p-3 outline-none focus:border-green-500"
                  rows={3}
                  placeholder="Short description..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[var(--color-on-surface)]">
                  Content
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full resize-none rounded-xl border border-[var(--color-border-subtle)] p-3 outline-none focus:border-green-500"
                  rows={6}
                  placeholder="Full article content..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[var(--color-on-surface)]">
                  Featured Image URL
                </label>
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 outline-none focus:border-green-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-[var(--color-on-surface)]">
                  Author
                </label>
                <input
                  type="text"
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-subtle)] p-3 outline-none focus:border-green-500"
                  placeholder="Author name"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl bg-green-600 py-4 font-bold text-white transition-all hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingPost ? "Update Article" : "Publish Article"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
