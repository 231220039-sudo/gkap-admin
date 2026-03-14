import { useState, useEffect } from 'react';
import { fetchInstagramPosts, InstagramPost } from '@/services/instagram';

interface UseInstagramFeedResult {
  posts: InstagramPost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * React hook to fetch and manage Instagram feed posts
 * @param limit - Number of posts to fetch (default: 6)
 * @returns Object containing posts, loading state, error, and refetch function
 */
export const useInstagramFeed = (limit: number = 6): UseInstagramFeedResult => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = import.meta.env.VITE_INSTAGRAM_ACCESS_TOKEN;

      if (!accessToken) {
        throw new Error(
          'Instagram access token not found. Please add VITE_INSTAGRAM_ACCESS_TOKEN to your .env file.'
        );
      }

      const instagramPosts = await fetchInstagramPosts(accessToken, limit);
      setPosts(instagramPosts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Instagram posts';
      setError(errorMessage);
      console.error('Instagram feed error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [limit]);

  return {
    posts,
    isLoading,
    error,
    refetch: fetchPosts,
  };
};
