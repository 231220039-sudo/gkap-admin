import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Product } from './useProducts';

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  selected_size: string;
  selected_color: string;
  products?: Product;
}

// Fetch cart
export const useCart = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        console.log('Cart fetch - User:', user?.id, 'Token exists:', !!token);
        
        const { data } = await api.get<CartItem[]>('/cart');
        return data;
      } catch (error: any) {
        console.error('Cart fetch error:', error.response?.status, error.response?.data);
        throw error;
      }
    },
    retry: 1,
    enabled: !!user, // Only fetch if user is authenticated
  });
};

// Add to cart
export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (item: {
      product_id: string;
      quantity: number;
      selected_size: string;
      selected_color: string;
    }) => {
      try {
        if (!user) {
          toast({
            title: 'Sign in required',
            description: 'Please sign in to add items to your cart.',
          });
          navigate('/login');
          throw new Error('AUTH_REQUIRED');
        }
        console.log('Adding to cart:', item);
        const { data } = await api.post<CartItem>('/cart', item);
        console.log('Add to cart success:', data);
        return data;
      } catch (error: any) {
        console.error('Add to cart error:', error.response?.status, error.response?.data);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      console.error('Mutation error:', error.response?.data || error.message);
    },
  });
};

// Update cart item
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { data } = await api.put<CartItem>(`/cart/${id}`, { quantity });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

// Remove from cart
export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

// Clear cart
export const useClearCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await api.delete('/cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};
