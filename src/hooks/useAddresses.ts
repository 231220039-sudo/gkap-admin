import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  street_address: string;
  home_address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  tag: 'home' | 'office' | 'other';
  custom_tag?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch all addresses for user
export const useAddresses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      try {
        const { data } = await api.get<Address[]>('/addresses');
        return data;
      } catch (error: any) {
        console.error('Address fetch error:', error.response?.data || error.message);
        throw error;
      }
    },
    enabled: !!user,
    retry: 1,
  });
};

// Add address
export const useAddAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data } = await api.post<Address>('/addresses', address);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

// Update address
export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...address }: Partial<Address> & { id: string }) => {
      const { data } = await api.put<Address>(`/addresses/${id}`, address);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

// Delete address
export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/addresses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

// Set default address
export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Address>(`/addresses/${id}/set-default`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};
