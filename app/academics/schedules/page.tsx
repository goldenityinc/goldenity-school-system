export default function SchedulesPage() {
  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Akademik</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Jadwal Pelajaran</h1>
        <p className="mt-1 text-sm text-slate-600">Halaman jadwal pelajaran terpisah akan memakai data dari backend API.</p>
      </header>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Data will be fetched from API.
      </div>
    </section>
  );
}