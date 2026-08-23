import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  subscribeToAuth,
  loginWithEmail,
  registerWithEmail,
  loginQuickCashier,
  logoutUser,
} from '../services/auth.service';
import { UserRole } from '../types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAdminOrManager: boolean;
  displayName: string;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginCashier: (name?: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('user_pos_role') as UserRole;
    return saved || 'admin'; // Default to admin for full menu management access
  });

  useEffect(() => {
    const unsubscribe = subscribeToAuth((firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Auto-assign admin role to adala.system@gmail.com or admin emails
        if (firebaseUser.email?.includes('admin') || firebaseUser.email === 'adala.system@gmail.com') {
          setRoleState('admin');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('user_pos_role', newRole);
  }, []);

  const isAdminOrManager = role === 'admin' || role === 'manager';

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loginEmail = useCallback(async (email: string, pass: string) => {
    try {
      setLoading(true);
      setError(null);
      await loginWithEmail(email, pass);
    } catch (err: any) {
      let kurdishMsg = 'هەڵەیەک لە چوونەژوورەوە ڕوویدا. تکایە زانیارییەکانت بپشکنە.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        kurdishMsg = 'ئیمەیڵ یان وشەی نهێنی هەڵەیە.';
      } else if (err.code === 'auth/network-request-failed') {
        kurdishMsg = 'پەیوەندی بە هێڵی ئینتەرنێتەوە نییە.';
      }
      setError(kurdishMsg);
      throw new Error(kurdishMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const registerEmail = useCallback(async (email: string, pass: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      await registerWithEmail(email, pass, name);
    } catch (err: any) {
      let kurdishMsg = 'تۆمارکردنی هەژمار سەرکەوتوو نەبوو.';
      if (err.code === 'auth/email-already-in-use') {
        kurdishMsg = 'ئەم ئیمەیڵە پێشتر بەکارهاتووە.';
      } else if (err.code === 'auth/weak-password') {
        kurdishMsg = 'وشەی نهێنی دەبێت لانیکەم ٦ پیت یان ژمارە بێت.';
      }
      setError(kurdishMsg);
      throw new Error(kurdishMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const loginCashier = useCallback(async (name: string = 'کاشێری سەرەکی') => {
    try {
      setLoading(true);
      setError(null);
      await loginQuickCashier(name);
    } catch (err: any) {
      const kurdishMsg = 'دەستگەیشتن بە سیستەم سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە.';
      setError(kurdishMsg);
      throw new Error(kurdishMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await logoutUser();
    } finally {
      setLoading(false);
    }
  }, []);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'کاشێر';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        setRole,
        isAdminOrManager,
        displayName,
        loginEmail,
        registerEmail,
        loginCashier,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
