import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, googleProvider, signInWithPopup, signInAnonymously, signOut as fbSignOut } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<boolean>;
  signInAsGuest: () => Promise<boolean>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        // Auto sign-in anonymously if no user is signed in to give immediate zero-barrier access
        try {
          const cred = await signInAnonymously(auth);
          setUser(cred.user);
        } catch (err) {
          console.warn('Anonymous sign-in fallback:', err);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async (): Promise<boolean> => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        // User closed or dismissed the popup - expected user interaction, avoid throwing uncaught errors
        return false;
      }
      if (err?.code === 'auth/popup-blocked') {
        const msg = 'Sign-in popup was blocked by browser. Please allow popups for this site.';
        setAuthError(msg);
        console.warn(msg);
        return false;
      }
      const msg = err?.message || 'Failed to sign in with Google';
      setAuthError(msg);
      console.warn('Google Sign In:', msg);
      return false;
    }
  };

  const handleGuestSignIn = async (): Promise<boolean> => {
    setAuthError(null);
    try {
      await signInAnonymously(auth);
      return true;
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign in as guest';
      setAuthError(msg);
      console.warn('Guest Sign In:', msg);
      return false;
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      await fbSignOut(auth);
    } catch (err: any) {
      console.warn('Sign Out Error:', err);
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        signInWithGoogle: handleGoogleSignIn,
        signInAsGuest: handleGuestSignIn,
        signOut: handleSignOut,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
