import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { MFA_REQUIRED } from "../auth/mfaConfig";
import MfaChallenge from "../pages/MfaChallenge";

/**
 * App-level MFA gate (no Firebase native MFA):
 *   config loading        → spinner
 *   enrolled + not passed  → TOTP challenge for this session
 *   enrolled + passed      → render children
 *   not enrolled + required→ redirect to /security to enroll
 *   not enrolled + optional→ render children
 *
 * /security is intentionally NOT wrapped in this gate, so a non-enrolled or
 * reset admin can always reach enrollment and never gets hard-locked out.
 */
export default function MfaGate({ children }) {
  const { mfaReady, mfaConfig, mfaPassed } = useAuth();

  if (!mfaReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      </div>
    );
  }

  if (mfaConfig.enabled) {
    return mfaPassed ? children : <MfaChallenge />;
  }

  if (MFA_REQUIRED) return <Navigate to="/security" replace />;
  return children;
}
