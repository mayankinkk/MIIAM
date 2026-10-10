"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  {
    id: "1",
    title: "Getting Started",
    description: "Learn the basics of the MIIAM rider app",
    duration: "5:30",
    category: "Basics",
    thumbnail: "🎯",
  },
  {
    id: "2",
    title: "Accepting Orders",
    description: "How to accept and manage delivery orders",
    duration: "4:15",
    category: "Basics",
    thumbnail: "📦",
  },
  {
    id: "3",
    title: "Delivery Best Practices",
    description: "Tips for efficient and safe deliveries",
    duration: "8:20",
    category: "Safety",
    thumbnail: "🚴",
  },
  {
    id: "4",
    title: "Customer Communication",
    description: "How to handle customer interactions",
    duration: "6:45",
    category: "Service",
    thumbnail: "💬",
  },
  {
    id: "5",
    title: "Safety Guidelines",
    description: "Road safety and accident prevention",
    duration: "10:00",
    category: "Safety",
    thumbnail: "🛡️",
  },
  {
    id: "6",
    title: "Handling Complaints",
    description: "Resolving issues effectively",
    duration: "7:30",
    category: "Service",
    thumbnail: "✅",
  },
  {
    id: "7",
    title: "Earning More",
    description: "Tips to maximize your earnings",
    duration: "5:50",
    category: "Earnings",
    thumbnail: "💰",
  },
  {
    id: "8",
    title: "App Features Tour",
    description: "Complete guide to all features",
    duration: "12:00",
    category: "Basics",
    thumbnail: "📱",
  },
];

const categories = ["All", "Basics", "Safety", "Service", "Earnings"];

const quizzes = [
  {
    question: "What should you do when you can't find a delivery address?",
    options: ["Call customer", "Cancel order", "Mark as delivered"],
    answer: "Call customer",
  },
  {
    question: "How long is the countdown for order acceptance?",
    options: ["30 seconds", "45 seconds", "60 seconds"],
    answer: "45 seconds",
  },
];

