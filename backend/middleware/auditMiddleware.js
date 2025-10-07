import logger from '../utils/logger.js';

// Audit logging middleware for CRUD operations
export const auditCRUD = (req, res, next) => {
  // Store original methods
  const originalSend = res.send;
  const originalJson = res.json;

  // Override res.send to capture response
  res.send = function(data) {
    // Log the operation
    if (req.method !== 'GET') {
      logger.logDB('CRUD Operation', {
        method: req.method,
        url: req.originalUrl,
        user: req.user ? req.user._id : 'anonymous',
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      });
    }
    
    // Call original method
    originalSend.call(this, data);
  };

  // Override res.json to capture response
  res.json = function(data) {
    // Log the operation
    if (req.method !== 'GET') {
      logger.logDB('CRUD Operation', {
        method: req.method,
        url: req.originalUrl,
        user: req.user ? req.user._id : 'anonymous',
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      });
    }
    
    // Call original method
    originalJson.call(this, data);
  };

  next();
};

export default auditCRUD;