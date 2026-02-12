import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../lib/api';

// Simplified user interface for now, can be expanded to match Profile
interface User {
  id: string;
  email: string;
  role?: string;
  full_name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Keeping these for compatibility but they might need implementation or removal
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');

        if (token) {
          // Always fetch fresh profile from backend
          try {
            console.log('[AuthContext] Fetching fresh profile...');
            // Add timestamp to bypass Service Worker cache
            const profileResponse = await api.get(`/profile/me?_t=${Date.now()}`);
            const profileData = profileResponse.data;

            const userData = {
              id: profileData.id,
              email: profileData.email,
              full_name: profileData.full_name,
              role: profileData.role
            };

            console.log('[AuthContext] Fresh profile loaded:', userData);
            // Update storage to keep it sync, but state comes from API
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
          } catch (e) {
            console.error("[AuthContext] Failed to fetch fresh profile", e);
            // Only fallback if absolutely necessary, but warn
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              console.warn('[AuthContext] Using stale data from cache due to network error');
              setUser(JSON.parse(storedUser));
            } else {
              // Token exists but no profile and no cache -> Invalid state, logout
              localStorage.removeItem('token');
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('[AuthContext] Error loading user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, userId } = response.data;

      localStorage.setItem('token', token);

      // Immediately fetch profile after login
      // Add timestamp to bypass Service Worker cache
      const profileResponse = await api.get(`/profile/me?_t=${Date.now()}`);
      const profileData = profileResponse.data;

      const userData = {
        id: userId,
        email: profileData.email || email,
        full_name: profileData.full_name,
        role: profileData.role
      };

      console.log('[AuthContext] specific User profile loaded:', userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

    } catch (error: any) {
      console.error(error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    try {
      await api.post('/auth/register', { email, password, fullName, role });
      await signIn(email, password);
    } catch (error: any) {
      console.error(error);
      throw new Error(error.response?.data?.message || 'Signup failed');
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    // Not implemented in backend yet
    console.warn("Reset password not implemented");
  };

  const updateProfile = async (updates: any) => {
    // Not implemented fully
    console.warn("Update profile not implemented");
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateProfile
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
