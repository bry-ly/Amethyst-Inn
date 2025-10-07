import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import logger from "../utils/logger.js";
import { cookieUtils } from "../middleware/cookieMiddleware.js";

/** 
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  logger.logAuth('User registration attempt', {
    email,
    name,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const userExists = await User.findOne({ email });
  if (userExists) {
    logger.logAuth('Registration failed - User already exists', {
      email,
      ip: req.ip
    });
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: "guest", // default role
  });

  if (user) {
    logger.logAuth('User registered successfully', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip
    });

    const token = generateToken(user._id);
    
    // Set secure cookie if user has given consent
    if (req.cookieConsent) {
      cookieUtils.setSecureCookie(res, 'auth_token', token);
    }

        res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: token, // Always send token in response for frontend storage
        });
  } else {
    logger.error('Registration failed - Invalid user data', null, {
      email,
      ip: req.ip
    });
    res.status(400);
    throw new Error("Invalid user data");
  }
});

/**
 * @desc    Login user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  logger.logAuth('User login attempt', {
    email,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    logger.logAuth('User login successful', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip
    });

    const token = generateToken(user._id);
    
    // Set secure cookie if user has given consent
    if (req.cookieConsent) {
      cookieUtils.setSecureCookie(res, 'auth_token', token);
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: token, // Always send token in response for frontend storage
    });
  } else {
    logger.logSecurity('Login failed - Invalid credentials', {
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

/**
 * @desc    Get logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  logger.debug('User profile accessed', {
    userId: req.user._id,
    userRole: req.user.role,
    ip: req.ip
  });
  res.json(req.user);
});

/**
 * @desc    Set cookie consent
 * @route   POST /api/auth/cookie-consent
 * @access  Public
 */
export const setCookieConsent = asyncHandler(async (req, res) => {
  const { consent } = req.body;
  
  logger.logAuth('Cookie consent updated', {
    consent: !!consent,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Set cookie consent cookie
  cookieUtils.setSecureCookie(res, 'cookie_consent', consent.toString(), {
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    httpOnly: false, // Allow frontend to read this
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  res.json({
    success: true,
    message: `Cookie consent ${consent ? 'granted' : 'denied'}`,
    consent: !!consent
  });
});
