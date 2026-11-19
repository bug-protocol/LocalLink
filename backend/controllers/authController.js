const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const VendorProfile = require('../models/VendorProfile');

/** Generate JWT Token */
const generateToken = (userId) =>
  jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'locallink_dev_secret_key_change_in_production_min32chars',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

/** Safe public user object returned in every auth response */
const publicUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  address: user.address || {},
  isVerified: user.isVerified,
});

// ─────────────────────────────────────────────────────────────────────────────
//  REGISTER — creates account and returns JWT immediately (no OTP / no phone required)
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const { name, email, password, role = 'customer', address, businessInfo } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user — isVerified defaults to true
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: ['customer', 'vendor', 'admin'].includes(role) ? role : 'customer',
      address: address || {},
      isActive: true,
      isVerified: true,
    });
    await user.save();

    // Create vendor profile if registering as vendor
    let vendorProfile = null;
    if (user.role === 'vendor') {
      vendorProfile = new VendorProfile({
        user: user._id,
        businessName: businessInfo?.businessName?.trim() || `${user.name}'s Shop`,
        businessType: businessInfo?.businessType || 'shop',
        category: businessInfo?.category || 'other-shop',
        description: businessInfo?.description || '',
        isActive: true,
        isVerified: true,
        verificationStatus: 'verified',
      });
      await vendorProfile.save();
    }

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to LocalLink.',
      data: {
        user: publicUser(user),
        vendorProfile,
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  LOGIN — authenticates credentials and returns JWT + user + vendorProfile
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);
    let vendorProfile = null;
    if (user.role === 'vendor') {
      vendorProfile = await VendorProfile.findOne({ user: user._id });
      // If vendor profile is missing for a vendor user, auto-create it
      if (!vendorProfile) {
        vendorProfile = new VendorProfile({
          user: user._id,
          businessName: `${user.name}'s Shop`,
          businessType: 'shop',
          category: 'other-shop',
          isActive: true,
          isVerified: true,
          verificationStatus: 'verified',
        });
        await vendorProfile.save();
      }
    }

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: publicUser(user),
        vendorProfile,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET PROFILE
// ─────────────────────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    let vendorProfile = null;
    if (user.role === 'vendor') {
      vendorProfile = await VendorProfile.findOne({ user: user._id });
    }
    res.json({
      success: true,
      data: {
        user: publicUser(user),
        vendorProfile,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get profile.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE PROFILE
// ─────────────────────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone;
    if (address) updates.address = address;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: publicUser(user) },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  CHANGE PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

module.exports = { register, login, getProfile, updateProfile, changePassword };
