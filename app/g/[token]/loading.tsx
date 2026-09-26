// Skeleton shown while a member's page loads (database round trip).
export default function Loading() {
  return (
    <div className="animate-pulse space-y-5 pt-20" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded-full bg-stone-200" />
        <div className="h-8 w-56 rounded-xl bg-stone-200" />
      </div>
      <div className="h-24 rounded-3xl bg-white/70" />
      <div className="h-48 rounded-3xl bg-white/70" />
      <div className="h-48 rounded-3xl bg-white/70" />
    </div>
  );
}
