import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../AuthContext";
import { generateSecret, otpauthURL, verifyTotp } from "../auth/totp";
import { saveMfaSecret, disableMfa } from "../auth/mfaStore";
import { MFA_REQUIRED, MFA_ISSUER } from "../auth/mfaConfig";
import Icon from "../components/Icon";

export default function Security() {
  const { user, mfaConfig, refreshMfa, setMfaPassed } = useAuth();
  const navigate = useNavigate();

  const [secret, setSecret] = useState(null); // pending enrollment secret
  const [qrUri, setQrUri] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const enabled = mfaConfig.enabled;

  function startEnrollment() {
    setError("");
    const s = generateSecret();
    setSecret(s);
    setQrUri(otpauthURL(s, user.email, MFA_ISSUER));
    setCode("");
  }

  function cancelEnrollment() {
    setSecret(null);
    setQrUri("");
    setCode("");
    setError("");
  }

  async function finishEnrollment(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const ok = await verifyTotp(secret, code);
      if (!ok) {
        setError("That code didn't match. Make sure your device clock is correct and try the latest code.");
        return;
      }
      await saveMfaSecret(user.uid, secret);
      await refreshMfa();
      setMfaPassed(true); // they just proved possession
      cancelEnrollment();
    } catch (err) {
      console.error(err);
      setError("Couldn't save your authenticator. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    if (
      !window.confirm(
        "Remove this authenticator? You'll be asked to set MFA up again on your next sign-in.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await disableMfa(user.uid);
      await refreshMfa();
      setMfaPassed(false);
    } catch (err) {
      console.error(err);
      setError("Couldn't remove the authenticator. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security</h1>
        <p className="mt-1 text-sm text-slate-500">
          Two-factor authentication with an authenticator app (TOTP).
        </p>
      </div>

      {MFA_REQUIRED && !enabled && !secret && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Icon name="warning" className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p>
            Two-factor authentication is <strong>required</strong>. Set up an
            authenticator app below to continue to the dashboard.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Status / actions */}
      <section className="card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Icon name="shield" className="h-5 w-5 text-brand-600" />
          Authenticator app
        </h2>

        {enabled ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon name="check" className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-slate-800">Active</p>
                {mfaConfig.createdAt && (
                  <p className="text-xs text-slate-400">
                    Enabled {mfaConfig.createdAt.toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleDisable}
              disabled={busy}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              Remove
            </button>
          </div>
        ) : (
          !secret && (
            <>
              <p className="mt-3 text-sm text-slate-500">
                No authenticator set up yet.
              </p>
              <button
                onClick={startEnrollment}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700"
              >
                <Icon name="key" className="h-4 w-4" />
                Set up authenticator app
              </button>
            </>
          )
        )}
      </section>

      {/* Enrollment flow */}
      {secret && (
        <section className="card animate-fade-in p-6">
          <h2 className="text-lg font-semibold text-slate-900">Scan this QR code</h2>
          <p className="mt-1 text-sm text-slate-500">
            Open Google Authenticator, 1Password, Authy, or similar and scan the
            code — or enter the key manually — then confirm with a code.
          </p>

          <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <QRCodeSVG value={qrUri} size={176} />
            </div>

            <div className="w-full">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Manual entry key
              </p>
              <code className="mt-1 block break-all rounded-lg bg-slate-50 p-3 font-mono text-sm text-slate-700">
                {secret}
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

      {/* Continue to dashboard once MFA is satisfied */}
      {enabled && !secret && (
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
