export default function BaganAkunLoading() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-64 rounded-md bg-muted" />
        <div className="h-4 w-96 rounded-md bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted" />
        ))}
      </div>

      <div className="h-14 rounded-lg bg-muted" />
      <div className="h-96 rounded-lg bg-muted" />
    </div>
  );
}
