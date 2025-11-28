/**
 * Cart Redux Slice
 * State structure follows the backend Cart schema from YAML
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Cart } from '@/api/api';
import {
  fetchCart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
} from './cartThunks';

/**
 * Cart State Interface
 * Follows the "Best of Both Worlds" architecture:
 * - cart: Mirrors backend response exactly
 * - loading: UI state for showing loaders
 * - error: Error state for handling failures
 */
interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  cart: null,
  loading: false,
  error: null,
};

/**
 * Cart Slice
 * Redux state that mirrors backend cart structure
 */
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Clear error manually if needed
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action: PayloadAction<Cart>) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Add to Cart
    builder
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action: PayloadAction<Cart>) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Preserve previous cart state on error
      });

    // Remove from Cart
    builder
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action: PayloadAction<Cart>) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Preserve previous cart state on error
      });

    // Update Quantity
    builder
      .addCase(updateCartQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartQuantity.fulfilled, (state, action: PayloadAction<Cart>) => {
        state.loading = false;
        state.cart = action.payload;
        state.error = null;
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Preserve previous cart state on error
      });

    // Clear Cart
    builder
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.cart = null;
        state.error = null;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Preserve previous cart state on error
      });
  },
});

export const { clearError } = cartSlice.actions;
export default cartSlice.reducer;
