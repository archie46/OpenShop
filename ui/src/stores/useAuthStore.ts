import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDTO } from '@/api/api';

interface AuthState {
  user: UserDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserDTO, token: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<UserDTO>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (user, token) => 
        set({ user, token, isAuthenticated: true }),
      
      clearAuth: () => 
        set({ user: null, token: null, isAuthenticated: false }),
      
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
