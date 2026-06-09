"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Confetti from "@/components/rider/Confetti";

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: string;
  unlocked: boolean;
  category: "delivery" | "earning" | "rating" | "streak" | "special";
}

const achievementDefs: Omit<Achievement, "progress" | "unlocked">[] = [
  { id: "1", icon: "🎯", title: "First Delivery", description: "Complete your first delivery", target: 1, reward: "100 points", category: "delivery" },
  { id: "2", icon: "🚀", title: "100 Orders", description: "Complete 100 deliveries", target: 100, reward: "₹500 bonus", category: "delivery" },
  { id: "3", icon: "🏃", title: "500 Orders", description: "Complete 500 deliveries", target: 500, reward: "₹2000 bonus", category: "delivery" },
  { id: "4", icon: "👑", title: "1000 Orders", description: "Complete 1000 deliveries", target: 1000, reward: "₹5000 bonus", category: "delivery" },
  { id: "5", icon: "💰", title: "₹10K Earner", description: "Earn ₹10,000 total", target: 10000, reward: "₹500 bonus", category: "earning" },
  { id: "6", icon: "💎", title: "₹50K Earner", description: "Earn ₹50,000 total", target: 50000, reward: "₹2000 bonus", category: "earning" },
  { id: "7", icon: "🤑", title: "₹1 Lakh Club", description: "Earn ₹1,00,000 total", target: 100000, reward: "₹10000 bonus", category: "earning" },
  { id: "8", icon: "⭐", title: "4.5 Star Rating", description: "Maintain 4.5+ rating", target: 4.5, reward: "Priority orders", category: "rating" },
  { id: "9", icon: "🌟", title: "5 Star Rating", description: "Maintain 5.0 rating", target: 5.0, reward: "Gold badge", category: "rating" },
  { id: "10", icon: "🔥", title: "7 Day Streak", description: "Work 7 days in a row", target: 7, reward: "₹200 bonus", category: "streak" },
  { id: "11", icon: "💪", title: "30 Day Streak", description: "Work 30 days in a row", target: 30, reward: "₹1000 bonus", category: "streak" },
  { id: "12", icon: "🌙", title: "Night Owl", description: "Complete 50 night deliveries", target: 50, reward: "₹300 bonus", category: "special" },
  { id: "13", icon: "🌅", title: "Early Bird", description: "Complete 50 morning deliveries", target: 50, reward: "₹300 bonus", category: "special" },
  { id: "14", icon: "⚡", title: "Speed Demon", description: "Complete 20 deliveries under 15 min", target: 20, reward: "Fast badge", category: "special" },
  { id: "15", icon: "🎉", title: "Weekend Warrior", description: "Complete 100 weekend deliveries", target: 100, reward: "₹500 bonus", category: "special" },
];

const categories = [
  { key: "all", label: "All", icon: "apps" },
  { key: "delivery", label: "Deliveries", icon: "local_shipping" },
  { key: "earning", label: "Earnings", icon: "payments" },
  { key: "rating", label: "Rating", icon: "star" },
  { key: "streak", label: "Streaks", icon: "whatshot" },
  { key: "special", label: "Special", icon: "emoji_events" },
];

