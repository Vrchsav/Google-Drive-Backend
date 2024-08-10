const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Multer configuration for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limit file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    // You can add file type restrictions here if needed
    cb(null, true);
  }
});

// Function to generate a unique filename
const generateUniqueFilename = (originalname) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalname);
  return `${timestamp}-${randomString}${extension}`;
};

module.exports = {
  upload,
  generateUniqueFilename
};