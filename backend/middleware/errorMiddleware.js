import asyncHandler from "express-async-handler";
import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with context
  logger.error('Error occurred', err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query
  });

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = { message, statusCode: 404 };
    logger.warn('CastError - Invalid ObjectId', {
      path: err.path,
      value: err.value,
      url: req.originalUrl
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = { message, statusCode: 400 };
    logger.warn('Duplicate key error', {
      field: Object.keys(err.keyPattern)[0],
      value: err.keyValue[Object.keys(err.keyPattern)[0]],
      url: req.originalUrl
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, statusCode: 400 };
    logger.warn('Validation error', {
      errors: Object.keys(err.errors),
      url: req.originalUrl
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
    logger.warn('JWT validation failed', {
      url: req.originalUrl
    });
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
    logger.warn('JWT token expired', {
      url: req.originalUrl
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler for undefined routes
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export default errorHandler;
