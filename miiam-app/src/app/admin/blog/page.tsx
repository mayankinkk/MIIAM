"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient();
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
      alert("Please enter a title");
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
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      await supabase
        .from("blog_posts")
        .update({ published: !post.published })
        .eq("id", post.id);
      setPosts(prev =>
        prev.map(p => (p.id === post.id ? { ...p, published: !p.published } : p))
      );
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await supabase.from("blog_posts").delete().eq("id", id);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchCategory = activeCategory === "All" || post.category === activeCategory;
    const matchSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);
  const publishedCount = posts.filter(p => p.published).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Blog & Tips</h1>
            <p className="text-white/80">Maintenance guides and helpful articles</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-white/90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            New Article
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 -mt-8">
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="text-sm text-slate-500 mb-1">Total Articles</div>
          <div className="text-2xl font-black text-slate-800">{posts.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="text-sm text-slate-500 mb-1">Published</div>
          <div className="text-2xl font-black text-green-600">{publishedCount}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="text-sm text-slate-500 mb-1">Total Views</div>
          <div className="text-2xl font-black text-slate-800">{totalViews.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-lg">
          <div className="text-sm text-slate-500 mb-1">Avg Views</div>
          <div className="text-2xl font-black text-slate-800">
            {posts.length > 0 ? Math.round(totalViews / posts.length).toLocaleString() : "0"}
          </div>
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-green-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500 w-full md:w-64"
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300">article</span>
            <p className="text-slate-400 font-medium mt-3">No articles yet</p>
            <button onClick={openCreateModal} className="mt-4 text-green-600 font-bold text-sm hover:underline">
              Create your first article
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative h-40">
                  {post.image ? (
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-green-300">image</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-bold text-slate-700">
                      {post.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => togglePublish(post)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        post.published ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {post.published ? "visibility" : "visibility_off"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-slate-800 mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{post.excerpt}</p>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {post.read_time || 5} min read
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      {post.views || 0}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => openEditModal(post)}
                      className="flex-1 text-green-600 font-bold text-sm hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="flex-1 text-red-500 font-bold text-sm hover:underline"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">
                  {editingPost ? "Edit Article" : "Create New Article"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-slate-400">close</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-green-500 outline-none"
                  placeholder="Enter article title"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-green-500 outline-none"
                >
                  {categories.filter(c => c !== "All").map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Excerpt</label>
                <textarea
                  value={formExcerpt}
                  onChange={e => setFormExcerpt(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-green-500 outline-none resize-none"
                  rows={3}
                  placeholder="Short description..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Content</label>
                <textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-green-500 outline-none resize-none"
                  rows={6}
                  placeholder="Full article content..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Featured Image URL</label>
                <input
                  type="text"
                  value={formImage}
                  onChange={e => setFormImage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-green-500 outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Author</label>
                <input
                  type="text"
                  value={formAuthor}
                  onChange={e => setFormAuthor(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-green-500 outline-none"
                  placeholder="Author name"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50"
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
