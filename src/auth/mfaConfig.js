/**
 * App-level MFA settings.
 *
 * MFA_REQUIRED = true  → an admin with no authenticator enrolled is forced to
 *                        set one up before reaching the dashboard.
 * Set to false for an opt-in rollout (enrollment available, but not enforced).
 */
export const MFA_REQUIRED = true;

export const MFA_ISSUER = "Thrifta Admin";
