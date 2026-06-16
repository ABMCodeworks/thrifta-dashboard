/**
 * Map Firebase Auth error codes to safe, human-readable messages.
 * Never surface raw `err.message` to the UI — it leaks internal details and is
 * confusing to admins. Anything unrecognised falls back to a generic message.
 */
const MESSAGES = {
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/user-disabled": "This account has been disabled. Contact an administrator.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/invalid-login-credentials": "Incorrect email or password.",
  "auth/too-many-requests":
    "Too many attempts. Please wait a few minutes and try again.",
  "auth/network-request-failed":
    "Network error. Check your connection and try again.",
  "auth/requires-recent-login":
    "For your security, please sign in again before changing security settings.",
  "auth/unverified-email": "Please verify your email address before continuing.",
};

export function friendlyAuthError(err) {
  if (!err) return "Something went wrong. Please try again.";
  const code = typeof err === "string" ? err : err.code;
  return (
    MESSAGES[code] ||
    "Something went wrong. Please try again, or contact an administrator."
  );
}
