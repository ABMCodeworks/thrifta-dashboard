import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, applyPersistence } from "../firebase";
import { ALLOWED_EMAILS } from "../allowedEmails";
import { friendlyAuthError } from "../auth/authErrors";
import { useAuth } from "../AuthContext";
import AuthShell from "../components/AuthShell";
import Icon from "../components/Icon";

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // ── client-side lockout (UX deterrent; real throttling is server-side) ──
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!lockUntil) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [lockUntil]);

  const lockedSeconds = Math.max(0, Math.ceil((lockUntil - now) / 1000));
  const locked = lockedSeconds > 0;

  // Already authenticated → leave the login screen (gates handle MFA next).
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  function registerFailure() {
    setAttempts((a) => {
      const next = a + 1;
      if (next >= MAX_ATTEMPTS) {
        setLockUntil(Date.now() + COOLDOWN_SECONDS * 1000);
        return 0;
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (locked) return;
    setError("");

    const cleaned = email.trim();
    if (!ALLOWED_EMAILS.includes(cleaned)) {
      setError("This email isn't authorized for the admin dashboard.");
      return;
    }

    setBusy(true);
    try {
      await applyPersistence(remember);
      await signInWithEmailAndPassword(auth, cleaned, password);
      navigate("/"); // gates handle email verification + MFA
    } catch (err) {
      registerFailure();
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Thrifta Admin"
      subtitle="Sign in to your admin account"
      footer="Protected by two-factor authentication"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
        )}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            placeholder="you@thrifta.app"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-11 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <Icon name={showPassword ? "eye-off" : "eye"} />
            </button>
          </div>
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Keep me signed in on this device
        </label>

        {locked && (
          <p className="text-sm text-amber-600">
            Too many attempts. Try again in {lockedSeconds}s.
          </p>
        )}

        <button
          type="submit"
          disabled={busy || locked}
          className="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
