type BadgeTone =
  | "emerald"
  | "amber"
  | "sky"
  | "violet"
  | "rose"
  | "slate";

const toneClassMap: Record<BadgeTone, string> = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-100 text-slate-700"
};

function resolveTone(value: string): BadgeTone {
  if (["Diterima", "Lengkap", "Selesai", "done"].includes(value)) return "emerald";
  if (["Wawancara", "Berjalan", "current"].includes(value)) return "amber";
  if (["Terverifikasi", "Menunggu", "upcoming"].includes(value)) return "sky";
  if (["Prestasi", "Tahfidz"].includes(value)) return "violet";
  if (["Cadangan", "Perlu Revisi"].includes(value)) return "rose";
  return "slate";
}

export function PsbStatusBadge({ label }: { label: string }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        toneClassMap[resolveTone(label)]
      ].join(" ")}
    >
      {label}
    </span>
  );
}
