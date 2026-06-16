import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { verifyTotp } from "../auth/totp";
import AuthShell from "../components/AuthShell";

/**
 * Per-session second factor: shown by <MfaGate> when an enrolled admin hasn't
 * yet entered a valid TOTP code this session. The code is checked locally
 * against the stored secret (app-level MFA).
 */
export default function MfaChallenge() {
  const { mfaConfig, setMfaPassed, logout } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const ok = await verifyTotp(mfaConfig.secret, code);
    if (ok) {
      setMfaPassed(true);
    } else {
      setError("That code is incorrect or has expired. Try the latest code.");
      setCode("");
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Two-factor authentication"
      subtitle="Enter the 6-digit code from your authenticator app."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
        )}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Authentication code
          </span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center text-lg tracking-[0.5em] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            placeholder="••••••"
            autoFocus
            required
          />
        </label>

        <button
          type="submit"
          disabled={busy || code.length < 6}
          className="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? "Verifying…" : "Verify"}
        </button>

        <button
          type="button"
          onClick={logout}
          className="w-full text-center text-sm text-slate-400 hover:text-slate-600"
        >
          Sign out
        </button>
      </form>
    </AuthShell>
  );
}
