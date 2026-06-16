import React from "react";
import { Navigate } from "react-router-dom";
import { multiFactor } from "firebase/auth";
import { useAuth } from "../AuthContext";

/**
 * Forces MFA enrollment: a signed-in, verified admin with zero enrolled
 * factors is redirected to /security to set up an authenticator app before
 * they can reach any other protected screen.
 *
 * `version` is read so this re-evaluates after enrollment (AuthContext.refresh).
 */
export default function RequireMfa({ children }) {
  const { user, version } = useAuth();
  void version;

  const enrolled = user ? multiFactor(user).enrolledFactors.length > 0 : false;
  if (!enrolled) return <Navigate to="/security" replace />;

  return children;
}
