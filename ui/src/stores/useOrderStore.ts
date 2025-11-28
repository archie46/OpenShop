import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Order } from '@/api/api';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  setCurrentOrder: (order: Order | null) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  clearOrders: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orders: [],
      currentOrder: null,

      setOrders: (orders) => set({ orders }),

      addOrder: (order) =>
        set((state) => ({
          orders: [order, ...state.orders],
        })),

      setCurrentOrder: (order) => set({ currentOrder: order }),

      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, status } : order
          ),
          currentOrder:
            state.currentOrder?.id === orderId
              ? { ...state.currentOrder, status }
              : state.currentOrder,
        })),

      clearOrders: () => set({ orders: [], currentOrder: null }),
    }),
    {
      name: 'order-storage',
    }
  )
);
