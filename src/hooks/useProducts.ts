import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/config/api';

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
  color?: string;
}

export interface Product {
  image_url: string;
  id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  category: string;
  collection: string;
  colors: string[];
  sizes: string[];
  fit: string;
  stock: number;
  is_new?: boolean;
  is_bestseller?: boolean;
  created_at?: string;
  product_images?: ProductImage[];
}

// Fetch all products
export const useProducts = (filters?: {
  category?: string;
  collection?: string;
  sortBy?: string;
}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.collection) params.append('collection', filters.collection);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);

      // Fetch products with nested product_images (ordered)
      const { data } = await api.get<Product[]>(
        `/products?${params.toString()}`
      );
      // If backend returns 'images', map to 'product_images' for compatibility
      return data?.map((p: any) => ({
        ...p,
        product_images: p.product_images || p.images || [],
      })) || [];
    },
  });
};

// Fetch single product
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await api.get<Product>(`/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

// Create product (admin)
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Partial<Product>) => {
      const { data } = await api.post<Product>('/products', product);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// Update product (admin)
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, product }: { id: string; product: Partial<Product> }) => {
      const { data } = await api.put<Product>(`/products/${id}`, product);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