export default function RiderAchievementsPage() {
  const supabase = createClient();
  const [activeCategory, setActiveCategory] = useState("all");
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Achievement | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const confettiKey = useRef(0);

  useEffect(() => {
    async function loadAchievements() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: myRider } = await supabase.from("riders").select("total_deliveries, total_earnings, rating").eq("user_id", user.id).single();

      const totalDel = myRider?.total_deliveries || 0;
      const totalEarn = myRider?.total_earnings || 0;
      const rating = myRider?.rating || 5.0;

      const built = achievementDefs.map(a => {
        let progress = 0;
        if (a.category === "delivery") progress = totalDel;
        else if (a.category === "earning") progress = totalEarn;
        else if (a.category === "rating") progress = rating;
        const unlocked = progress >= a.target;
        return { ...a, progress, unlocked } as Achievement;
      });

      setAchievements(built);
      const newUnlockedCount = built.filter(a => a.unlocked).length;
      setTotalPoints(newUnlockedCount * 100);
      setLoading(false);

      // Confetti on new unlocks
      const prevUnlocked = parseInt(localStorage.getItem("rider_unlocked_count") || "0");
      if (newUnlockedCount > prevUnlocked) {
        setShowConfetti(true);
        confettiKey.current += 1;
        setTimeout(() => setShowConfetti(false), 4000);
      }
      localStorage.setItem("rider_unlocked_count", newUnlockedCount.toString());
    }
    loadAchievements();
  }, [supabase]);

  const filteredAchievements = activeCategory === "all" 
    ? achievements 
    : achievements.filter(a => a.category === activeCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="min-h-screen bg-[#fff4f4]">
      <header className="bg-gradient-to-br from-amber-400 to-orange-500 text-white p-6 pb-8 rounded-b-[3rem]">
        <div className="flex justify-between items-center">
          <Link href="/rider/dashboard" className="text-3xl font-black tracking-tighter">MIIAM</Link>
        </div>
        <h1 className="text-2xl font-bold mt-4">🏆 Achievements</h1>
        <p className="text-sm opacity-80">Unlock rewards & badges</p>
      </header>

      <main className="px-6 -mt-4 space-y-6 pb-32">
        {/* Stats Card */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400">Your Progress</p>
              <p className="text-2xl font-black text-amber-500">{unlockedCount}/{achievements.length}</p>
            </div>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-3xl">
              🏅
            </div>
          </div>
          {achievements.length > 0 && (
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" style={{ width: `${(unlockedCount / achievements.length) * 100}%` }} />
            </div>
          )}
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-slate-500">{unlockedCount} unlocked</span>
            <span className="text-amber-600 font-bold">{totalPoints} points</span>
          </div>
        </div>

        {/* Points Balance */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-600">Available Points</p>
            <p className="text-2xl font-black text-amber-700">{totalPoints}</p>
          </div>
          <button 
            onClick={() => {
              if (totalPoints < 100) {
                import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast("You need at least 100 points to redeem. Keep unlocking achievements!", "info"));
              } else {
                // Show rewards catalog
                setShowRewards(true);
              }
            }}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold text-sm"
          >
            Redeem ({Math.floor(totalPoints / 100) * 100} pts available)
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeCategory === cat.key 
                  ? "bg-[#0b50d5] text-white" 
                  : "bg-white text-slate-500"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Achievements List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-14 bg-slate-200 rounded mb-2" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAchievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-all ${
                  achievement.unlocked 
                    ? "border-amber-300" 
                    : "border-transparent"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${
                    achievement.unlocked 
                      ? "bg-amber-100" 
                      : "bg-slate-100"
                  }`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                      <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#4d212a]">{achievement.title}</h3>
                      {achievement.unlocked && (
                        <button
                          onClick={() => { setShowConfetti(true); confettiKey.current += 1; setTimeout(() => setShowConfetti(false), 4000); }}
                          className="text-amber-500 hover:scale-125 transition-transform"
                          title="Celebrate!"
                        >
                          🎉
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{achievement.description}</p>
                    
                    {!achievement.unlocked && (
                      <>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-slate-400">
                            {Math.round(achievement.progress)} / {achievement.target}
                          </span>
                          <span className="text-[10px] text-[#0b50d5] font-bold">
                            {Math.min(Math.round((achievement.progress / achievement.target) * 100), 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-[#0b50d5] rounded-full transition-all"
                            style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs font-bold text-green-600">{achievement.reward}</span>
                      {!achievement.unlocked && (
                        <button 
                          onClick={() => {
                            setSelectedReward(achievement);
                            setShowRewardModal(true);
                          }}
                          className="text-xs text-[#0b50d5] font-bold"
                        >
                          Track →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard Teaser */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-100">
          <Link href="/rider/leaderboard" className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-purple-800">Weekly Leaderboard</h3>
              <p className="text-xs text-purple-600 mt-1">Compete with other riders</p>
            </div>
            <span className="text-[#0b50d5] font-bold text-sm">View →</span>
          </Link>
        </div>
      </main>

      <Confetti key={confettiKey.current} active={showConfetti} />

      {/* Reward Modal */}
      {showRewardModal && selectedReward && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-3">
                {selectedReward.icon}
              </div>
              <h3 className="font-bold text-xl">{selectedReward.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{selectedReward.description}</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-500">Progress</span>
                <span className="font-bold">{Math.round(selectedReward.progress)} / {selectedReward.target}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-[#0b50d5] rounded-full"
                  style={{ width: `${Math.min((selectedReward.progress / selectedReward.target) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded-xl mb-4">
              <p className="text-sm text-green-700 text-center">Reward: {selectedReward.reward}</p>
            </div>

            <button onClick={() => setShowRewardModal(false)} className="w-full py-3 bg-[#0b50d5] text-white font-bold rounded-xl">
              Keep Going! 💪
            </button>
          </div>
        </div>
      )}

      {/* Rewards Catalog Modal */}
      {showRewards && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Rewards Catalog</h3>
              <button onClick={() => setShowRewards(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Your points: <span className="font-bold text-amber-600">{totalPoints}</span></p>
            <div className="space-y-3">
              {[
                { name: "₹50 Wallet Credit", points: 100, icon: "💰" },
                { name: "₹100 Wallet Credit", points: 200, icon: "💵" },
                { name: "Free Delivery Pass (1 week)", points: 300, icon: "🚀" },
                { name: "₹200 Wallet Credit", points: 400, icon: "💎" },
                { name: "MIIAM Premium T-Shirt", points: 500, icon: "👕" },
                { name: "₹500 Wallet Credit", points: 800, icon: "🏆" },
              ].map((reward) => (
                <div key={reward.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{reward.icon}</span>
                    <div>
                      <p className="font-bold text-sm">{reward.name}</p>
                      <p className="text-xs text-slate-400">{reward.points} points</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (totalPoints >= reward.points) {
                        import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast(`${reward.name} redeemed! (This is a demo)`, "success"));
                      } else {
                        import("@/lib/store/toastStore").then(m => m.useToastStore.getState().addToast(`Need ${reward.points - totalPoints} more points`, "error"));
                      }
                    }}
                    disabled={totalPoints < reward.points}
                    className="px-3 py-1.5 bg-amber-500 text-white rounded-lg font-bold text-xs disabled:opacity-50 disabled:bg-slate-300"
                  >
                    Redeem
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}