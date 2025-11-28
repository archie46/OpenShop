import { create } from 'zustand';
import { type Toast } from '@/components/shared/Toast';

interface UIState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  showSuccess: (message) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: Math.random().toString(36).substring(7),
          type: 'success',
          message,
        },
      ],
    })),

  showError: (message) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: Math.random().toString(36).substring(7),
          type: 'error',
          message,
        },
      ],
    })),

  showWarning: (message) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: Math.random().toString(36).substring(7),
          type: 'warning',
          message,
        },
      ],
    })),

  showInfo: (message) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: Math.random().toString(36).substring(7),
          type: 'info',
          message,
        },
      ],
    })),
}));
