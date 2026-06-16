import React from "react";
import Icon from "./Icon";

/**
 * Centered, branded card used by all unauthenticated / gate screens
 * (login, email verification, MFA challenge).
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-card">
            <Icon name="tag" className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>

        <div className="card p-8">{children}</div>

        {footer && <div className="mt-6 text-center text-xs text-slate-400">{footer}</div>}
      </div>
    </div>
  );
}
