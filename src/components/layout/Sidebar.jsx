import React from "react";
import { NavLink } from "react-router-dom";
import Icon from "../Icon";

const NAV = [
  { to: "/", end: true, label: "Dashboard", icon: "dashboard" },
  { to: "/reports", label: "Reports", icon: "reports" },
  { to: "/users", label: "Users", icon: "users" },
  { to: "/support", label: "Support", icon: "support" },
  { to: "/security", label: "Security", icon: "shield" },
];

function NavItems({ onNavigate }) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`
          }
        >
          <Icon name={item.icon} className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Icon name="tag" className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-slate-900">Thrifta</p>
        <p className="text-xs text-slate-400">Admin</p>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Desktop: fixed column */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <Brand />
        <NavItems />
      </aside>

      {/* Mobile: slide-over drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl animate-fade-in">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <Icon name="close" />
              </button>
            </div>
            <NavItems onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
