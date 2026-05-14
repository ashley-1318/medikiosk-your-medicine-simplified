// useAuth — Firebase auth state observer
// Use this in any component that needs to know if user is logged in
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getSession, type Session } from "@/lib/session";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(() => getSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setSession(getSession());
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return {
    firebaseUser,
    session,
    isLoggedIn: !!session && !!firebaseUser,
    loading,
  };
}
