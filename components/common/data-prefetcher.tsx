"use client";

import { useEffect } from 'react';
import { prefetchAllData, prefetchCommonData } from '@/utils/prefetch';
import { AuthTokenManager } from '@/utils/cookies';

export default function DataPrefetcher() {
  useEffect(() => {
    // Check if user is authenticated before prefetching
    const token = AuthTokenManager.getToken();
    
    if (token) {
      // User is authenticated, prefetch all data
      prefetchAllData();
      
      // Also prefetch again after a short delay to ensure data is fresh
      const timer = setTimeout(() => {
        prefetchAllData();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // User is not authenticated, only prefetch public data
      prefetchCommonData();
    }
  }, []);

  // This component doesn't render anything
  return null;
}
