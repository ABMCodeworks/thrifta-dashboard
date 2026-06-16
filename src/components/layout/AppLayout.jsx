import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

/**
 * Shared authenticated shell: responsive sidebar + sticky topbar + content.
 *
 * @param {string}  title     - page title shown in the topbar
 * @param {boolean} fullBleed - when true, content fills the viewport with no
 *                              padding/scroll wrapper (used by the chat/support
 *                              page which manages its own height).
 */
export default function AppLayout({ title, fullBleed = false, children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} onMenu={() => setMenuOpen(true)} />

        {fullBleed ? (
          <main className="flex-1 overflow-hidden">{children}</main>
        ) : (
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        )}
      </div>
    </div>
  );
}
