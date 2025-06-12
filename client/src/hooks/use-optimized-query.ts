import { useQuery, UseQueryOptions } from '@tanstack/react-query';

// Optimized query hook with performance defaults
export function useOptimizedQuery<TData = unknown, TError = Error>(
  options: UseQueryOptions<TData, TError>
) {
  return useQuery({
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
}

// Fast query for critical data
export function useFastQuery<TData = unknown, TError = Error>(
  options: UseQueryOptions<TData, TError>
) {
  return useQuery({
    staleTime: 10000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    retry: 1,
    ...options,
  });
}

// Background query for non-critical data
export function useBackgroundQuery<TData = unknown, TError = Error>(
  options: UseQueryOptions<TData, TError>
) {
  return useQuery({
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 0,
    ...options,
  });
}