import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { ALLOWED_EMAILS } from "./allowedEmails";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = not logged in / not authorized
  const [loading, setLoading] = useState(true);
  // bumped after reload()/enroll() so consumers re-evaluate emailVerified + MFA
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      // Keep the user only if their email is on the allow-list.
      // Email verification + MFA enrollment are enforced downstream by the
      // route gates so the app can still offer "resend verification" / "enroll".
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

  // Pull the latest user state from Firebase (email verification, enrolled
  // factors) and force a re-render of everything that depends on it.
  const refresh = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser(auth.currentUser);
    }
    setVersion((v) => v + 1);
  };

  const logout = () => signOut(auth);

  const value = { user, loading, version, refresh, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
