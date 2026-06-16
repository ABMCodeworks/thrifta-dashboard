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
  "auth/invalid-verification-code":
    "That code is incorrect or has expired. Try the latest code from your app.",
  "auth/missing-verification-code": "Enter the 6-digit code from your authenticator app.",
  "auth/totp-challenge-timeout": "The code expired. Please try again.",
  "auth/requires-recent-login":
    "For your security, please sign in again before changing security settings.",
  "auth/maximum-second-factor-count-exceeded":
    "You've reached the maximum number of authenticators.",
  "auth/second-factor-already-in-use":
    "That authenticator is already enrolled on this account.",
  "auth/unverified-email": "Please verify your email address before continuing.",
  "auth/operation-not-allowed":
    "Multi-factor auth isn't enabled for this project yet. Enable it in the Firebase console.",
};

export function friendlyAuthError(err) {
  if (!err) return "Something went wrong. Please try again.";
  const code = typeof err === "string" ? err : err.code;
  return (
    MESSAGES[code] ||
    "Something went wrong. Please try again, or contact an administrator."
  );
}
