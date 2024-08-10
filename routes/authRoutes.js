// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes'
});

// Google OAuth routes
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

// Local authentication routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', loginLimiter, validateLogin, authController.login);
router.post('/logout', authController.isAuthenticated, authController.logout);

// Password reset routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// User profile routes
router.get('/profile', authController.isAuthenticated, authController.getCurrentUser);
router.put('/profile', authController.isAuthenticated, authController.updateProfile);

// Account management
router.delete('/account', authController.isAuthenticated, authController.deleteAccount);

// Token refresh route
router.post('/refresh-token', authController.refreshToken);

// Two-factor authentication routes
router.post('/2fa/enable', authController.isAuthenticated, authController.enable2FA);
router.post('/2fa/disable', authController.isAuthenticated, authController.disable2FA);
router.post('/2fa/verify', authController.isAuthenticated, authController.verify2FA);

module.exports = router;