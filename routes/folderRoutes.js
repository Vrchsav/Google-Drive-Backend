// routes/folderRoutes.js

const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');
const { isAuthenticated, isFolderOwner } = require('../middleware/auth');
const { validateFolderCreation, validateFolderUpdate } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting for folder creation
const folderCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 folder creations per windowMs
  message: 'Too many folders created, please try again after 15 minutes'
});

// Create a new folder
router.post('/', isAuthenticated, folderCreationLimiter, validateFolderCreation, folderController.createFolder);

// Get all folders for a user
router.get('/', isAuthenticated, folderController.getUserFolders);

// Get a single folder
router.get('/:id', isAuthenticated, isFolderOwner, folderController.getFolder);

// Update folder details
router.put('/:id', isAuthenticated, isFolderOwner, validateFolderUpdate, folderController.updateFolder);

// Delete a folder
router.delete('/:id', isAuthenticated, isFolderOwner, folderController.deleteFolder);

// Search folders
router.get('/search', isAuthenticated, folderController.searchFolders);

// Get folder contents (subfolders and files)
router.get('/:id/contents', isAuthenticated, isFolderOwner, folderController.getFolderContents);

// Move folder
router.post('/:id/move', isAuthenticated, isFolderOwner, folderController.moveFolder);

// Copy folder
router.post('/:id/copy', isAuthenticated, isFolderOwner, folderController.copyFolder);

// Get folder tree
router.get('/tree', isAuthenticated, folderController.getFolderTree);

// Get folder size
router.get('/:id/size', isAuthenticated, isFolderOwner, folderController.getFolderSize);

// Add/update folder tags
router.post('/:id/tags', isAuthenticated, isFolderOwner, folderController.updateFolderTags);

// Get recently accessed folders
router.get('/recent', isAuthenticated, folderController.getRecentFolders);

// Set folder color
router.post('/:id/color', isAuthenticated, isFolderOwner, folderController.setFolderColor);

// Get folder permissions
router.get('/:id/permissions', isAuthenticated, isFolderOwner, folderController.getFolderPermissions);

module.exports = router;