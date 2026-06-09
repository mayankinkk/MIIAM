export default function Loading() {
  return (
    <div className="min-h-screen bg-[#fff4f4] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-400">Loading...</p>
      </div>
    </div>
  );
}