export default function RiderTrainingPage() {
  const supabase = useMemo(() => createClient(), []);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [videos, setVideos] = useState<Video[]>(videoDefs.map((v) => ({ ...v, isWatched: false })));
  const [pointsEarned, setPointsEarned] = useState(0);
  const [riderId, setRiderId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgress() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: riderData } = await supabase
        .from("riders")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!riderData) return;
      setRiderId(riderData.id);

      const { data: progress } = await supabase
        .from("rider_training_progress")
        .select("*")
        .eq("rider_id", riderData.id);

      const totalPoints = (progress || []).reduce(
        (s: number, p: { points_earned: number | null }) => s + (p.points_earned || 0),
        0
      );
      setPointsEarned(totalPoints);

      if (progress && progress.length > 0) {
        setVideos(
          videoDefs.map(
            (v): Video => ({
              ...v,
              isWatched: progress.some(
                (p: { video_id: string; is_watched: boolean }) =>
                  p.video_id === v.id && p.is_watched
              ),
            })
          )
        );
      }
    }
    loadProgress();
  }, [supabase]);

  const filteredVideos =
    activeCategory === "All" ? videos : videos.filter((v) => v.category === activeCategory);

  const watchedCount = videos.filter((v) => v.isWatched).length;

  const openVideo = (video: Video) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const closeVideoModal = useCallback(() => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  }, []);

  const closeQuizModal = useCallback(() => {
    setShowQuiz(false);
  }, []);

  useEffect(() => {
    if (!showVideoModal && !showQuiz) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showVideoModal) closeVideoModal();
        else if (showQuiz) closeQuizModal();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showVideoModal, showQuiz, closeVideoModal, closeQuizModal]);

  const completeVideo = async () => {
    if (selectedVideo && riderId) {
      await supabase.from("rider_training_progress").upsert(
        {
          rider_id: riderId,
          video_id: selectedVideo.id,
          is_watched: true,
          points_earned: 10,
        },
        { onConflict: "rider_id,video_id" }
      );

      setVideos((prev) =>
        prev.map((v) => (v.id === selectedVideo.id ? { ...v, isWatched: true } : v))
      );
      setPointsEarned((prev) => prev + 10);
    }
    setShowVideoModal(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
      <header className="from-accent rounded-b-[3rem] bg-gradient-to-br to-cyan-500 p-6 pb-8 text-white">
        <div className="flex items-center justify-between">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">
            MIIAM
          </Link>
        </div>
        <h1 className="mt-4 text-2xl font-bold">📚 Training Center</h1>
        <p className="text-sm opacity-80">Learn and grow with MIIAM</p>
      </header>

      <main className="-mt-4 space-y-6 px-6 pb-32">
        {/* Progress */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-[var(--color-on-surface)]">Your Progress</h3>
            <span className="bg-accent/10 text-accent rounded-full px-2 py-1 text-xs">
              {watchedCount}/{videos.length} completed
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--color-surface-container)]">
            <div
              className="from-accent h-full rounded-full bg-gradient-to-r to-cyan-500"
              style={{ width: `${(watchedCount / videos.length) * 100}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="text-[var(--color-outline-variant)]">Keep learning!</span>
            <span className="text-accent font-bold">{pointsEarned} points earned</span>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                activeCategory === cat
                  ? "bg-brand-secondary text-white"
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
              className="cursor-pointer rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-sm transition-all hover:shadow-lg"
            >
              <div className="relative mb-3 flex h-24 w-full items-center justify-center rounded-xl bg-[var(--color-surface-container)] text-4xl">
                {video.thumbnail}
                {video.isWatched && (
                  <span className="absolute top-2 right-2 text-green-500">✓</span>
                )}
                <div className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-0.5 text-[10px] text-white">
                  {video.duration}
                </div>
              </div>
              <h3 className="line-clamp-1 text-sm font-bold text-[var(--color-on-surface)]">
                {video.title}
              </h3>
              <p className="line-clamp-1 text-xs text-[var(--color-outline-variant)]">
                {video.description}
              </p>
              <span className="mt-1 inline-block rounded bg-[var(--color-surface-container)] px-2 py-0.5 text-[10px] text-[var(--color-outline)]">
                {video.category}
              </span>
            </div>
          ))}
        </div>

        {/* Daily Quiz */}
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-amber-800">📝 Daily Quiz</h3>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-600">
              +20 points
            </span>
          </div>
          <p className="mb-3 text-sm text-amber-700">Test your knowledge and earn rewards!</p>
          <button
            onClick={() => setShowQuiz(true)}
            className="w-full rounded-xl bg-amber-500 py-3 font-bold text-white"
          >
            Take Quiz
          </button>
        </div>

        {/* Quick Tips */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-lg">
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">💡 Quick Tips</h3>
          <div className="space-y-3">
            {[
              { tip: "Always check order details before accepting", icon: "📋" },
              { tip: "Keep your phone charged during shifts", icon: "🔋" },
              { tip: "Use shortcuts for faster delivery", icon: "⚡" },
              { tip: "Stay online during peak hours", icon: "🔥" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-subtle)] p-3"
              >
                <span className="text-xl">{item.icon}</span>
                <p className="text-sm font-medium">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Certificate */}
        <div className="from-deal to-accent/70 border-accent/40 rounded-2xl border bg-gradient-to-r p-5 text-center">
          <div className="mb-2 text-4xl">🏆</div>
          <h3 className="text-accent font-bold">Complete All Training</h3>
          <p className="text-accent mb-3 text-xs">Get your official MIIAM rider certificate</p>
          <button
            onClick={() => {
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
                import("@/lib/store/toastStore").then((m) =>
                  m.useToastStore.getState().addToast("Certificate downloaded!", "success")
                );
              } else {
                import("@/lib/store/toastStore").then((m) =>
                  m.useToastStore
                    .getState()
                    .addToast(
                      `Complete all ${videos.length} videos to unlock your certificate (${watchedCount}/${videos.length})`,
                      "info"
                    )
                );
              }
            }}
            className="bg-accent rounded-full px-6 py-2 text-sm font-bold text-white"
          >
            {watchedCount === videos.length
              ? "Download Certificate 🎉"
              : `${watchedCount}/${videos.length} Videos`}
          </button>
        </div>
      </main>

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={closeVideoModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-modal-title"
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-[var(--color-surface-container-lowest)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-48 items-center justify-center bg-black text-6xl">
              {selectedVideo.thumbnail}
            </div>
            <div className="p-5">
              <h3 id="video-modal-title" className="mb-2 text-xl font-bold">
                {selectedVideo.title}
              </h3>
              <p className="mb-4 text-sm text-[var(--color-outline)]">
                {selectedVideo.description}
              </p>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-[var(--color-outline-variant)]">
                  {selectedVideo.duration}
                </span>
                <span className="bg-accent/10 text-accent rounded px-2 py-1 text-xs">
                  {selectedVideo.category}
                </span>
              </div>
              <button
                onClick={completeVideo}
                className="bg-brand-secondary w-full rounded-xl py-3 font-bold text-white"
              >
                Mark as Complete
              </button>
              <button
                onClick={closeVideoModal}
                className="mt-2 w-full py-3 font-bold text-[var(--color-outline)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuiz && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={closeQuizModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="quiz-modal-title"
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-container-lowest)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="quiz-modal-title" className="mb-4 text-xl font-bold">
              Daily Quiz
            </h3>
            <div className="mb-4">
              <p className="mb-3 font-bold">{quizzes[quizIndex].question}</p>
              <div className="space-y-2">
                {quizzes[quizIndex].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={async () => {
                      if (opt === quizzes[quizIndex].answer) {
                        if (riderId) {
                          await supabase.from("rider_training_progress").upsert(
                            {
                              rider_id: riderId,
                              video_id: `quiz_${quizIndex}`,
                              is_watched: true,
                              quiz_score: 20,
                              points_earned: 20,
                            },
                            { onConflict: "rider_id,video_id" }
                          );
                          setPointsEarned((prev) => prev + 20);
                        }
                        setShowQuiz(false);
                      } else {
                        import("@/lib/store/toastStore").then((m) =>
                          m.useToastStore.getState().addToast("Try again!", "error")
                        );
                      }
                    }}
                    className="w-full rounded-xl bg-[var(--color-surface-subtle)] p-3 text-sm font-bold hover:bg-[var(--color-surface-container)]"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={closeQuizModal}
              className="w-full py-3 font-bold text-[var(--color-outline)]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
