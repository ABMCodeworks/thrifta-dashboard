import React from "react";
import { useAuth } from "../../AuthContext";
import Icon from "../Icon";

export default function Topbar({ title, onMenu }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onMenu}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Icon name="menu" />
      </button>

      <h1 className="flex-1 truncate text-lg font-semibold text-slate-900">
        {title}
      </h1>

      <div className="hidden items-center gap-2 sm:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {(user?.email?.[0] || "?").toUpperCase()}
        </span>
        <span className="max-w-[180px] truncate text-sm text-slate-600">
          {user?.email}
        </span>
      </div>

      <button
        onClick={logout}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <Icon name="logout" className="h-4 w-4" />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </header>
  );
}
