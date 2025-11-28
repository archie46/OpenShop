/**
 * Cart Async Thunks
 * All thunks call backend APIs and follow the YAML specification
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  getCartApi,
  addToCartApi,
  removeFromCartApi,
  updateQuantityApi,
  clearCartApi,
} from './cartApi';
import type { Cart } from '@/api/api';

/**
 * Fetch Cart - GET /api/cart
 * Retrieves the user's cart from backend
 */
export const fetchCart = createAsyncThunk<
  Cart,
  void,
  { rejectValue: string }
>(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const cart = await getCartApi();
      return cart;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to fetch cart'
      );
    }
  }
);

/**
 * Add to Cart - POST /api/cart/items
 * Adds an item to the cart
 */
export const addToCart = createAsyncThunk<
  Cart,
  { productId: string; quantity: number },
  { rejectValue: string }
>(
  'cart/addToCart',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const cart = await addToCartApi(productId, quantity);
      return cart;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to add item to cart'
      );
    }
  }
);

/**
 * Remove from Cart - POST /api/cart/items (with negative quantity)
 * Removes items from the cart by passing negative quantity
 */
export const removeFromCart = createAsyncThunk<
  Cart,
  { productId: string; quantity: number },
  { rejectValue: string }
>(
  'cart/removeFromCart',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const cart = await removeFromCartApi(productId, quantity);
      return cart;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to remove item from cart'
      );
    }
  }
);

/**
 * Update Cart Quantity
 * Updates the quantity of an item in the cart
 * NOTE: This uses remove + add since YAML doesn't have a dedicated update endpoint
 */
export const updateCartQuantity = createAsyncThunk<
  Cart,
  { itemId: number; productId: string; quantity: number },
  { rejectValue: string }
>(
  'cart/updateQuantity',
  async ({productId, quantity }, { rejectWithValue }) => {
    try {
      const cart = await updateQuantityApi(productId, quantity);
      return cart;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to update quantity'
      );
    }
  }
);

/**
 * Clear Cart - DELETE /api/cart/clear
 * Removes all items from the cart
 */
export const clearCart = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await clearCartApi();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Failed to clear cart'
      );
    }
  }
);
