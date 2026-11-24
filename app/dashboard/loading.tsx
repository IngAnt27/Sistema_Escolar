export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-slate-200" />
        <div className="h-4 w-64 rounded-lg bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-2xl border border-[#E2E8F0] bg-white p-6">
            <div className="flex justify-between">
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="h-10 w-10 rounded-xl bg-slate-200" />
            </div>
            <div className="mt-5 h-8 w-20 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="h-40 rounded-2xl border border-[#E2E8F0] bg-white p-6" />
    </div>
  )
}