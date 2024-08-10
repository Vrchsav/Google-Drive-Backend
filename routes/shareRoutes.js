// routes/shareRoutes.js

const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');
const { isAuthenticated, isResourceOwner } = require('../middleware/auth');
const { validateShareCreation, validateShareUpdate } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

// Rate limiting for share creation
const shareCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 share creations per windowMs
  message: 'Too many shares created, please try again after 15 minutes'
});

// Share a file
router.post('/file/:fileId', isAuthenticated, isResourceOwner, shareCreationLimiter, validateShareCreation, shareController.shareFile);

// Share a folder
router.post('/folder/:folderId', isAuthenticated, isResourceOwner, shareCreationLimiter, validateShareCreation, shareController.shareFolder);

// Get shared files for a user
router.get('/files', isAuthenticated, shareController.getSharedFiles);

// Get shared folders for a user
router.get('/folders', isAuthenticated, shareController.getSharedFolders);

// Update file share permissions
router.put('/file/:shareId', isAuthenticated, isResourceOwner, validateShareUpdate, shareController.updateFileSharePermissions);

// Update folder share permissions
router.put('/folder/:shareId', isAuthenticated, isResourceOwner, validateShareUpdate, shareController.updateFolderSharePermissions);

// Remove file share
router.delete('/file/:shareId', isAuthenticated, isResourceOwner, shareController.removeFileShare);

// Remove folder share
router.delete('/folder/:shareId', isAuthenticated, isResourceOwner, shareController.removeFolderShare);

// Get share details by link
router.get('/link/:shareLink', shareController.getShareByLink);

// Access shared resource by link
router.get('/access/:shareLink', shareController.accessSharedResource);

// List users with access to a file
router.get('/file/:fileId/users', isAuthenticated, isResourceOwner, shareController.listFileShareUsers);

// List users with access to a folder
router.get('/folder/:folderId/users', isAuthenticated, isResourceOwner, shareController.listFolderShareUsers);

// Transfer ownership of a file
router.post('/file/:fileId/transfer', isAuthenticated, isResourceOwner, shareController.transferFileOwnership);

// Transfer ownership of a folder
router.post('/folder/:folderId/transfer', isAuthenticated, isResourceOwner, shareController.transferFolderOwnership);

// Get sharing settings for a file
router.get('/file/:fileId/settings', isAuthenticated, isResourceOwner, shareController.getFileShareSettings);

// Get sharing settings for a folder
router.get('/folder/:folderId/settings', isAuthenticated, isResourceOwner, shareController.getFolderShareSettings);

// Update sharing settings for a file
router.put('/file/:fileId/settings', isAuthenticated, isResourceOwner, shareController.updateFileShareSettings);

// Update sharing settings for a folder
router.put('/folder/:folderId/settings', isAuthenticated, isResourceOwner, shareController.updateFolderShareSettings);

module.exports = router;