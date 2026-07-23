export default function ComboLoading() {
  return (
    <div className="min-h-screen bg-surface p-6 space-y-4">
      <div className="h-64 w-full bg-surface-container-high animate-pulse rounded-2xl" />
      <div className="h-8 w-2/3 bg-surface-container-high animate-pulse rounded-xl" />
      <div className="h-4 w-1/2 bg-surface-container-high animate-pulse rounded-xl" />
    </div>
  );
}