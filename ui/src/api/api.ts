/**
 * OpenShop API Client
 * Complete API service layer matching OpenAPI YAML specification
 * Base URL: http://localhost:8080
 */

import axios, { type AxiosInstance, AxiosError } from 'axios';

// ============================================================================
// TYPES & INTERFACES (Matching YAML Specification)
// ============================================================================

// User & Auth Types
export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserDTO {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username?: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
  user: UserDTO;
}

// Product Types (GraphQL)
export const ProductStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  OUT_OF_STOCK: 'OUT_OF_STOCK'
} as const;

export type ProductStatusType = typeof ProductStatus[keyof typeof ProductStatus];

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  sku: string;
  sellerId: number;
  imageUrl?: string;
  status: ProductStatusType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  sku: string;
  imageUrl?: string;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: string;
  sku?: string;
  imageUrl?: string;
  status?: ProductStatusType;
}

// GraphQL Types
export interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export interface GraphQLProductResponse {
  success: boolean;
  message?: string;
  product?: Product;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface GraphQLProductsConnection {
  edges: Array<{
    node: Product;
    cursor: string;
  }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  };
  totalCount: number;
}

// Cart Types
export interface CartItem {
  id?: number; // Optional - not present in CartDTO
  productId: string;
  quantity: number;
  price: number;
}

export interface Cart {
  id?: number; // Optional - not present in CartDTO
  userId: number;
  items: CartItem[];
  createdAt?: string; // Optional - not present in CartDTO
  updatedAt?: string; // Optional - not present in CartDTO
}

export interface UpdateCartRequest {
  productId: string;
  quantity: number;
}

// Order Types
export type OrderStatus = 'PENDING' | 'PAYMENT_INITIATED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  productId: string;
  productName: string | null;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: number | null;
  status: OrderStatus;
  totalPrice: number;
  currency: string;
  items: OrderItem[];
  checkoutBatchId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CartDTO {
  userId: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
}

// Payment Types
export type PaymentStatus = 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PENDING' ;

export interface Payment {
  id: string;
  orderId: string;
  userId: number;
  amount: number;
  status: PaymentStatus;
  transactionId?: string;
  timestamp: string;
  idempotencyKey?: string;
}

export interface InitiatePaymentRequest {
  orderId: string;
  userId: number;
  status?: PaymentStatus;
}

export interface PaymentRequest {
  orderId: string;
  userId: number;
  status: string;
  amount?: number;
}

export interface PaymentWebhookDTO {
  orderId: string;
  status: string;
  transactionId: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  signature?: string;
  timestamp?: number;
}

export interface CreateOrderRequest {
  shippingAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phoneNumber?: string;
}

// Inventory Types
export interface Inventory {
  id: number;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryRequest {
  productId: string;
  quantity: number;
}

// Notification Types
export type NotificationType = 'IN_APP' | 'EMAIL' | 'SMS';

export interface Notification {
  id: number;
  userId: number;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export interface NotificationRequest {
  userId: number;
  message: string;
  type?: NotificationType;
}

// Shipping Types
export type ShipmentStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';

export interface Shipment {
  id: string;
  orderId: string;
  userId: number;
  address: string;
  status: ShipmentStatus;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
}

// ============================================================================
// AXIOS INSTANCE CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage on initialization
    this.loadToken();

    // Request interceptor - Add auth token and custom headers
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          // Unauthorized - clear token
          this.clearToken();
          // Redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  setToken(token: string, userId: number, userRole: UserRole) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_id', userId.toString());
      localStorage.setItem('user_role', userRole);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
    }
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const userId = localStorage.getItem('user_id');
      const userRole = localStorage.getItem('user_role');
      if (token && userId && userRole) {
        this.token = token;
      }
    }
  }

  getInstance() {
    return this.client;
  }
}

