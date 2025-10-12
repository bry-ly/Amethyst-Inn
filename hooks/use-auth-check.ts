import { useState, useEffect, useCallback } from 'react';

// Shared cache for auth status
let cachedAuthStatus: boolean | null = null;
let cacheTimestamp: number = 0;
let pendingRequest: Promise<boolean> | null = null;
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Hook to check if user is authenticated
 * Uses caching to prevent multiple simultaneous API calls
 */
export function useAuthCheck() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    const now = Date.now();
    
    // Return cached value if still valid
    if (cachedAuthStatus !== null && now - cacheTimestamp < CACHE_DURATION) {
      return cachedAuthStatus;
    }

    // If there's already a pending request, wait for it
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create new request
    pendingRequest = (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
        });
        
        if (!res.ok) {
          cachedAuthStatus = false;
          cacheTimestamp = now;
          return false;
        }
        
        const data = await res.json().catch(() => null);
        const authenticated = Boolean(data && (data._id || data.id || data.email));
        
        cachedAuthStatus = authenticated;
        cacheTimestamp = now;
        
        return authenticated;
      } catch (_e) {
        cachedAuthStatus = false;
        cacheTimestamp = now;
        return false;
      } finally {
        pendingRequest = null;
      }
    })();

    return pendingRequest;
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const performCheck = async () => {
      setIsLoading(true);
      const result = await checkAuth();
      if (mounted) {
        setIsAuthenticated(result);
        setIsLoading(false);
      }
    };

    performCheck();

    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  return { isAuthenticated, isLoading, checkAuth };
}

/**
 * Clear the auth cache (useful for logout)
 */
export function clearAuthCache() {
  cachedAuthStatus = null;
  cacheTimestamp = 0;
  pendingRequest = null;
}
