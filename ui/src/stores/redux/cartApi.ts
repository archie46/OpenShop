/**
 * Cart API - Backend API wrapper functions
 * Following the YAML specification exactly
 */

import API, { type Cart, type UpdateCartRequest, type CartDTO } from '@/api/api';

/**
 * Get user's cart from backend
 * Endpoint: GET /api/cart
 */
export const getCartApi = async (): Promise<Cart> => {
  const cartDTO = await API.cart.getCart();
  // Convert CartDTO to Cart format for consistency
  // CartDTO items don't have id, so we use productId as a unique identifier
  return {
    userId: cartDTO.userId,
    items: cartDTO.items.map((item, index) => ({
      id: index, // Generate a temporary id for React keys
      productId: item.productId,
      quantity: item.quantity,
      price: item.price
    }))
  };
};

/**
 * Add item to cart
 * Endpoint: POST /api/cart/items
 * @param productId - UUID of the product
 * @param quantity - Quantity to add
 */
export const addToCartApi = async (
  productId: string,
  quantity: number
): Promise<Cart> => {
  const item: UpdateCartRequest = {
    productId,
    quantity,
  };
  return await API.cart.updateItem(item);
};

/**
 * Remove item from cart by passing negative quantity
 * Endpoint: POST /api/cart/items
 * @param productId - UUID of the product
 * @param quantity - Negative quantity to remove (e.g., -1, -2, etc.)
 */
export const removeFromCartApi = async (
  productId: string,
  quantity: number
): Promise<Cart> => {
  const item: UpdateCartRequest = {
    productId,
    quantity: quantity, // Should be negative to remove
  };
  return await API.cart.updateItem(item);
};

/**
 * Update item quantity in cart
 * Endpoint: POST /api/cart/items
 * @param itemId - ID of the cart item (not used, kept for interface compatibility)
 * @param productId - UUID of the product
 * @param newQuantity - New quantity
 */
export const updateQuantityApi = async (
  productId: string,
  newQuantity: number
): Promise<Cart> => {
  const item: UpdateCartRequest = {
    productId,
    quantity: newQuantity,
  };
  return await API.cart.updateItem(item);
};

/**
 * Clear entire cart
 * Endpoint: DELETE /api/cart/items
 */
export const clearCartApi = async (): Promise<CartDTO> => {
  return await API.cart.clearCart();
};
