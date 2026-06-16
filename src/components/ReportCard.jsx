// src/components/ReportCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon";

export default function ReportCard({
  title,
  to,
  count = 0,
  icon = "reports",
  loading = false,
}) {
  const nav = useNavigate();
  const active = count > 0;

  return (
    <button
      onClick={() => nav(to)}
      className="card group flex w-full items-center justify-between p-5 text-left transition hover:shadow-card-hover"
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            active ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
          }`}
        >
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div>
          <p className="font-medium text-slate-800">{title}</p>
          {loading ? (
            <div className="mt-1 h-5 w-10 skeleton" />
          ) : (
            <p className="text-sm text-slate-500">
              <span
                className={`font-semibold ${active ? "text-amber-600" : "text-slate-700"}`}
              >
                {count.toLocaleString()}
              </span>{" "}
              open
            </p>
          )}
        </div>
      </div>
      <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </span>
    </button>
  );
}
