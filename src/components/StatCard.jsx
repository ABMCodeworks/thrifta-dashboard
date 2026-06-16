import React from "react";
import Icon from "./Icon";

const ACCENTS = {
  brand: "bg-brand-50 text-brand-600",
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  slate: "bg-slate-100 text-slate-600",
};

export default function StatCard({
  title,
  value,
  icon,
  accent = "brand",
  loading = false,
  hint,
}) {
  const display = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div className="card p-5 transition hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-20 skeleton" />
          ) : (
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {display}
            </p>
          )}
          {hint && !loading && (
            <p className="mt-1 text-xs text-slate-400">{hint}</p>
          )}
        </div>
        {icon && (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ACCENTS[accent]}`}
          >
            <Icon name={icon} className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
}
