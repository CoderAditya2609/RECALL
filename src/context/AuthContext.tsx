import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  signInAnonymously,
} from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { AuthUser, AppAccount, PublicUserProfile, UserSettings } from '../types';

// SHA-256 Password Hashing Utility
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = 'recall_academic_v2_secure_salt_';
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface AuthContextType {
  user: AuthUser | null;
  isGuest: boolean;
  publicProfile: PublicUserProfile | null;
  userSettings: UserSettings;
  loading: boolean;
  authError: string | null;
  signUp: (username: string, displayName: string, pass: string) => Promise<boolean>;
  signIn: (username: string, pass: string) => Promise<boolean>;
  signInWithGoogle?: () => Promise<boolean>;
  signInWithEmail?: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail?: (email: string, pass: string, username: string, displayName?: string) => Promise<boolean>;
  signInAsGuest: () => Promise<boolean>;
  signOut: () => Promise<void>;
  updateUsername: (newUsername: string) => Promise<boolean>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  searchUsersByUsername: (query: string) => Promise<PublicUserProfile[]>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_ACCOUNT_STORAGE_KEY = 'recall_active_account';
const GUEST_ID_KEY = 'recall_guest_uid';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [publicProfile, setPublicProfile] = useState<PublicUserProfile | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    geminiApiKey: '',
    theme: 'dark',
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize Firebase anonymous auth in background for database connectivity & load saved student account
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Ensure anonymous session for Firestore rules authorization
        if (!auth.currentUser) {
          await signInAnonymously(auth).catch((e) => console.warn('Anon auth notice:', e));
        }

        // Check if there is an active logged-in student account in localStorage
        const storedAccountRaw = localStorage.getItem(LOCAL_ACCOUNT_STORAGE_KEY);
        if (storedAccountRaw) {
          try {
            const account: AppAccount = JSON.parse(storedAccountRaw);
            if (account && account.username) {
              const cleanUsername = account.username.toLowerCase();
              const userId = account.id || `student_${cleanUsername}`;

              const authUser: AuthUser = {
                uid: userId,
                username: cleanUsername,
                displayName: account.displayName || account.username,
                photoURL: account.photoURL || '',
                isAnonymous: false,
              };

              const profile: PublicUserProfile = {
                id: userId,
                username: cleanUsername,
                displayName: account.displayName || account.username,
                photoURL: account.photoURL || '',
                createdAt: account.createdAt || new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
              };

              if (isMounted) {
                setUser(authUser);
                setPublicProfile(profile);
              }

              // Update Firestore presence in background
              const publicRef = doc(db, 'publicUsers', userId);
              setDoc(publicRef, profile, { merge: true }).catch(() => {});
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn('Failed to parse saved student account:', e);
          }
        }

        // Otherwise set up Guest student session
        let guestUid = localStorage.getItem(GUEST_ID_KEY);
        if (!guestUid) {
          guestUid = `guest_${Math.random().toString(36).substring(2, 9)}`;
          localStorage.setItem(GUEST_ID_KEY, guestUid);
        }

        const guestUser: AuthUser = {
          uid: guestUid,
          username: 'guest',
          displayName: 'Guest Student',
          isAnonymous: true,
        };

        const guestProfile: PublicUserProfile = {
          id: guestUid,
          username: 'guest',
          displayName: 'Guest Student',
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        };

        if (isMounted) {
          setUser(guestUser);
          setPublicProfile(guestProfile);
        }
      } catch (err) {
        console.warn('Auth initialization fallback:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to user-specific private settings
  useEffect(() => {
    if (!user) return;
    const settingsDoc = doc(db, `users/${user.uid}/settings/preferences`);
    const unsub = onSnapshot(
      settingsDoc,
      (snap) => {
        if (snap.exists()) {
          setUserSettings(snap.data() as UserSettings);
        }
      },
      (err) => console.warn('Settings listener notice:', err)
    );

    return () => unsub();
  }, [user?.uid]);

  // Sign Up with Username + Display Name + Password
  const handleSignUp = async (username: string, displayName: string, pass: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const cleanUsername = username.trim().toLowerCase().replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '');

      if (!cleanUsername || cleanUsername.length < 3) {
        setAuthError('Username must be at least 3 characters (letters, numbers, underscores).');
        return false;
      }

      if (!pass || pass.length < 4) {
        setAuthError('Password must be at least 4 characters.');
        return false;
      }

      const finalDisplayName = displayName.trim() || cleanUsername;

      // Check if username already exists in Firestore
      try {
        const accountRef = doc(db, 'appAccounts', cleanUsername);
        const snap = await getDoc(accountRef);
        if (snap.exists()) {
          setAuthError(`Username @${cleanUsername} is already registered. Please sign in or choose another.`);
          return false;
        }
      } catch (err) {
        console.warn('Account availability check notice:', err);
      }

      const userId = `student_${cleanUsername}`;
      const now = new Date().toISOString();
      const hashedPassword = await hashPassword(pass);

      const newAccount: AppAccount = {
        id: userId,
        username: cleanUsername,
        displayName: finalDisplayName,
        password: hashedPassword,
        createdAt: now,
        lastActiveAt: now,
      };

      const publicUser: PublicUserProfile = {
        id: userId,
        username: cleanUsername,
        displayName: finalDisplayName,
        photoURL: '',
        createdAt: now,
        lastActiveAt: now,
      };

      // Save to Firestore appAccounts & publicUsers
      try {
        await setDoc(doc(db, 'appAccounts', cleanUsername), newAccount);
        await setDoc(doc(db, 'publicUsers', userId), publicUser);
      } catch (err) {
        console.warn('Firestore account creation notice:', err);
      }

      // Save to local storage for persistent session
      localStorage.setItem(LOCAL_ACCOUNT_STORAGE_KEY, JSON.stringify(newAccount));

      // Update state
      const authUser: AuthUser = {
        uid: userId,
        username: cleanUsername,
        displayName: finalDisplayName,
        photoURL: '',
        isAnonymous: false,
      };

      setUser(authUser);
      setPublicProfile(publicUser);
      return true;
    } catch (err: any) {
      const msg = err?.message || 'Failed to create student account.';
      setAuthError(msg);
      return false;
    }
  };

  // Sign In with Username + Password
  const handleSignIn = async (username: string, pass: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const cleanUsername = username.trim().toLowerCase().replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '');

      if (!cleanUsername) {
        setAuthError('Please enter your username.');
        return false;
      }

      if (!pass) {
        setAuthError('Please enter your password.');
        return false;
      }

      let accountData: AppAccount | null = null;

      // 1. Try fetching from Firestore
      try {
        const accountRef = doc(db, 'appAccounts', cleanUsername);
        const snap = await getDoc(accountRef);
        if (snap.exists()) {
          accountData = snap.data() as AppAccount;
        }
      } catch (err) {
        console.warn('Firestore sign-in lookup notice:', err);
      }

      // 2. If not found in Firestore, check if stored locally
      if (!accountData) {
        const stored = localStorage.getItem(LOCAL_ACCOUNT_STORAGE_KEY);
        if (stored) {
          try {
            const parsed: AppAccount = JSON.parse(stored);
            if (parsed.username.toLowerCase() === cleanUsername) {
              accountData = parsed;
            }
          } catch {}
        }
      }

      if (!accountData) {
        setAuthError(`Account @${cleanUsername} not found. Please click 'Register' to create it.`);
        return false;
      }

      const hashedInput = await hashPassword(pass);
      // Validate against hashed password (or fallback for plain text if existed earlier)
      const isValidPass =
        accountData.password === hashedInput || accountData.password === pass;

      if (!isValidPass) {
        setAuthError('Incorrect password. Please try again.');
        return false;
      }

      const now = new Date().toISOString();
      const updatedAccount: AppAccount = {
        ...accountData,
        password: hashedInput, // Ensure upgraded to hash
        lastActiveAt: now,
      };

      const publicUser: PublicUserProfile = {
        id: updatedAccount.id,
        username: updatedAccount.username,
        displayName: updatedAccount.displayName || updatedAccount.username,
        photoURL: updatedAccount.photoURL || '',
        createdAt: updatedAccount.createdAt || now,
        lastActiveAt: now,
      };

      // Save to local storage
      localStorage.setItem(LOCAL_ACCOUNT_STORAGE_KEY, JSON.stringify(updatedAccount));

      // Update Firestore presence in background
      try {
        await updateDoc(doc(db, 'appAccounts', cleanUsername), {
          password: hashedInput,
          lastActiveAt: now,
        });
        await setDoc(doc(db, 'publicUsers', updatedAccount.id), publicUser, { merge: true });
      } catch {}

      const authUser: AuthUser = {
        uid: updatedAccount.id,
        username: updatedAccount.username,
        displayName: updatedAccount.displayName || updatedAccount.username,
        photoURL: updatedAccount.photoURL || '',
        isAnonymous: false,
      };

      setUser(authUser);
      setPublicProfile(publicUser);
      return true;
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign in.';
      setAuthError(msg);
      return false;
    }
  };

  const handleGuestSignIn = async (): Promise<boolean> => {
    setAuthError(null);
    let guestUid = localStorage.getItem(GUEST_ID_KEY);
    if (!guestUid) {
      guestUid = `guest_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(GUEST_ID_KEY, guestUid);
    }

    const guestUser: AuthUser = {
      uid: guestUid,
      username: 'guest',
      displayName: 'Guest Student',
      isAnonymous: true,
    };

    const guestProfile: PublicUserProfile = {
      id: guestUid,
      username: 'guest',
      displayName: 'Guest Student',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    localStorage.removeItem(LOCAL_ACCOUNT_STORAGE_KEY);
    setUser(guestUser);
    setPublicProfile(guestProfile);
    return true;
  };

  const handleSignOut = async () => {
    setAuthError(null);
    localStorage.removeItem(LOCAL_ACCOUNT_STORAGE_KEY);

    let guestUid = localStorage.getItem(GUEST_ID_KEY);
    if (!guestUid) {
      guestUid = `guest_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(GUEST_ID_KEY, guestUid);
    }

    const guestUser: AuthUser = {
      uid: guestUid,
      username: 'guest',
      displayName: 'Guest Student',
      isAnonymous: true,
    };

    const guestProfile: PublicUserProfile = {
      id: guestUid,
      username: 'guest',
      displayName: 'Guest Student',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    setUser(guestUser);
    setPublicProfile(guestProfile);
  };

  const handleUpdateUsername = async (newUsername: string): Promise<boolean> => {
    if (!user || user.isAnonymous) {
      setAuthError('Please register or sign in to change your username.');
      return false;
    }

    const clean = newUsername.trim().toLowerCase().replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '');
    if (clean.length < 3) {
      setAuthError('Username must be at least 3 characters.');
      return false;
    }

    try {
      // Check if another account has this username
      const accountSnap = await getDoc(doc(db, 'appAccounts', clean));
      if (accountSnap.exists() && accountSnap.data()?.id !== user.uid) {
        setAuthError(`Username @${clean} is already taken.`);
        return false;
      }

      // Update publicUsers
      const publicUserRef = doc(db, 'publicUsers', user.uid);
      await updateDoc(publicUserRef, {
        username: clean,
        lastActiveAt: new Date().toISOString(),
      });

      // Update local storage
      const stored = localStorage.getItem(LOCAL_ACCOUNT_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.username = clean;
          localStorage.setItem(LOCAL_ACCOUNT_STORAGE_KEY, JSON.stringify(parsed));
        } catch {}
      }

      setUser((prev) => (prev ? { ...prev, username: clean } : null));
      setPublicProfile((prev) => (prev ? { ...prev, username: clean } : null));
      return true;
    } catch (err: any) {
      setAuthError(err.message || 'Failed to update username');
      return false;
    }
  };

  const handleUpdateUserSettings = async (settings: Partial<UserSettings>) => {
    if (!user) return;
    try {
      const settingsRef = doc(db, `users/${user.uid}/settings/preferences`);
      const merged = { ...userSettings, ...settings };
      await setDoc(settingsRef, merged, { merge: true });
      setUserSettings(merged);
    } catch (err) {
      console.warn('Failed to update user settings:', err);
    }
  };

  const searchUsersByUsername = async (query: string): Promise<PublicUserProfile[]> => {
    if (!user) return [];
    try {
      const cleanQ = query.trim().toLowerCase().replace(/^@/, '');
      const usersCol = collection(db, 'publicUsers');
      const snap = await getDocs(usersCol);
      const results: PublicUserProfile[] = [];

      snap.forEach((d) => {
        const data = d.data() as PublicUserProfile;
        // Don't include yourself in search results unless query is empty
        if (data.id !== user.uid) {
          if (
            !cleanQ ||
            data.username?.toLowerCase().includes(cleanQ) ||
            data.displayName?.toLowerCase().includes(cleanQ)
          ) {
            results.push(data);
          }
        }
      });

      return results;
    } catch (err) {
      console.warn('Error searching users:', err);
      return [];
    }
  };

  const clearAuthError = () => setAuthError(null);

  const isGuest = !user || !!user.isAnonymous;

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        publicProfile,
        userSettings,
        loading,
        authError,
        signUp: handleSignUp,
        signIn: handleSignIn,
        signInWithEmail: (email: string, pass: string) => handleSignIn(email, pass),
        signUpWithEmail: (_email: string, pass: string, username: string, displayName?: string) =>
          handleSignUp(username, displayName || username, pass),
        signInAsGuest: handleGuestSignIn,
        signOut: handleSignOut,
        updateUsername: handleUpdateUsername,
        updateUserSettings: handleUpdateUserSettings,
        searchUsersByUsername,
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
