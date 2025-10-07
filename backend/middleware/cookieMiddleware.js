import cookieParser from 'cookie-parser';
import logger from '../utils/logger.js';

// Enhanced cookie parser middleware
export const cookieMiddleware = cookieParser();

// Custom cookie utilities
export const cookieUtils = {
  // Parse cookies from request
  parseCookies: (req) => {
    const cookies = {};
    if (req.cookies) {
      Object.assign(cookies, req.cookies);
    }
    return cookies;
  },

  // Set secure cookie
  setSecureCookie: (res, name, value, options = {}) => {
    const defaultOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    };

    const cookieOptions = { ...defaultOptions, ...options };
    res.cookie(name, value, cookieOptions);
    
    logger.debug('Cookie set', {
      name,
      value: value ? '***' : 'empty',
      options: cookieOptions
    });
  },

  // Clear cookie
  clearCookie: (res, name, options = {}) => {
    const defaultOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/'
    };

    const cookieOptions = { ...defaultOptions, ...options };
    res.clearCookie(name, cookieOptions);
    
    logger.debug('Cookie cleared', {
      name,
      options: cookieOptions
    });
  },

  // Get cookie value safely
  getCookie: (req, name, defaultValue = null) => {
    const value = req.cookies?.[name];
    return value !== undefined ? value : defaultValue;
  },

  // Check if cookie exists
  hasCookie: (req, name) => {
    return req.cookies?.[name] !== undefined;
  }
};

// Cookie consent middleware
export const cookieConsentMiddleware = (req, res, next) => {
  // Check if user has given cookie consent
  const hasConsent = cookieUtils.getCookie(req, 'cookie_consent', false);
  
  // Add consent status to request
  req.cookieConsent = hasConsent === 'true' || hasConsent === true;
  
  logger.debug('Cookie consent check', {
    hasConsent: req.cookieConsent,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  next();
};

export default cookieMiddleware;
