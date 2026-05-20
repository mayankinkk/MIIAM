export default function Loading() {
  return (
    <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#ba001c] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="material-symbols-outlined text-3xl text-white">M</span>
        </div>
        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#ba001c] animate-pulse" style={{ width: "60%" }} />
        </div>
        <p className="text-sm text-slate-500 mt-4">Loading...</p>
      </div>
    </div>
  );
}