export default function ComboLoading() {
  return (
    <div className="bg-surface min-h-screen space-y-4 p-6">
      <div className="bg-surface-container-high h-64 w-full animate-pulse rounded-2xl" />
      <div className="bg-surface-container-high h-8 w-2/3 animate-pulse rounded-xl" />
      <div className="bg-surface-container-high h-4 w-1/2 animate-pulse rounded-xl" />
    </div>
  );
}
