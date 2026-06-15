"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Video {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  thumbnail: string;
  isWatched: boolean;
}

const videoDefs: Omit<Video, "isWatched">[] = [
  { id: "1", title: "Getting Started", description: "Learn the basics of the MIIAM rider app", duration: "5:30", category: "Basics", thumbnail: "🎯" },
  { id: "2", title: "Accepting Orders", description: "How to accept and manage delivery orders", duration: "4:15", category: "Basics", thumbnail: "📦" },
  { id: "3", title: "Delivery Best Practices", description: "Tips for efficient and safe deliveries", duration: "8:20", category: "Safety", thumbnail: "🚴" },
  { id: "4", title: "Customer Communication", description: "How to handle customer interactions", duration: "6:45", category: "Service", thumbnail: "💬" },
  { id: "5", title: "Safety Guidelines", description: "Road safety and accident prevention", duration: "10:00", category: "Safety", thumbnail: "🛡️" },
  { id: "6", title: "Handling Complaints", description: "Resolving issues effectively", duration: "7:30", category: "Service", thumbnail: "✅" },
  { id: "7", title: "Earning More", description: "Tips to maximize your earnings", duration: "5:50", category: "Earnings", thumbnail: "💰" },
  { id: "8", title: "App Features Tour", description: "Complete guide to all features", duration: "12:00", category: "Basics", thumbnail: "📱" },
];

const categories = ["All", "Basics", "Safety", "Service", "Earnings"];

const quizzes = [
  { question: "What should you do when you can't find a delivery address?", options: ["Call customer", "Cancel order", "Mark as delivered"], answer: "Call customer" },
  { question: "How long is the countdown for order acceptance?", options: ["30 seconds", "45 seconds", "60 seconds"], answer: "45 seconds" },
];

