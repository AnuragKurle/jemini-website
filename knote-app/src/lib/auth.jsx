import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  arrayUnion,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { REMEDY_ORDER } from './data.js';

const DEFAULT_UNLOCKED = REMEDY_ORDER.map(r => r.toUpperCase());

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [unlockedRemedies, setUnlockedRemedies] = useState(DEFAULT_UNLOCKED);
  const [displayName, setDisplayName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [levelsCompleted, setLevelsCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Failsafe: if Firebase takes too long (e.g. network issue), stop loading to let app render
    const timeout = setTimeout(() => {
      setLoading((l) => {
        if (l) {
          console.warn("Firebase auth timed out, forcing app load");
          return false;
        }
        return l;
      });
    }, 5000);

    const unsub = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timeout);
      setCurrentUser(user);

      if (!user) {
        setUnlockedRemedies(DEFAULT_UNLOCKED);
        setDisplayName('');
        setIsAdmin(false);
        setLevelsCompleted([]);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setUnlockedRemedies(data?.unlockedRemedies?.length ? data.unlockedRemedies : DEFAULT_UNLOCKED);
          setDisplayName(data?.displayName || '');
          setLevelsCompleted(data?.levelsCompleted || []);
        } else {
          await setDoc(userRef, {
            email: user.email ?? null,
            unlockedRemedies: DEFAULT_UNLOCKED,
            createdAt: serverTimestamp(),
          });
          setUnlockedRemedies(DEFAULT_UNLOCKED);
        }

        // Check if user is admin
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.email));
          setIsAdmin(adminDoc.exists() && adminDoc.data()?.isAdmin === true);
        } catch (err) {
          console.error('Failed to check admin status:', err);
          setIsAdmin(false);
        }
      } catch (err) {
        // If Firestore is misconfigured, we still want the user to be able to play.
        // Progress saving will just be unavailable until Firebase rules/project are fixed.
        console.error('Failed to load user progress from Firestore:', err);
        setUnlockedRemedies(DEFAULT_UNLOCKED);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  const signup = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create Firestore doc with displayName
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      email: user.email ?? null,
      displayName: name || '',
      unlockedRemedies: DEFAULT_UNLOCKED,
      createdAt: serverTimestamp(),
    });

    setDisplayName(name || '');
    setUnlockedRemedies(DEFAULT_UNLOCKED);

    return userCredential;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const unlockNextRemedy = async (currentRemedyName) => {
    if (!currentUser) return;

    const currentIndex = REMEDY_ORDER.findIndex(
      (r) => r.toUpperCase() === (currentRemedyName ?? '').toUpperCase(),
    );

    if (currentIndex < 0 || currentIndex >= REMEDY_ORDER.length - 1) return;

    const nextRemedy = REMEDY_ORDER[currentIndex + 1];

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        unlockedRemedies: arrayUnion(nextRemedy),
        updatedAt: serverTimestamp(),
      });

      setUnlockedRemedies((prev) => {
        const merged = new Set([...(prev ?? DEFAULT_UNLOCKED), nextRemedy]);
        return Array.from(merged);
      });
    } catch (err) {
      console.error('Failed to unlock next remedy:', err);
      // Non-fatal: user can still continue the game.
    }
  };

  const recordLevelCompletion = async (remedy, difficulty, timeInSeconds) => {
    if (!currentUser) return;

    const newCompletion = {
      remedy,
      difficulty,
      completedAt: new Date().toISOString(),
      timeInSeconds
    };

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        levelsCompleted: arrayUnion(newCompletion),
        lastActiveAt: serverTimestamp()
      });

      // Update local state immediately so UI reflects completion
      setLevelsCompleted(prev => [...prev, newCompletion]);
    } catch (err) {
      console.error('Failed to record level completion:', err);
    }
  };

  const updateUserRemedies = async (userId, remedies) => {
    if (!currentUser || !isAdmin) {
      console.error('Unauthorized: Admin access required');
      return false;
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        unlockedRemedies: remedies,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (err) {
      console.error('Failed to update user remedies:', err);
      return false;
    }
  };

  const value = useMemo(
    () => ({
      currentUser,
      loading,
      unlockedRemedies,
      displayName,
      isAdmin,
      levelsCompleted,
      signup,
      login,
      logout,
      resetPassword,
      unlockNextRemedy,
      recordLevelCompletion,
      updateUserRemedies,
      remedyOrder: REMEDY_ORDER,
    }),
    [currentUser, loading, unlockedRemedies, displayName, isAdmin, levelsCompleted],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};


