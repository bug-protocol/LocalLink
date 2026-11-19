const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'locallink_dev_secret_key_change_in_production_min32chars');
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user no longer exists.'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role(s). Admin users have superuser access.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    // Superuser access for admins or match requested roles
    if (req.user.role === 'admin' || roles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}`
    });
  };
};

/**
 * Optional Authentication Middleware
 * Attaches user if valid token is provided, but doesn't block if missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'locallink_dev_secret_key_change_in_production_min32chars');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

/**
 * Vendor Verification Middleware
 * Ensures vendor profile exists. Auto-creates a default profile if missing.
 */
const requireVerifiedVendor = async (req, res, next) => {
  try {
    const VendorProfile = require('../models/VendorProfile');
    let vendor = await VendorProfile.findOne({ user: req.user._id });
    
    if (!vendor) {
      // Auto-create a default vendor profile so vendor is never blocked
      vendor = new VendorProfile({
        user: req.user._id,
        businessName: `${req.user.name}'s Business`,
        businessType: 'shop',
        category: 'other-shop',
        description: 'Local business provider',
        isVerified: true,
        verificationStatus: 'verified',
        isActive: true,
      });
      await vendor.save();
    }
    
    if (vendor.verificationStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: `Your vendor account was rejected. ${vendor.verificationNote || ''}`
      });
    }
    
    next();
  } catch (error) {
    console.error('requireVerifiedVendor error:', error);
    res.status(500).json({ success: false, message: 'Vendor verification check failed.' });
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  requireVerifiedVendor,
};