export default function RiderTrainingPage() {
  const supabase = createClient();
  const [activeCategory, setActiveCategory] = useState("All");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [videos, setVideos] = useState<Video[]>(videoDefs.map(v => ({ ...v, isWatched: false })));
  const [pointsEarned, setPointsEarned] = useState(0);
  const [riderId, setRiderId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgress() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: riderData } = await supabase.from("riders").select("id").eq("user_id", user.id).single();
      if (!riderData) return;
      setRiderId(riderData.id);

      const { data: progress } = await supabase
        .from("rider_training_progress")
        .select("*")
        .eq("rider_id", riderData.id);

      const totalPoints = (progress || []).reduce((s, p) => s + (p.points_earned || 0), 0);
      setPointsEarned(totalPoints);

      if (progress && progress.length > 0) {
        setVideos(videoDefs.map(v => ({
          ...v,
          isWatched: progress.some(p => p.video_id === v.id && p.is_watched),
        })));
      }
    }
    loadProgress();
  }, [supabase]);

  const filteredVideos = activeCategory === "All" 
    ? videos 
    : videos.filter(v => v.category === activeCategory);

  const watchedCount = videos.filter(v => v.isWatched).length;

  const openVideo = (video: Video) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const completeVideo = async () => {
    if (selectedVideo && riderId) {
      await supabase.from("rider_training_progress").upsert({
        rider_id: riderId,
        video_id: selectedVideo.id,
        is_watched: true,
        points_earned: 10,
      }, { onConflict: 'rider_id,video_id' });

      setVideos(prev => prev.map(v => v.id === selectedVideo.id ? { ...v, isWatched: true } : v));
      setPointsEarned(prev => prev + 10);
    }
    setShowVideoModal(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
      <header className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">MIIAM</Link>
        </div>
        <h1 className="text-2xl font-bold mt-4">📚 Training Center</h1>
        <p className="text-sm opacity-80">Learn and grow with MIIAM</p>
      </header>

      <main className="px-6 -mt-4 space-y-6 pb-32">
        {/* Progress */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[var(--color-on-surface)]">Your Progress</h3>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              {watchedCount}/{videos.length} completed
            </span>
          </div>
          <div className="w-full bg-[var(--color-surface-container)] rounded-full h-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: `${(watchedCount / videos.length) * 100}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-[var(--color-outline-variant)]">Keep learning!</span>
            <span className="text-blue-600 font-bold">{pointsEarned} points earned</span>
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
                  : "bg-[var(--color-surface-container-lowest)] text-[var(--color-outline)]"
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
              className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="w-full h-24 bg-[var(--color-surface-container)] rounded-xl flex items-center justify-center text-4xl mb-3 relative">
                {video.thumbnail}
                {video.isWatched && (
                  <span className="absolute top-2 right-2 text-green-500">✓</span>
                )}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">
                  {video.duration}
                </div>
              </div>
              <h3 className="font-bold text-sm text-[var(--color-on-surface)] line-clamp-1">{video.title}</h3>
              <p className="text-xs text-[var(--color-outline-variant)] line-clamp-1">{video.description}</p>
              <span className="text-[10px] bg-[var(--color-surface-container)] text-[var(--color-outline)] px-2 py-0.5 rounded mt-1 inline-block">
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
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-5 shadow-lg">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-4">💡 Quick Tips</h3>
          <div className="space-y-3">
            {[
              { tip: "Always check order details before accepting", icon: "📋" },
              { tip: "Keep your phone charged during shifts", icon: "🔋" },
              { tip: "Use shortcuts for faster delivery", icon: "⚡" },
              { tip: "Stay online during peak hours", icon: "🔥" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-[var(--color-surface-subtle)] rounded-xl">
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
          <button onClick={() => {
            if (watchedCount === videos.length) {
              // Generate certificate as downloadable HTML
              const certHtml = `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;text-align:center;padding:60px;background:#fff}h1{color:var(--color-primary);font-size:36px}h2{color:#333;margin-top:30px}p{color:#666;font-size:16px}.border{border:4px solid var(--color-primary);padding:40px;margin:20px}.date{margin-top:20px;color:#999}</style></head><body><div class="border"><h1>MIIAM</h1><p style="font-size:14px;letter-spacing:3px;text-transform:uppercase;color:var(--color-primary)">Certificate of Completion</p><h2>Rider Training Program</h2><p>Congratulations! You have successfully completed all ${videos.length} training modules.</p><p class="date">Issued on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></div></body></html>`;
              const blob = new Blob([certHtml], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "MIIAM_Rider_Certificate.html";
              a.click();
              URL.revokeObjectURL(url);
              import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("Certificate downloaded!", "success"));
            } else {
              import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast(`Complete all ${videos.length} videos to unlock your certificate (${watchedCount}/${videos.length})`, "info"));
            }
          }} className="px-6 py-2 bg-purple-500 text-white font-bold rounded-full text-sm">
            {watchedCount === videos.length ? "Download Certificate 🎉" : `${watchedCount}/${videos.length} Videos`}
          </button>
        </div>
      </main>

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl w-full max-w-md overflow-hidden">
            <div className="bg-black h-48 flex items-center justify-center text-6xl">
              {selectedVideo.thumbnail}
            </div>
            <div className="p-5">
              <h3 className="font-bold text-xl mb-2">{selectedVideo.title}</h3>
              <p className="text-sm text-[var(--color-outline)] mb-4">{selectedVideo.description}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[var(--color-outline-variant)]">{selectedVideo.duration}</span>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">{selectedVideo.category}</span>
              </div>
              <button 
                onClick={completeVideo}
                className="w-full py-3 bg-[#0b50d5] text-white font-bold rounded-xl"
              >
                Mark as Complete
              </button>
              <button onClick={() => setShowVideoModal(false)} className="w-full py-3 text-[var(--color-outline)] font-bold mt-2">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuiz && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-xl mb-4">Daily Quiz</h3>
            <div className="mb-4">
              <p className="font-bold mb-3">{quizzes[quizIndex].question}</p>
              <div className="space-y-2">
                {quizzes[quizIndex].options.map((opt, i) => (
                  <button 
                    key={i}
                    onClick={async () => {
                      if (opt === quizzes[quizIndex].answer) {
                        if (riderId) {
                          await supabase.from("rider_training_progress").upsert({
                            rider_id: riderId,
                            video_id: `quiz_${quizIndex}`,
                            is_watched: true,
                            quiz_score: 20,
                            points_earned: 20,
                          }, { onConflict: 'rider_id,video_id' });
                          setPointsEarned(prev => prev + 20);
                        }
                        setShowQuiz(false);
                      } else {
                        alert("Try again!");
                      }
                    }}
                    className="w-full p-3 bg-[var(--color-surface-subtle)] rounded-xl font-bold text-sm hover:bg-[var(--color-surface-container)]"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setShowQuiz(false)} className="w-full py-3 text-[var(--color-outline)] font-bold">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}