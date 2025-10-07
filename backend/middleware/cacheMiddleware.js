// Simple in-memory cache middleware
const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 minutes

// Cache middleware for GET requests
export const cacheMiddleware = (duration = TTL) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < duration) {
      return res.json(cached.data);
    }

    // Store original send method
    const originalSend = res.send;
    const originalJson = res.json;

    // Override res.json to cache the response
    res.json = function(data) {
      cache.set(key, {
        data: data,
        timestamp: Date.now()
      });
      originalJson.call(this, data);
    };

    // Override res.send to cache the response
    res.send = function(data) {
      cache.set(key, {
        data: data,
        timestamp: Date.now()
      });
      originalSend.call(this, data);
    };

    next();
  };
};

// Get cache statistics
export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    entries: Array.from(cache.entries()).map(([key, value]) => ({
      key,
      timestamp: value.timestamp,
      age: Date.now() - value.timestamp
    }))
  };
};

// Clear cache
export const clearCache = () => {
  cache.clear();
};

// Room cache instance
export const roomCache = cacheMiddleware(2 * 60 * 1000); // 2 minutes
export const bookingCache = cacheMiddleware(1 * 60 * 1000); // 1 minute
export const userCache = cacheMiddleware(5 * 60 * 1000); // 5 minutes

export default { cacheMiddleware, getCacheStats, clearCache, roomCache, bookingCache, userCache };