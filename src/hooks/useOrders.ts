import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/config/api';

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  shipping_address: any;
  shipping_method: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  size: string;
  color: string;
  price: number;
  products?: any;
}

// Fetch all orders
export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get<Order[]>('/orders');
      return data;
    },
  });
};

// Fetch single order
export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get<Order>(`/orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

// Create order
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData: {
      items: any[];
      shipping_address: any;
      shipping_method: string;
      payment_method: string;
      subtotal: number;
      shipping_cost: number;
      tax: number;
      total: number;
    }) => {
      const { data } = await api.post<Order>('/orders', orderData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};
