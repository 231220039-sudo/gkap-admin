import { useQuery } from '@tanstack/react-query';
import api from '@/config/api';

export interface TshirtType {
  id: string;
  type_id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  is_active: boolean;
  display_order: number;
}

export interface TshirtColor {
  id: string;
  color_id: string;
  name: string;
  hex_code: string;
  is_active: boolean;
  display_order: number;
}

// Fetch all t-shirt types
export const useTshirtTypes = () => {
  return useQuery({
    queryKey: ['tshirtTypes'],
    queryFn: async () => {
      const { data } = await api.get<TshirtType[]>('/tshirt-options/types');
      return data;
    },
  });
};

// Fetch all t-shirt colors
export const useTshirtColors = () => {
  return useQuery({
    queryKey: ['tshirtColors'],
    queryFn: async () => {
      const { data } = await api.get<TshirtColor[]>('/tshirt-options/colors');
      return data;
    },
  });
};
