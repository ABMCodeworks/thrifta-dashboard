import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import VerifyEmail from "../pages/VerifyEmail";

/**
 * Gate for any authenticated screen:
 *   not loaded  → spinner
 *   no user     → redirect to /login
 *   unverified  → email verification screen (with resend)
 *   otherwise   → render children
 *
 * MFA enrollment is enforced separately by <RequireMfa> so that /security
 * itself stays reachable for first-time enrollment.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <VerifyEmail />;

  return children;
}
