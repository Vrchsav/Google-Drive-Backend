// routes/fileRoutes.js

const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { isAuthenticated, isFileOwner } = require('../middleware/auth');
const { validateFileUpload, validateFileUpdate } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 uploads per windowMs
  message: 'Too many file uploads, please try again after 15 minutes'
});

// File upload
router.post('/upload', isAuthenticated, uploadLimiter, validateFileUpload, fileController.uploadFile);

// Get all files for a user
router.get('/', isAuthenticated, fileController.getUserFiles);

// Get a single file
router.get('/:id', isAuthenticated, isFileOwner, fileController.getFile);

// Update file details
router.put('/:id', isAuthenticated, isFileOwner, validateFileUpdate, fileController.updateFile);

// Delete a file
router.delete('/:id', isAuthenticated, isFileOwner, fileController.deleteFile);

// Search files
router.get('/search', isAuthenticated, fileController.searchFiles);

// Generate download URL
router.get('/:id/download', isAuthenticated, isFileOwner, fileController.getDownloadUrl);

// Move file
router.post('/:id/move', isAuthenticated, isFileOwner, fileController.moveFile);

// Copy file
router.post('/:id/copy', isAuthenticated, isFileOwner, fileController.copyFile);

// Get file version history
router.get('/:id/versions', isAuthenticated, isFileOwner, fileController.getFileVersions);

// Restore file version
router.post('/:id/versions/:versionId/restore', isAuthenticated, isFileOwner, fileController.restoreFileVersion);

// Get file metadata
router.get('/:id/metadata', isAuthenticated, isFileOwner, fileController.getFileMetadata);

// Add/update file tags
router.post('/:id/tags', isAuthenticated, isFileOwner, fileController.updateFileTags);

// Get recently accessed files
router.get('/recent', isAuthenticated, fileController.getRecentFiles);

// Get file preview
router.get('/:id/preview', isAuthenticated, isFileOwner, fileController.getFilePreview);

module.exports = router;