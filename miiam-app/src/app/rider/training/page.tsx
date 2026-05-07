"use client";

import { useState } from "react";
import Link from "next/link";

interface Video {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  thumbnail: string;
  isWatched: boolean;
}

const videos: Video[] = [
  { id: "1", title: "Getting Started", description: "Learn the basics of the MIIAM rider app", duration: "5:30", category: "Basics", thumbnail: "🎯", isWatched: true },
  { id: "2", title: "Accepting Orders", description: "How to accept and manage delivery orders", duration: "4:15", category: "Basics", thumbnail: "📦", isWatched: true },
  { id: "3", title: "Delivery Best Practices", description: "Tips for efficient and safe deliveries", duration: "8:20", category: "Safety", thumbnail: "🚴", isWatched: false },
  { id: "4", title: "Customer Communication", description: "How to handle customer interactions", duration: "6:45", category: "Service", thumbnail: "💬", isWatched: false },
  { id: "5", title: "Safety Guidelines", description: "Road safety and accident prevention", duration: "10:00", category: "Safety", thumbnail: "🛡️", isWatched: false },
  { id: "6", title: "Handling Complaints", description: "Resolving issues effectively", duration: "7:30", category: "Service", thumbnail: "✅", isWatched: false },
  { id: "7", title: "Earning More", description: "Tips to maximize your earnings", duration: "5:50", category: "Earnings", thumbnail: "💰", isWatched: false },
  { id: "8", title: "App Features Tour", description: "Complete guide to all features", duration: "12:00", category: "Basics", thumbnail: "📱", isWatched: false },
];

const categories = ["All", "Basics", "Safety", "Service", "Earnings"];

const quizzes = [
  { question: "What should you do when you can't find a delivery address?", options: ["Call customer", "Cancel order", "Mark as delivered"], answer: "Call customer" },
  { question: "How long is the countdown for order acceptance?", options: ["30 seconds", "45 seconds", "60 seconds"], answer: "45 seconds" },
];

export default function RiderTrainingPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);

  const filteredVideos = activeCategory === "All" 
    ? videos 
    : videos.filter(v => v.category === activeCategory);

  const watchedCount = videos.filter(v => v.isWatched).length;

  const openVideo = (video: Video) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const completeVideo = () => {
    alert("Video completed! +10 points earned");
    setShowVideoModal(false);
  };

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">MIIAM</Link>
        </div>
        <h1 className="text-2xl font-bold mt-4">📚 Training Center</h1>
        <p className="text-sm opacity-80">Learn and grow with MIIAM</p>
      </header>

      <main className="px-6 -mt-4 space-y-6 pb-32">
        {/* Progress */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#4d212a]">Your Progress</h3>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              {watchedCount}/{videos.length} completed
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: `${(watchedCount / videos.length) * 100}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-slate-400">Keep learning!</span>
            <span className="text-blue-600 font-bold">80 points earned</span>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeCategory === cat 
                  ? "bg-[#0b50d5] text-white" 
                  : "bg-white text-slate-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredVideos.map((video) => (
            <div 
              key={video.id}
              onClick={() => openVideo(video)}
              className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="w-full h-24 bg-slate-100 rounded-xl flex items-center justify-center text-4xl mb-3 relative">
                {video.thumbnail}
                {video.isWatched && (
                  <span className="absolute top-2 right-2 text-green-500">✓</span>
                )}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">
                  {video.duration}
                </div>
              </div>
              <h3 className="font-bold text-sm text-[#4d212a] line-clamp-1">{video.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-1">{video.description}</p>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded mt-1 inline-block">
                {video.category}
              </span>
            </div>
          ))}
        </div>

        {/* Daily Quiz */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-amber-800">📝 Daily Quiz</h3>
            <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full">+20 points</span>
          </div>
          <p className="text-sm text-amber-700 mb-3">Test your knowledge and earn rewards!</p>
          <button 
            onClick={() => setShowQuiz(true)}
            className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl"
          >
            Take Quiz
          </button>
        </div>

        {/* Quick Tips */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[#4d212a] mb-4">💡 Quick Tips</h3>
          <div className="space-y-3">
            {[
              { tip: "Always check order details before accepting", icon: "📋" },
              { tip: "Keep your phone charged during shifts", icon: "🔋" },
              { tip: "Use shortcuts for faster delivery", icon: "⚡" },
              { tip: "Stay online during peak hours", icon: "🔥" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <span className="text-xl">{item.icon}</span>
                <p className="text-sm font-medium">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Certificate */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-100 text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="font-bold text-purple-800">Complete All Training</h3>
          <p className="text-xs text-purple-600 mb-3">Get your official MIIAM rider certificate</p>
          <button className="px-6 py-2 bg-purple-500 text-white font-bold rounded-full text-sm">
            View Certificate
          </button>
        </div>
      </main>

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="bg-black h-48 flex items-center justify-center text-6xl">
              {selectedVideo.thumbnail}
            </div>
            <div className="p-5">
              <h3 className="font-bold text-xl mb-2">{selectedVideo.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{selectedVideo.description}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-400">{selectedVideo.duration}</span>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">{selectedVideo.category}</span>
              </div>
              <button 
                onClick={completeVideo}
                className="w-full py-3 bg-[#0b50d5] text-white font-bold rounded-xl"
              >
                Mark as Complete
              </button>
              <button onClick={() => setShowVideoModal(false)} className="w-full py-3 text-slate-500 font-bold mt-2">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuiz && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-xl mb-4">Daily Quiz</h3>
            <div className="mb-4">
              <p className="font-bold mb-3">{quizzes[quizIndex].question}</p>
              <div className="space-y-2">
                {quizzes[quizIndex].options.map((opt, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      if (opt === quizzes[quizIndex].answer) {
                        alert("Correct! +20 points");
                        setShowQuiz(false);
                      } else {
                        alert("Try again!");
                      }
                    }}
                    className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm hover:bg-slate-100"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowQuiz(false)} className="w-full py-3 text-slate-500 font-bold">
              Close
            </button>
          </div>
        </div>
      )}

      <RiderNavBar active="account" />
    </div>
  );
}

function RiderNavBar({ active }: { active: string }) {
  const navItems = [
    { name: "Map", href: "/rider/dashboard", icon: "map" },
    { name: "Orders", href: "/rider/orders", icon: "list_alt" },
    { name: "Wallet", href: "/rider/wallet", icon: "account_balance_wallet" },
    { name: "Account", href: "/rider/account", icon: "person" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-4 bg-white/90 backdrop-blur-xl shadow-[0px_-10px_30px_rgba(11,80,213,0.1)] rounded-t-[3rem]">
      {navItems.map(item => (
        <Link
          key={item.name}
          href={item.href}
          className={`flex flex-col items-center p-2 ${
            active === item.name.toLowerCase() ? "text-[#0b50d5]" : "text-[#814c55]"
          }`}
        >
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: active === item.name.toLowerCase() ? "'FILL' 1" : "'FILL' 0" }}>
            {item.icon}
          </span>
          <span className="text-[10px] font-bold">{item.name}</span>
        </Link>
      ))}
    </nav>
  );
}