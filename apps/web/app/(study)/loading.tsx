export default function StudyLoading() {
  return (
    <div className="space-y-4">
      <div className="h-48 animate-pulse rounded-[32px] border border-white/10 bg-white/5" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-[32px] border border-white/10 bg-white/5" />
        <div className="h-72 animate-pulse rounded-[32px] border border-white/10 bg-white/5" />
      </div>
    </div>
  );
}
