// authController.js

const passport = require('passport');
const User = require('../models/User');
const { generateToken, verifyToken } = require('../utils/jwtHelper');

const authController = {
  // Google OAuth login
  googleLogin: passport.authenticate('google', { scope: ['profile', 'email'] }),

  // Google OAuth callback
  googleCallback: (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        return res.status(500).json({ message: 'Authentication failed', error: err.message });
      }
      if (!user) {
        return res.status(401).json({ message: 'Authentication failed', error: info.message });
      }
      
      const token = generateToken(user);
      res.cookie('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.redirect('/dashboard'); // Redirect to dashboard or send token in response
    })(req, res, next);
  },

  // User logout
  logout: (req, res) => {
    req.logout();
    res.clearCookie('jwt');
    res.status(200).json({ message: 'Logged out successfully' });
  },

  // Get current user
  getCurrentUser: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { name, email } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (name) user.name = name;
      if (email) user.email = email;

      await user.save();
      res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Delete user account
  deleteAccount: async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },

  // Refresh token
  refreshToken: (req, res) => {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = verifyToken(token);
      const newToken = generateToken({ id: decoded.id });
      res.cookie('jwt', newToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.json({ message: 'Token refreshed successfully' });
    } catch (error) {
      res.status(401).json({ message: 'Invalid token', error: error.message });
    }
  },

  // Check if user is authenticated
  isAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  },

  // Check if user has admin role
  isAdmin: (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    res.status(403).json({ message: 'Access denied' });
  }
};

module.exports = authController;