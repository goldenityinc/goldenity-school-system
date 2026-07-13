import { HTMLAttributes } from "react";

type BadgeVariant = "active" | "pending" | "suspended" | "inactive" | "trial" | "pro" | "enterprise";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const badgeClassMap: Record<BadgeVariant, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  suspended: "bg-red-100 text-red-700",
  inactive: "bg-slate-100 text-slate-500",
  trial: "bg-blue-100 text-blue-700",
  pro: "bg-blue-100 text-blue-700",
  enterprise: "bg-violet-100 text-violet-700"
};

export function Badge({ variant = "inactive", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClassMap[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
