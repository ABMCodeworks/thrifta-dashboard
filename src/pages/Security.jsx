import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { multiFactor, TotpMultiFactorGenerator } from "firebase/auth";
import { useAuth } from "../AuthContext";
import { friendlyAuthError } from "../auth/authErrors";
import Icon from "../components/Icon";

const ISSUER = "Thrifta Admin";

export default function Security() {
  const { user, refresh, logout, version } = useAuth();
  const navigate = useNavigate();

  // re-read enrolled factors whenever version bumps (after enroll/unenroll)
  const factors = useMemo(
    () => (user ? multiFactor(user).enrolledFactors : []),
    [user, version],
  );

  const [secret, setSecret] = useState(null); // TotpSecret during enrollment
  const [qrUri, setQrUri] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsReauth, setNeedsReauth] = useState(false);

  const required = factors.length === 0;

  async function startEnrollment() {
    setError("");
    setBusy(true);
    try {
      const session = await multiFactor(user).getSession();
      const totpSecret = await TotpMultiFactorGenerator.generateSecret(session);
      setSecret(totpSecret);
      setQrUri(totpSecret.generateQrCodeUrl(user.email, ISSUER));
    } catch (err) {
      if (err.code === "auth/requires-recent-login") setNeedsReauth(true);
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function finishEnrollment(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(
        secret,
        code.trim(),
      );
      await multiFactor(user).enroll(assertion, "Authenticator app");
      setSecret(null);
      setQrUri("");
      setCode("");
      await refresh();
    } catch (err) {
      if (err.code === "auth/requires-recent-login") setNeedsReauth(true);
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeFactor(factor) {
    if (
      !window.confirm(
        `Remove "${factor.displayName || "authenticator"}"? You may be required to set up MFA again.`,
      )
    )
      return;
    setError("");
    setBusy(true);
    try {
      await multiFactor(user).unenroll(factor);
      await refresh();
    } catch (err) {
      if (err.code === "auth/requires-recent-login") setNeedsReauth(true);
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  function cancelEnrollment() {
    setSecret(null);
    setQrUri("");
    setCode("");
    setError("");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage two-factor authentication for your admin account.
        </p>
      </div>

      {required && !secret && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Icon name="warning" className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p>
            Two-factor authentication is <strong>required</strong>. Set up an
            authenticator app below to continue to the dashboard.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
          {needsReauth && (
            <button
              onClick={logout}
              className="ml-2 font-medium underline hover:no-underline"
            >
              Sign out & sign in again
            </button>
          )}
        </div>
      )}

      {/* Enrolled authenticators */}
      <section className="card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Icon name="shield" className="h-5 w-5 text-brand-600" />
          Authenticator apps
        </h2>

        {factors.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No authenticators enrolled yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {factors.map((f) => (
              <li
                key={f.uid}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon name="key" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-slate-800">
                      {f.displayName || "Authenticator app"}
                    </p>
                    {f.enrollmentTime && (
                      <p className="text-xs text-slate-400">
                        Added {new Date(f.enrollmentTime).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeFactor(f)}
                  disabled={busy}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {!secret && (
          <button
            onClick={startEnrollment}
            disabled={busy}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            <Icon name="key" className="h-4 w-4" />
            {busy ? "Preparing…" : "Set up authenticator app"}
          </button>
        )}
      </section>

      {/* Enrollment flow */}
      {secret && (
        <section className="card animate-fade-in p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Scan this QR code
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Open Google Authenticator, 1Password, Authy, or similar and scan the
            code — or enter the key manually.
          </p>

          <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              {qrUri ? (
                <QRCodeSVG value={qrUri} size={176} />
              ) : (
                <div className="h-44 w-44 skeleton" />
              )}
            </div>

            <div className="w-full">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Manual entry key
              </p>
              <code className="mt-1 block break-all rounded-lg bg-slate-50 p-3 font-mono text-sm text-slate-700">
                {secret.secretKey}
              </code>

              <form onSubmit={finishEnrollment} className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Enter the 6-digit code to confirm
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center text-lg tracking-[0.4em] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                    placeholder="••••••"
                    autoFocus
                  />
                </label>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={busy || code.length < 6}
                    className="flex-1 rounded-lg bg-brand-600 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
                  >
                    {busy ? "Activating…" : "Verify & activate"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEnrollment}
                    disabled={busy}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Continue button once MFA satisfied (e.g. after forced enrollment) */}
      {!required && !secret && (
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          Continue to dashboard
          <Icon name="trend" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
