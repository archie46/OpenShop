import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistItem {
  productId: string;
  addedAt: string;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  getItemCount: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (productId) =>
        set((state) => {
          const exists = state.items.some((item) => item.productId === productId);
          if (exists) return state;
          
          return {
            items: [...state.items, { productId, addedAt: new Date().toISOString() }],
          };
        }),
      
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      
      clearWishlist: () => set({ items: [] }),
      
      isInWishlist: (productId) => {
        const { items } = get();
        return items.some((item) => item.productId === productId);
      },
      
      getItemCount: () => {
        const { items } = get();
        return items.length;
      },
    }),
    {
      name: 'wishlist-storage',
    }
  )
);
