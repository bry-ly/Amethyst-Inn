import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import logger from "../utils/logger.js";

// Protect routes (only logged-in users)
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        logger.logSecurity('Authentication failed - User not found', {
          tokenId: decoded.id,
          url: req.originalUrl,
          ip: req.ip
        });
        res.status(401);
        throw new Error("User not found");
      }

      logger.debug('User authenticated successfully', {
        userId: req.user._id,
        userRole: req.user.role,
        url: req.originalUrl
      });

      next();
    } catch (error) {
      logger.logSecurity('Authentication failed - Invalid token', {
        error: error.message,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(401);
      throw new Error("Not authorized, invalid token");
    }
  }

  if (!token) {
    logger.logSecurity('Authentication failed - No token provided', {
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

// Role-based access
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.logSecurity('Authorization failed - Insufficient role', {
        userId: req.user?._id,
        userRole: req.user?.role,
        requiredRoles: roles,
        url: req.originalUrl,
        ip: req.ip
      });
      res.status(403);
      throw new Error(`Not authorized as ${roles.join(" or ")}`);
    }
    
    logger.debug('User authorized for role-based access', {
      userId: req.user._id,
      userRole: req.user.role,
      requiredRoles: roles,
      url: req.originalUrl
    });
    
    next();
  };
};
export default { protect, authorizeRoles };