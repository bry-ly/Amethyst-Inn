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

// Profile update limiter (e.g., 10 updates per 15 minutes)
export const profileUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: "Profile update limit reached. Please wait before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req, res, options) => {
    logger.logSecurity('Rate limit exceeded - Profile updates', {
      ip: req.ip,
      userId: req.user?._id,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      limit: options.max,
      windowMs: options.windowMs
    });
  }
});

// Booking creation limiter (limit new bookings burst)
export const bookingCreationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: {
    message: "Too many booking attempts. Please wait a few minutes before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req, res, options) => {
    logger.logSecurity('Rate limit exceeded - Booking creation', {
      ip: req.ip,
      userId: req.user?._id,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      limit: options.max,
      windowMs: options.windowMs
    });
  }
});

// Booking mutation limiter (updates/cancel/delete)
export const bookingMutationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    message: "Booking update limit reached. Please slow down and try again shortly.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req, res, options) => {
    logger.logSecurity('Rate limit exceeded - Booking mutation', {
      ip: req.ip,
      userId: req.user?._id,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      limit: options.max,
      windowMs: options.windowMs
    });
  }
});

// Reservation creation limiter
export const reservationCreationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many reservation attempts. Please wait a moment and try again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req, res, options) => {
    logger.logSecurity('Rate limit exceeded - Reservation creation', {
      ip: req.ip,
      userId: req.user?._id,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      limit: options.max,
      windowMs: options.windowMs
    });
  }
});

// Reservation mutation limiter (confirm/cancel/delete/convert)
export const reservationMutationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 12,
  message: {
    message: "Reservation update limit reached. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req, res, options) => {
    logger.logSecurity('Rate limit exceeded - Reservation mutation', {
      ip: req.ip,
      userId: req.user?._id,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      limit: options.max,
      windowMs: options.windowMs
    });
  }
});

// Admin mutation limiter for sensitive resources (rooms, users, etc.)
export const adminMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    message: "Too many administrative updates in a short period.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req, res, options) => {
    logger.logSecurity('Rate limit exceeded - Admin mutation', {
      ip: req.ip,
      userId: req.user?._id,
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
