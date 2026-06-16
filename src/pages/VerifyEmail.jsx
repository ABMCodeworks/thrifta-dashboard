import React, { useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "../AuthContext";
import { friendlyAuthError } from "../auth/authErrors";
import AuthShell from "../components/AuthShell";
import Icon from "../components/Icon";

/**
 * Shown by ProtectedRoute when an allow-listed admin is signed in but their
 * email hasn't been verified yet. Blocks all protected content until verified.
 */
export default function VerifyEmail() {
  const { user, refresh, logout } = useAuth();
  const [status, setStatus] = useState(null); // "sent" | "error" | null
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const resend = async () => {
    setSending(true);
    setError("");
    setStatus(null);
    try {
      await sendEmailVerification(user);
      setStatus("sent");
    } catch (err) {
      setError(friendlyAuthError(err));
      setStatus("error");
    } finally {
      setSending(false);
    }
  };

  const checkNow = async () => {
    setChecking(true);
    setError("");
    await refresh(); // reloads user; if now verified, the gate re-renders away
    setChecking(false);
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle="One more step before you can access the dashboard."
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-lg bg-brand-50 p-4 text-sm text-brand-800">
          <Icon name="mail" className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <p>
            We need to confirm <span className="font-medium">{user?.email}</span>.
            Check your inbox for a verification link, then come back and select
            “I've verified”.
          </p>
        </div>

        {status === "sent" && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            Verification email sent. It can take a minute to arrive.
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={checkNow}
          disabled={checking}
          className="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {checking ? "Checking…" : "I've verified my email"}
        </button>

        <button
          onClick={resend}
          disabled={sending}
          className="w-full rounded-lg border border-slate-200 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {sending ? "Sending…" : "Resend verification email"}
        </button>

        <button
          onClick={logout}
          className="w-full text-center text-sm text-slate-400 hover:text-slate-600"
        >
          Sign out
        </button>
      </div>
    </AuthShell>
  );
}
