import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseApiDataOptions {
  staleTime?: number; // Time in ms before data is considered stale
  cacheTime?: number; // Time in ms to keep data in cache
  refetchOnMount?: boolean; // Whether to refetch when component mounts
  refetchOnWindowFocus?: boolean; // Whether to refetch when window gains focus
  errorToastTitle?: string;
  disableErrorToast?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isLoading: boolean;
  error: string | null;
}

type FetchResult = {
  data: unknown;
  error: string | null;
};

// Global cache store
const cache = new Map<string, CacheEntry<unknown>>();

// Request deduplication store
const pendingRequests = new Map<string, Promise<FetchResult>>();

const getCacheEntry = <T,>(key: string): CacheEntry<T> | undefined => {
  return cache.get(key) as CacheEntry<T> | undefined;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === 'string' ? error : 'Unknown error';
};

export function useApiData<T>(
  url: string,
  options: UseApiDataOptions = {}
) {
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    refetchOnMount = true,
    refetchOnWindowFocus = false,
    errorToastTitle = 'Request failed',
    disableErrorToast = false,
  } = options;

  const cacheKey = url;
  const cachedEntry = getCacheEntry<T>(cacheKey);
  
  // Initialize state with cached data if available
  const [data, setData] = useState<T | null>(() => {
    if (cachedEntry && !cachedEntry.isLoading) {
      return cachedEntry.data;
    }
    return null;
  });
  
  const [loading, setLoading] = useState(() => {
    // Don't show loading if we have cached data
    if (cachedEntry && !cachedEntry.isLoading) {
      return false;
    }
    return true;
  });
  
  const [error, setError] = useState<string | null>(() => {
    if (cachedEntry && !cachedEntry.isLoading) {
      return cachedEntry.error;
    }
    return null;
  });
  
  const mountedRef = useRef(true);

  // Clean up expired cache entries
  const cleanExpiredCache = useCallback(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > cacheTime) {
        cache.delete(key);
      }
    }
  }, [cacheTime]);

  // Fetch data function with caching and deduplication
  const fetchData = useCallback(async (forceRefetch = false) => {
    // Check if request is already pending
    if (pendingRequests.has(cacheKey)) {
      try {
        const existingPromise = pendingRequests.get(cacheKey);
        if (existingPromise) {
          const result = await existingPromise;
          if (result && mountedRef.current) {
            setData(result.data as T);
            setLoading(false);
            setError(result.error);
          }
        }
        return;
      } catch {
        // Request failed, continue with new request
      }
    }

    // Check cache first
    const currentCachedEntry = getCacheEntry<T>(cacheKey);
    const currentTime = Date.now();
    
    if (currentCachedEntry && !forceRefetch) {
      const isStale = currentTime - currentCachedEntry.timestamp > staleTime;
      
      if (!isStale && !currentCachedEntry.isLoading) {
        // Use cached data immediately - don't set loading to false since it's already false
        if (mountedRef.current) {
          setData(prev => (prev !== currentCachedEntry.data ? currentCachedEntry.data : prev));
          setError(currentCachedEntry.error);
        }
        return;
      }
      
      // If data is stale but exists, show it while fetching in background
      if (currentCachedEntry.data && !currentCachedEntry.isLoading) {
        if (mountedRef.current) {
          setData(currentCachedEntry.data);
          setError(null);
          setLoading(false); // Show cached data immediately
        }
      }
    }

    // Create new request
    const requestPromise = (async () => {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        try {
          const token = localStorage.getItem('token');
          if (token) headers['authorization'] = `Bearer ${token}`;
        } catch {
          // ignore localStorage errors
        }

  const response = await fetch(url, { headers, credentials: 'same-origin' });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Failed to fetch: ${response.status}`;
          try {
            const parsed = JSON.parse(errorText);
            errorMessage = parsed?.error || parsed?.message || errorMessage;
          } catch {
            if (errorText) {
              errorMessage = `${errorMessage} ${errorText}`.trim();
            }
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        
        // Check if the response is an error object
        if (result && typeof result === 'object' && (result.error || result.success === false)) {
          const errorMessage = result.error || 'API returned an error';
          throw new Error(errorMessage);
        }
        
        // Update cache
        const timestamp = Date.now();
        cache.set(cacheKey, {
          data: result,
          timestamp,
          isLoading: false,
          error: null,
        });

        return { data: result as unknown, error: null };
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        if (!disableErrorToast) {
          toast.error(errorMessage, { description: errorToastTitle });
        }

        const timestamp = Date.now();
        // Cache error state
        cache.set(cacheKey, {
          data: null,
          timestamp,
          isLoading: false,
          error: errorMessage,
        });

        throw new Error(errorMessage);
      } finally {
        // Remove from pending requests
        pendingRequests.delete(cacheKey);
      }
    })();

    // Store pending request
    pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      if (mountedRef.current) {
        setData(result.data as T);
        setLoading(false);
        setError(result.error);
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      if (mountedRef.current) {
        setData(null);
        setLoading(false);
        setError(errorMessage);
      }
    }
  }, [url, cacheKey, staleTime, disableErrorToast, errorToastTitle]);

  // Refetch function
  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchData(true);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    if (refetchOnMount) {
      // Only fetch if we don't have cached data or if cached data is stale
      const currentCachedEntry = cache.get(cacheKey);
      const currentTime = Date.now();
      
      if (!currentCachedEntry || 
          currentCachedEntry.isLoading || 
          currentTime - currentCachedEntry.timestamp > staleTime) {
        fetchData();
      }
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData, refetchOnMount, cacheKey, staleTime]);

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData, refetchOnWindowFocus]);

  // Cleanup expired cache periodically
  useEffect(() => {
    const interval = setInterval(cleanExpiredCache, 60000); // Every minute
    return () => clearInterval(interval);
  }, [cleanExpiredCache]);

  return {
    data,
    loading,
    error,
    refetch,
    isStale: (() => {
      const cachedEntry = cache.get(cacheKey);
      if (!cachedEntry) return false;
      return Date.now() - cachedEntry.timestamp > staleTime;
    })(),
  };
}

// Hook for mutations (POST, PUT, DELETE)
export function useApiMutation<T, K = unknown>(
  url: string,
  options: {
    method?: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    invalidateKeys?: string[]; // Cache keys to invalidate after mutation
    successToastTitle?: string;
    disableSuccessToast?: boolean;
    errorToastTitle?: string;
    disableErrorToast?: boolean;
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    method = 'POST',
    onSuccess,
    onError,
    invalidateKeys,
    successToastTitle,
    disableSuccessToast,
    errorToastTitle,
    disableErrorToast,
  } = options;

  const mutate = useCallback(async (payload?: K) => {
    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('token');
        if (token) headers['authorization'] = `Bearer ${token}`;
      } catch {
        // ignore localStorage errors
      }

      const response = await fetch(url, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to ${method}: ${response.status}`;
        try {
          const parsed = JSON.parse(errorText);
          errorMessage = parsed?.error || parsed?.message || errorMessage;
        } catch {
          if (errorText) {
            errorMessage = `${errorMessage} ${errorText}`.trim();
          }
        }
        throw new Error(errorMessage);
      }

      const result = (await response.json()) as T;

      // Invalidate specified cache keys
      if (invalidateKeys) {
        invalidateKeys.forEach(key => {
          cache.delete(key);
        });
      }

      onSuccess?.(result);
      if (!disableSuccessToast) {
        toast.success(successToastTitle || 'Action completed');
      }
      return result;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      onError?.(errorMessage);
      if (!disableErrorToast) {
        toast.error(errorMessage, {
          description: errorToastTitle || 'Request failed',
        });
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [url, method, disableErrorToast, disableSuccessToast, errorToastTitle, invalidateKeys, onError, onSuccess, successToastTitle]);

  return {
    mutate,
    loading,
    error,
  };
}

// Utility function to clear cache
export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// Utility function to prefetch data
export function prefetchData(url: string) {
  const cacheKey = url;
  const cachedEntry = cache.get(cacheKey);
  const now = Date.now();
  
  // If data is stale or doesn't exist, prefetch
  if (!cachedEntry || now - cachedEntry.timestamp > 5 * 60 * 1000) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const token = localStorage.getItem('token');
      if (token) headers['authorization'] = `Bearer ${token}`;
    } catch (e) {
      // ignore localStorage errors
    }

    fetch(url, { headers, credentials: 'same-origin' })
      .then(response => response.json())
      .then(data => {
        cache.set(cacheKey, {
          data,
          timestamp: now,
          isLoading: false,
          error: null,
        });
      })
      .catch(() => {
        // Silent fail for prefetch
      });
  }
}