// Create singleton instance
const apiClient = new ApiClient();
const client = apiClient.getInstance();

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API = {
  // ========================================
  // AUTHENTICATION APIs
  // ========================================
  auth: {
    /**
     * User Login (supports username or email)
     */
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
      const { data } = await client.post<AuthResponse>('/api/auth/login', credentials);
      apiClient.setToken(data.token, data.user.id, data.user.role);
      return data;
    },

    /**
     * User Registration
     */
    register: async (userData: RegisterRequest): Promise<AuthResponse> => {
      const { data } = await client.post<AuthResponse>('/api/auth/register', userData);
      return data;
    },

    /**
     * Logout
     */
    logout: () => {
      apiClient.clearToken();
    },
  },

  // ========================================
  // USER PROFILE APIs
  // ========================================
  users: {
    /**
     * Get My Profile (Authenticated User)
     */
    getMyProfile: async (): Promise<UserDTO> => {
      const { data } = await client.get<UserDTO>('/api/users/me');
      return data;
    },

    /**
     * Update My Profile
     */
    updateMyProfile: async (userData: Partial<User>): Promise<UserDTO> => {
      const { data } = await client.put<UserDTO>('/api/users/me', userData);
      return data;
    },
  },

  // ========================================
  // PRODUCT APIs (REST)
  // ========================================
  products: {
    /**
     * Get All Products
     */
    getAll: async (): Promise<Product[]> => {
      const { data } = await client.get<Product[]>('/api/products');
      return data;
    },

    /**
     * Get Product by ID
     */
    getById: async (id: string): Promise<Product> => {
      const { data } = await client.get<Product>(`/api/products/${id}`);
      return data;
    },

    /**
     * Create Product (SELLER only)
     */
    create: async (product: CreateProductInput): Promise<Product> => {
      const { data } = await client.post<Product>('/api/products', product);
      return data;
    },

    /**
     * Update Product (SELLER only)
     */
    update: async (id: string, product: UpdateProductInput): Promise<Product> => {
      const { data } = await client.put<Product>(`/api/products/${id}`, product);
      return data;
    },
  },

  // ========================================
  // GRAPHQL APIs (Products - Legacy)
  // ========================================
  graphql: {
    /**
     * Execute GraphQL Query/Mutation
     */
    execute: async <T = unknown>(request: GraphQLRequest): Promise<GraphQLResponse<T>> => {
      const { data } = await client.post<GraphQLResponse<T>>('/graphql/products', request);
      return data;
    },

    /**
     * Get Single Product by ID
     */
    getProduct: async (id: string): Promise<Product> => {
      const request: GraphQLRequest = {
        query: `
          query GetProduct($id: ID!) {
            product(id: $id) {
              id
              name
              description
              price
              currency
              category
              imageUrl
              status
              sku
              sellerId
              createdAt
              updatedAt
            }
          }
        `,
        variables: { id },
      };
      const response = await API.graphql.execute<{ product: Product }>(request);
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      return response.data!.product;
    },

    /**
     * Get All Products with Pagination
     */
    getProducts: async (first?: number, after?: string): Promise<GraphQLProductsConnection> => {
      const request: GraphQLRequest = {
        query: `
          query GetProducts($first: Int, $after: String) {
            products(first: $first, after: $after) {
              edges {
                node {
                  id
                  name
                  description
                  price
                  currency
                  category
                  imageUrl
                  status
                  sku
                  sellerId
                  createdAt
                  updatedAt
                }
                cursor
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
              totalCount
            }
          }
        `,
        variables: { first, after },
      };
      const response = await API.graphql.execute<{ products: GraphQLProductsConnection }>(request);
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      return response.data!.products;
    },

    /**
     * Search Products
     */
    searchProducts: async (query: string, category?: string, first?: number): Promise<GraphQLProductsConnection> => {
      const request: GraphQLRequest = {
        query: `
          query SearchProducts($query: String!, $category: String, $first: Int) {
            searchProducts(query: $query, category: $category, first: $first) {
              edges {
                node {
                  id
                  name
                  description
                  price
                  currency
                  category
                  imageUrl
                  status
                }
              }
              totalCount
            }
          }
        `,
        variables: { query, category, first },
      };
      const response = await API.graphql.execute<{ searchProducts: GraphQLProductsConnection }>(request);
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      return response.data!.searchProducts;
    },

    /**
     * Get My Products (SELLER only)
     */
    getMyProducts: async (): Promise<Product[]> => {
      const request: GraphQLRequest = {
        query: `
          query MyProducts {
            myProducts {
              id
              name
              description
              price
              currency
              category
              imageUrl
              status
              sku
              createdAt
              updatedAt
            }
          }
        `,
      };
      const response = await API.graphql.execute<{ myProducts: Product[] }>(request);
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      return response.data!.myProducts;
    },

    /**
     * Create Product (SELLER only)
     */
    createProduct: async (input: CreateProductInput): Promise<GraphQLProductResponse> => {
      const request: GraphQLRequest = {
        query: `
          mutation CreateProduct($input: CreateProductInput!) {
            createProduct(input: $input) {
              success
              message
              product {
                id
                name
                description
                price
                currency
                category
                imageUrl
                status
                sku
                sellerId
                createdAt
                updatedAt
              }
              errors {
                field
                message
              }
            }
          }
        `,
        variables: { input },
      };
      const response = await API.graphql.execute<{ createProduct: GraphQLProductResponse }>(request);
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      return response.data!.createProduct;
    },

    /**
     * Update Product (SELLER only)
     */
    updateProduct: async (id: string, input: UpdateProductInput): Promise<GraphQLProductResponse> => {
      const request: GraphQLRequest = {
        query: `
          mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
            updateProduct(id: $id, input: $input) {
              success
              message
              product {
                id
                name
                description
                price
                currency
                category
                imageUrl
                status
                updatedAt
              }
            }
          }
        `,
        variables: { id, input },
      };
      const response = await API.graphql.execute<{ updateProduct: GraphQLProductResponse }>(request);
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      return response.data!.updateProduct;
    },

    /**
     * Delete Product (SELLER only)
     */
    deleteProduct: async (id: string): Promise<{ success: boolean; message?: string }> => {
      const request: GraphQLRequest = {
        query: `
          mutation DeleteProduct($id: ID!) {
            deleteProduct(id: $id) {
              success
              message
            }
          }
        `,
        variables: { id },
      };
      const response = await API.graphql.execute<{ deleteProduct: { success: boolean; message?: string } }>(request);
      if (response.errors) {
        throw new Error(response.errors[0].message);
      }
      return response.data!.deleteProduct;
    },
  },

  // ========================================
  // CART APIs
  // ========================================
  cart: {
    /**
     * Get User's Cart
     */
    getCart: async (): Promise<CartDTO> => {
      const { data } = await client.get<CartDTO>('/api/cart');
      return data;
    },

    /**
     * Add Item to Cart
     */
    updateItem: async (item: UpdateCartRequest): Promise<Cart> => {
      const { data } = await client.post<Cart>('/api/cart/items', item);
      return data;
    },

    /**
     * Clear Cart
     */
    clearCart: async (): Promise<CartDTO> => {
      const { data } = await client.delete<CartDTO>('/api/cart/items');
      return data;
    },
  },

  // ========================================
  // ORDER APIs
  // ========================================
  orders: {
    /**
     * Create Order (Checkout)
     */
    create: async (request?: CreateOrderRequest, idempotencyKey?: string): Promise<Order> => {
      const headers: Record<string, string> = {};
      if (idempotencyKey) {
        headers['X-Idempotency-Key'] = idempotencyKey;
      }
      const { data } = await client.post<Order>('/api/orders', request, { headers });
      return data;
    },

    /**
     * Get User's Orders
     */
    getUserOrders: async (): Promise<Order[]> => {
      const { data } = await client.get<Order[]>('/api/orders/user');
      return data;
    },

    /**
     * Get Order By ID
     */
    getById: async (orderId: string): Promise<Order> => {
      const { data } = await client.get<Order>(`/api/orders/${orderId}`);
      return data;
    },

    /**
     * Cancel Order
     */
    cancelOrder: async (orderId: string): Promise<Order> => {
      const { data } = await client.post<Order>(`/api/orders/${orderId}/cancel`);
      return data;
    },
  },

  // ========================================
  // PAYMENT APIs
  // ========================================
  payments: {
    /**
     * Initiate Payment
     */
    initiate: async (paymentData: InitiatePaymentRequest, idempotencyKey?: string): Promise<PaymentRequest> => {
      const headers: Record<string, string> = {};
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }
      const { data } = await client.post<PaymentRequest>('/api/payments', paymentData, { headers });
      return data;
    },

    /**
     * Get Payment Status
     */
    getStatus: async (orderId: string): Promise<Payment | null> => {
      const { data } = await client.get<Payment>(`/api/payments/${orderId}`);
      return data;
    },

    /**
     * Payment Webhook Handler
     */
    webhook: async (webhookData: PaymentWebhookDTO): Promise<string> => {
      const { data } = await client.post<string>('/api/payments/webhook', webhookData);
      return data;
    },
  },

  // ========================================
  // INVENTORY APIs (Seller)
  // ========================================
  inventory: {
    /**
     * Create or Update Inventory for Product (SELLER only)
     */
    updateInventory: async (inventoryData: InventoryRequest): Promise<Inventory> => {
      const { data } = await client.post<Inventory>('/api/inventory', inventoryData);
      return data;
    },

    /**
     * Get Inventory for Product (Public)
     */
    getByProductId: async (productId: string): Promise<Inventory> => {
      const { data } = await client.get<Inventory>(`/api/inventory/${productId}`);
      return data;
    },
  },

  // ========================================
  // SHIPPING APIs
  // ========================================
  shipping: {
    /**
     * Create Shipment
     */
    createShipment: async (orderId: string, address: string): Promise<Shipment> => {
      const { data } = await client.post<Shipment>('/api/shipping', null, {
        params: { orderId, address },
      });
      return data;
    },

    /**
     * Get Shipment by Order ID
     */
    getByOrderId: async (orderId: string): Promise<Shipment> => {
      const { data } = await client.get<Shipment>(`/api/shipping/${orderId}`);
      return data;
    },

    /**
     * Update Shipment Status (SELLER or ADMIN)
     */
    updateStatus: async (shipmentId: string, status: string): Promise<Shipment> => {
      const { data } = await client.put<Shipment>(`/api/shipping/${shipmentId}/status`, null, {
        params: { status },
      });
      return data;
    },
  },

};

