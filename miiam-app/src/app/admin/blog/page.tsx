"use client";

import { useState } from "react";
import Link from "next/link";

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  author: string;
  readTime: number;
  views: number;
  published: boolean;
  createdAt: string;
};

const mockPosts: BlogPost[] = [
  {
    id: "1",
    title: "How to Maintain Your AC During Summer",
    excerpt: "Keep your air conditioner running efficiently with these simple maintenance tips that will save you money on repairs.",
    category: "AC Care",
    image: "https://images.unsplash.com/photo-1631564591547-4d46fe7c9c0a?w=400&q=80",
    author: "MIIAM Team",
    readTime: 5,
    views: 1250,
    published: true,
    createdAt: "2024-05-15",
  },
  {
    id: "2",
    title: "5 Signs Your Plumbing Needs Attention",
    excerpt: "Don't wait for a major leak! Here are the warning signs that indicate your plumbing system needs professional help.",
    category: "Plumbing",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80",
    author: "MIIAM Team",
    readTime: 4,
    views: 890,
    published: true,
    createdAt: "2024-05-10",
  },
  {
    id: "3",
    title: "DIY Hair Spa: At-Home Treatments for Shiny Hair",
    excerpt: "Professional tips from our beauty experts on how to achieve salon-quality hair at home using simple ingredients.",
    category: "Beauty",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80",
    author: "Arti Singh",
    readTime: 6,
    views: 2100,
    published: true,
    createdAt: "2024-05-08",
  },
  {
    id: "4",
    title: "Electrical Safety: 8 Things Every Homeowner Should Know",
    excerpt: "Stay safe! Essential electrical safety tips that could prevent fires and protect your family.",
    category: "Electrical",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&q=80",
    author: "MIIAM Team",
    readTime: 7,
    views: 1560,
    published: true,
    createdAt: "2024-05-01",
  },
  {
    id: "5",
    title: "Deep Cleaning Checklist: Room by Room Guide",
    excerpt: "A comprehensive guide to deep cleaning your entire home, from kitchen to bathroom.",
    category: "Cleaning",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
    author: "MIIAM Team",
    readTime: 8,
    views: 980,
    published: false,
    createdAt: "2024-04-28",
  },
];

const categories = ["All", "AC Care", "Plumbing", "Beauty", "Electrical", "Cleaning"];

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>(mockPosts);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = posts.filter((post) => {
    const matchCategory = activeCategory === "All" || post.category === activeCategory;
    const matchSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const togglePublish = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, published: !p.published } : p))
    );
  };

  const deletePost = (id: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const totalViews = posts.reduce((s, p) => s + p.views, 0);
  const publishedCount = posts.filter((p) => p.published).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Blog & Tips</h1>
            <p className="text-white/80">Maintenance guides and helpful articles</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-green-600 px-6 py-3 rounded-xl font-bold hover:bg-white/90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            New Article
          </button>
        </div>
      </div>

      {/* Stats */}
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
            {Math.round(totalViews / posts.length).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-6 pb-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
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
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500 w-full md:w-64"
            />
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="px-6 pb-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="relative h-40">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-bold text-slate-700">
                    {post.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => togglePublish(post.id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      post.published
                        ? "bg-green-500 text-white"
                        : "bg-slate-200 text-slate-500"
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
                    {post.readTime} min read
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    {post.views}
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button className="flex-1 text-green-600 font-bold text-sm hover:underline">
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800">Create New Article</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-slate-400">close</span>
                </button>
              </div>
            </div>

            <form className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-green-500 outline-none"
                  placeholder="Enter article title"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                <select className="w-full p-3 rounded-xl border border-slate-200 focus:border-green-500 outline-none">
                  {categories.filter((c) => c !== "All").map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Excerpt</label>
                <textarea
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-green-500 outline-none resize-none"
                  rows={3}
                  placeholder="Short description..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Content</label>
                <textarea
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-green-500 outline-none resize-none"
                  rows={6}
                  placeholder="Full article content..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Featured Image</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300">image</span>
                  <p className="text-sm text-slate-400 mt-2">Click to upload or drag and drop</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all"
              >
                Publish Article
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}