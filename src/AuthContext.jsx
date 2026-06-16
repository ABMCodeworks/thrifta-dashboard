import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { ALLOWED_EMAILS } from "./allowedEmails";
import { getMfaConfig } from "./auth/mfaStore";

const AuthContext = createContext();
const MFA_PASSED_KEY = "thrifta_mfa_passed"; // sessionStorage, holds the uid

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = not logged in / not authorized
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0); // bump → re-eval emailVerified

  // App-level MFA state
  const [mfaConfig, setMfaConfig] = useState({ enabled: false, secret: null });
  const [mfaReady, setMfaReady] = useState(false); // config loaded for current user
  const [mfaPassed, setMfaPassedState] = useState(false); // cleared the challenge this session

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      // Keep the user only if their email is on the allow-list. Email
      // verification + MFA are enforced downstream by the route gates.
      if (firebaseUser && ALLOWED_EMAILS.includes(firebaseUser.email)) {
        setUser(firebaseUser);
      } else {
        if (firebaseUser) signOut(auth); // signed in with a disallowed address
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Load this admin's MFA config whenever the signed-in user changes.
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setMfaConfig({ enabled: false, secret: null });
      setMfaReady(false);
      setMfaPassedState(false);
      return;
    }
    setMfaReady(false);
    // A passed challenge survives same-tab reloads but not a new tab / restart.
    setMfaPassedState(sessionStorage.getItem(MFA_PASSED_KEY) === user.uid);
    getMfaConfig(user.uid)
      .then((cfg) => {
        if (!cancelled) {
          setMfaConfig(cfg);
          setMfaReady(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load MFA config", err);
        if (!cancelled) {
          setMfaConfig({ enabled: false, secret: null });
          setMfaReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const setMfaPassed = (passed) => {
    if (passed && user) sessionStorage.setItem(MFA_PASSED_KEY, user.uid);
    else sessionStorage.removeItem(MFA_PASSED_KEY);
    setMfaPassedState(passed);
  };

  const refreshMfa = async () => {
    if (!user) return;
    const cfg = await getMfaConfig(user.uid);
    setMfaConfig(cfg);
  };

  // Pull the latest user state (email verification) and force a re-render.
  const refresh = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser(auth.currentUser);
    }
    setVersion((v) => v + 1);
  };

  const logout = () => {
    sessionStorage.removeItem(MFA_PASSED_KEY);
    setMfaPassedState(false);
    return signOut(auth);
  };

  const value = {
    user,
    loading,
    version,
    refresh,
    logout,
    mfaConfig,
    mfaReady,
    mfaPassed,
    setMfaPassed,
    refreshMfa,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
