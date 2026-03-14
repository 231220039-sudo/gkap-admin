import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/config/api';

export interface CustomDesign {
  id: string;
  user_id: string;
  image_url: string;
  tshirt_type: string;
  tshirt_color: string;
  size: string;
  print_location: string;
  quantity: number;
  image_scale: number;
  image_rotation: number;
  status: string;
  created_at: string;
  price?: number;
}

// Fetch all custom designs
export const useCustomDesigns = () => {
  return useQuery({
    queryKey: ['customDesigns'],
    queryFn: async () => {
      const { data } = await api.get<CustomDesign[]>('/customize');
      return data;
    },
  });
};

// Fetch single design
export const useCustomDesign = (id: string) => {
  return useQuery({
    queryKey: ['customDesign', id],
    queryFn: async () => {
      const { data } = await api.get<CustomDesign>(`/customize/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

// Upload custom design
export const useUploadDesign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('access_token');
      const { data } = await api.post<CustomDesign>('/customize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customDesigns'] });
    },
  });
};

// Delete design
export const useDeleteDesign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customize/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customDesigns'] });
    },
  });
};
