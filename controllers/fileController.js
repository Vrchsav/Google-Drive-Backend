// fileController.js
const File = require('../models/File');
const Folder = require('../models/Folder');
const { upload, generateUniqueFilename } = require('../config/multer');
const { s3, bucket } = require('../config/s3');
const { createActivity } = require('../services/activityService');
// Upload a file
exports.uploadFile = [
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    try {
      const { folderId } = req.body;
      const folder = folderId ? await Folder.findById(folderId) : null;
      if (folderId && !folder) {
        return res.status(404).json({ message: 'Folder not found' });
      }
      const uniqueFilename = generateUniqueFilename(req.file.originalname);
      const params = {
        Bucket: bucket,
        Key: uniqueFilename,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };
      const s3Response = await s3.upload(params).promise();
      const file = new File({
        name: req.file.originalname,
        path: s3Response.Location,
        size: req.file.size,
        mimeType: req.file.mimetype,
        owner: req.user._id,
        folder: folder ? folder._id : null
      });
      await file.save();
      await createActivity(req.user._id, 'upload', file._id, 'File');
      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          id: file._id,
          name: file.name,
          path: file.path,
          size: file.size,
          mimeType: file.mimeType
        }
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
  }
];
// Get all files for a user
exports.getUserFiles = async (req, res) => {
  try {
    const { folderId } = req.query;
    const query = { owner: req.user._id };
    if (folderId) {
      query.folder = folderId;
    }
    const files = await File.find(query).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching files', error: error.message });
  }
};
// Get a single file
exports.getFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching file', error: error.message });
  }
};
// Update file details
exports.updateFile = async (req, res) => {
  try {
    const { name } = req.body;
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    if (name) file.name = name;
    await file.save();
    await createActivity(req.user._id, 'update', file._id, 'File');
    res.json({ message: 'File updated successfully', file });
  } catch (error) {
    res.status(500).json({ message: 'Error updating file', error: error.message });
  }
};
// Delete a file
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    const params = {
      Bucket: bucket,
      Key: file.path.split('/').pop()
    };
    await s3.deleteObject(params).promise();
    await File.deleteOne({ _id: file._id });
    await createActivity(req.user._id, 'delete', file._id, 'File');
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
};
// Search files
exports.searchFiles = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    const files = await File.find({
      owner: req.user._id,
      name: { $regex: query, $options: 'i' }
    }).sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error searching files', error: error.message });
  }
};
// Generate download URL
exports.getDownloadUrl = async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user._id });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    const params = {
      Bucket: bucket,
      Key: file.path.split('/').pop(),
      Expires: 60 * 5 // URL expires in 5 minutes
    };
    const url = await s3.getSignedUrlPromise('getObject', params);
    res.json({ downloadUrl: url });
  } catch (error) {
    res.status(500).json({ message: 'Error generating download URL', error: error.message });
  }
};
