import rateLimit from "express-rate-limit";
import logger from "../utils/logger.js";

// General API limiter (e.g., 100 requests per 15 min per IP)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    message: "Too many requests from this IP, please try again later",
  },
  standardHeaders: true, // return rate limit info in headers
  legacyHeaders: false,
  onLimitReached: (req, res, options) => {
    logger.logSecurity('Rate limit exceeded - General API', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      limit: options.max,
      windowMs: options.windowMs
    });
  }
});

// Login limiter (stricter - 5 attempts per 10 minutes)
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: {
    message: "Too many login attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req, res, options) => {
    logger.logSecurity('Rate limit exceeded - Login attempts', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      limit: options.max,
      windowMs: options.windowMs,
      body: req.body // Log attempted credentials for security analysis
    });
  }
});
