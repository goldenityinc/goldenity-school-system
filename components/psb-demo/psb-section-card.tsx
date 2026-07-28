import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type PsbSectionCardProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  aside?: ReactNode;
  children: ReactNode;
};

export function PsbSectionCard({ title, description, icon: Icon, aside, children }: PsbSectionCardProps) {
  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon ? (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon className="h-4 w-4" />
              </span>
            ) : null}
            <div>
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              {description ? <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p> : null}
            </div>
          </div>
        </div>
        {aside ? <div className="text-xs text-slate-500">{aside}</div> : null}
      </div>

      {children}
    </section>
  );
}
