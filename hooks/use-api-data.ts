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

// Global cache store
const cache = new Map<string, CacheEntry<any>>();

// Request deduplication store
const pendingRequests = new Map<string, Promise<any>>();

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
  const cachedEntry = cache.get(cacheKey);
  const now = Date.now();
  
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
        const result = await pendingRequests.get(cacheKey);
        if (mountedRef.current) {
          setData(result.data);
          setLoading(false);
          setError(result.error);
        }
        return;
      } catch (err) {
        // Request failed, continue with new request
      }
    }

    // Check cache first
    const currentCachedEntry = cache.get(cacheKey);
    const currentTime = Date.now();
    
    if (currentCachedEntry && !forceRefetch) {
      const isStale = currentTime - currentCachedEntry.timestamp > staleTime;
      
      if (!isStale && !currentCachedEntry.isLoading) {
        // Use cached data immediately - don't set loading to false since it's already false
        if (mountedRef.current && data !== currentCachedEntry.data) {
          setData(currentCachedEntry.data);
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
        } catch (e) {
          // ignore localStorage errors
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          let errorText = await response.text();
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

        return { data: result, error: null };
      } catch (err: any) {
        const errorMessage = err?.message || 'Unknown error';
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

        throw { data: null, error: errorMessage };
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
        setData(result.data);
        setLoading(false);
        setError(result.error);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setData(null);
        setLoading(false);
        setError(err.error || err.message || 'Unknown error');
      }
    }
  }, [url, cacheKey, staleTime]);

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
export function useApiMutation<T, K = any>(
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

  const mutate = useCallback(async (payload?: K) => {
    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('token');
        if (token) headers['authorization'] = `Bearer ${token}`;
      } catch (e) {
        // ignore localStorage errors
      }

      const response = await fetch(url, {
        method: options.method || 'POST',
        headers,
        body: payload ? JSON.stringify(payload) : undefined,
      });

      if (!response.ok) {
        let errorText = await response.text();
        let errorMessage = `Failed to ${options.method || 'POST'}: ${response.status}`;
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

      // Invalidate specified cache keys
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => {
          cache.delete(key);
        });
      }

      options.onSuccess?.(result);
      if (!options.disableSuccessToast) {
        toast.success(options.successToastTitle || 'Action completed');
      }
      return result;
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error';
      setError(errorMessage);
      options.onError?.(errorMessage);
      if (!options.disableErrorToast) {
        toast.error(errorMessage, {
          description: options.errorToastTitle || 'Request failed',
        });
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, options]);

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

    fetch(url, { headers })
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
