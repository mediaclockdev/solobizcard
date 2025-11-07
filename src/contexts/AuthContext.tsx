"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { auth, db } from "@/services/firebase";
import {
  onAuthStateChanged,
  updatePassword,
  updateProfile,
  applyActionCode,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// ----------------- Types -----------------
export interface UserData {
  uid: string;
  name?: string;
  email?: string;
  createdAt?: string;
  lastUpdated?: string;
  isVerify?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: (FirebaseUser & UserData) | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  register: (
    name: string,
    email: string,
    password: string,
    businessCategory: string,
    clientsPreference: string
  ) => Promise<{ success: boolean; error?: string }>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  updateUser: (updates: { name?: string; password?: string }) => Promise<{
    success: boolean;
    error?: string;
  }>;
  verifyEmail: (
    oobCode: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ----------------- Provider -----------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(FirebaseUser & UserData) | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;

          if (userData.status !== "active") {
            return {
              success: false,
              error: "Your account is not active. Please contact support.",
            };
          }

          if (userData.isVerify) {
            if (userData?.subscriptionEndDate?.toDate() < new Date()) {
              await updateDoc(userRef, {
                planType: "free",
              });
            }
            setUser({ ...firebaseUser, ...userData });
            setIsLoggedIn(userData.isLoggedIn ?? false);
            setIsLoading(false);
          }
        } else {
          setUser(null);
          setIsLoading(false);
        }
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoggedIn(false);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // ----------------- Auth Methods -----------------
  const register = async (
    name: string,
    email: string,
    password: string,
    businessCategory: string,
    clientsPreference: string
  ) => {
    return { success: true };
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      if (!firebaseUser.emailVerified) {
        return {
          success: false,
          error: "Please verify your email before logging in.",
        };
      }

      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      let userData: UserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || "",
      };

      if (userDoc.exists()) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userFirestoreData = userDoc.data();

        // Check if user status is active
        if (userFirestoreData.status !== "active") {
          return {
            success: false,
            error: "Your account is not active. Please contact support.",
          };
        }
        updateDoc(userRef, { isLoggedIn: true, lastLogin: serverTimestamp() });
        userData = { ...userData, ...userDoc.data() };
      }

      setUser({ ...firebaseUser, ...userData });
      setIsLoggedIn(true);
      // localStorage.setItem("isLoggedIn", "true");
      // localStorage.setItem("userData", JSON.stringify(userData));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userData");
      setUser(null);
      setTimeout(() => {
        setIsLoggedIn(false);
      }, 500);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updateUser = async (updates: { name?: string; password?: string }) => {
    if (!user) return { success: false, error: "User not logged in" };

    try {
      const userRef = doc(db, "users", user.uid);
      const firestoreUpdates: Partial<UserData> = {
        lastUpdated: new Date().toISOString(),
      };

      if (updates.name) {
        await updateProfile(auth.currentUser!, { displayName: updates.name });
        firestoreUpdates.name = updates.name;
      }

      if (updates.password) {
        await updatePassword(auth.currentUser!, updates.password);
      }

      await updateDoc(userRef, firestoreUpdates);

      setUser((prev) =>
        prev
          ? { ...prev, ...updates, lastUpdated: firestoreUpdates.lastUpdated }
          : null
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const verifyEmail = async (oobCode: string) => {
    try {
      await applyActionCode(auth, oobCode);
      await auth.currentUser?.reload();

      const refreshedUser = auth.currentUser;
      if (refreshedUser) {
        const userRef = doc(db, "users", refreshedUser.uid);
        updateDoc(userRef, { isVerify: true }).then(async (res) => {
          const userDoc = await getDoc(userRef);
          let businessCategory: string | undefined;
          let clientsPreference: string | undefined;
          if (userDoc.exists()) {
            businessCategory = (userDoc.data() as UserData).businessCategory;
            clientsPreference = (userDoc.data() as UserData).clientsPreference;
          }

          await setDataBase(
            refreshedUser.displayName,
            refreshedUser.email,
            businessCategory,
            clientsPreference
          );
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const setDataBase = async (
    displayName: string,
    email: string,
    businessCategory?: string,
    clientsPreference?: string
  ) => {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: displayName,
        email,
        businessCategory,
        clientsPreference,
      }),
    });

    const data = await res.json();
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        register,
        login,
        logout,
        updateUser,
        isLoggedIn,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