// ============================================================================
// EXPORT
// ============================================================================

export default API;

// Export the API client instance for advanced use cases
export { apiClient };

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Example 1: Login
try {
  const authResponse = await API.auth.login({
    username: 'johndoe',
    password: 'password123'
  });
  console.log('Logged in:', authResponse.user);
} catch (error) {
  console.error('Login failed:', error);
}

// Example 2: Get Products via GraphQL
try {
  const productsConnection = await API.graphql.getProducts(10);
  const products = productsConnection.edges.map(edge => edge.node);
  console.log('Products:', products);
} catch (error) {
  console.error('Failed to fetch products:', error);
}

// Example 3: Search Products
try {
  const results = await API.graphql.searchProducts('laptop', 'electronics', 10);
  console.log('Search results:', results);
} catch (error) {
  console.error('Search failed:', error);
}

// Example 4: Add to Cart
try {
  const cart = await API.cart.addItem({
    productId: 'product-uuid',
    quantity: 2
  });
  console.log('Updated cart:', cart);
} catch (error) {
  console.error('Failed to add to cart:', error);
}

// Example 5: Checkout
try {
  const order = await API.cart.checkout();
  console.log('Order created:', order);
} catch (error) {
  console.error('Checkout failed:', error);
}

// Example 6: Get My Orders
try {
  const orders = await API.orders.getUserOrders();
  console.log('My orders:', orders);
} catch (error) {
  console.error('Failed to fetch orders:', error);
}

// Example 7: Create Product (Seller)
try {
  const result = await API.graphql.createProduct({
    name: 'Gaming Laptop',
    description: 'High-performance gaming laptop',
    category: 'electronics',
    price: 1299.99,
    currency: 'USD',
    sku: 'LAP-001',
    imageUrl: 'https://example.com/laptop.jpg'
  });
  console.log('Product created:', result);
} catch (error) {
  console.error('Failed to create product:', error);
}

// Example 8: Initiate Payment
try {
  const payment = await API.payments.initiate({
    orderId: 'order-uuid',
    userId: 1,
    amount: 1299.99,
    status: 'PENDING'
  });
  console.log('Payment initiated:', payment);
} catch (error) {
  console.error('Payment initiation failed:', error);
}
*/
