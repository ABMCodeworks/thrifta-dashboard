# Security Notes — Thrifta Admin

## Authentication overview

1. **Email + password** (Firebase Auth) — only addresses in
   [`src/allowedEmails.js`](src/allowedEmails.js) are accepted.
2. **Email verification** — an allow-listed admin whose email is unverified is
   blocked from all protected screens and shown a verify/resend prompt
   ([`src/pages/VerifyEmail.jsx`](src/pages/VerifyEmail.jsx)).
3. **Two-factor (app-level TOTP)** — after login, an enrolled admin must enter a
   6-digit code from their authenticator app before reaching the dashboard.

## How MFA works (app-level TOTP — no Firebase native MFA)

We deliberately **do not** use Firebase's native MFA (Identity Platform), so no
console upgrade, Blaze plan, or backend MFA enforcement is required.

- TOTP (RFC 6238: SHA-1, 6 digits, 30s) is implemented in the browser with the
  Web Crypto API — [`src/auth/totp.js`](src/auth/totp.js). No third-party TOTP
  library. (Verified against the RFC 6238 test vector.)
- Each admin's secret is stored in a plain Firestore doc, `admin_mfa/{uid}`
  ([`src/auth/mfaStore.js`](src/auth/mfaStore.js)). This is app data — it is
  **not** Firebase MFA and adds no security-rule enforcement by itself.
- Enrollment (QR + manual key + confirm) lives on **/security**
  ([`src/pages/Security.jsx`](src/pages/Security.jsx)).
- Enforcement: [`src/components/MfaGate.jsx`](src/components/MfaGate.jsx) requires
  a passed challenge each session. `MFA_REQUIRED` in
  [`src/auth/mfaConfig.js`](src/auth/mfaConfig.js) is `true`, so an admin with no
  authenticator is sent to /security to enroll. `/security` is intentionally not
  behind the gate, so a reset admin can never be hard-locked out.
- A passed challenge is remembered in `sessionStorage` for the current tab only;
  a new tab or browser restart re-prompts.

### Toggle enforcement

Set `MFA_REQUIRED = false` in [`src/auth/mfaConfig.js`](src/auth/mfaConfig.js)
for an opt-in rollout (enrollment available but not forced).

## Known limitations (read before relying on this)

Because verification happens in the browser against a secret the client can
read, **this is a soft second factor**, appropriate for a small internal admin
tool but not a server-enforced control:

- A determined attacker who already has a valid password *and* can read the
  `admin_mfa` doc / tamper with client code could bypass the TOTP step. MFA's
  main value here is stopping password-only compromise.
- The allow-list and MFA are **client-side gates**. They do not protect Firestore
  data on their own.

## Recommended hardening (when you're ready)

1. **Lock down the secret** so only the owning admin can read/write it. See
   [`firestore.rules`](firestore.rules) for the full ruleset.

   ⚠️ A standalone `match /admin_mfa/{uid}` block does **nothing** if your rules
   still contain a catch-all `match /{document=**} { allow read: if true }` —
   Firestore rules are additive (OR), so the catch-all keeps the secret
   world-readable. The catch-all must exclude `admin_mfa`:
   ```
   match /admin_mfa/{uid} {
     allow read, write: if request.auth != null && request.auth.uid == uid;
   }
   match /{collection}/{docId} {
     allow read:  if collection != 'admin_mfa';
     allow write: if request.auth != null && collection != 'admin_mfa';
   }
   match /{collection}/{docId}/{document=**} {
     allow read:  if collection != 'admin_mfa';
     allow write: if request.auth != null && collection != 'admin_mfa';
   }
   ```
2. **Enforce the allow-list / admin role server-side** in Firestore security
   rules (e.g. a custom claim or an `admins` collection) — the client allow-list
   is convenience, not enforcement.
3. **Move TOTP verification server-side** (e.g. the existing Railway service or a
   Cloud Function that mints a short-lived "mfa-passed" claim) to make the second
   factor authoritative.
4. **Upgrade to Firebase native MFA** (Identity Platform + TOTP provider) if you
   later want fully backend-enforced MFA; the enrollment/challenge UX here maps
   cleanly onto it.

## Secrets / env

Firebase web config keys (`VITE_FIREBASE_*`) are not secrets — security comes
from Firestore rules, not from hiding them. Keep `.env` out of version control
(already in `.gitignore`).
