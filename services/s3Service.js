// services/s3Service.js

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/s3Config');

AWS.config.update({
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
  region: config.region
});

const s3 = new AWS.S3();

const s3Service = {
  // Upload a file to S3
  uploadFile: async (file, userId) => {
    const key = `${userId}/${uuidv4()}-${file.originalname}`;
    const params = {
      Bucket: config.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private'
    };

    try {
      const result = await s3.upload(params).promise();
      return {
        key: result.Key,
        location: result.Location,
        etag: result.ETag
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('File upload failed');
    }
  },

  // Download a file from S3
  getFileStream: (key) => {
    const params = {
      Bucket: config.bucketName,
      Key: key
    };

    return s3.getObject(params).createReadStream();
  },

  // Delete a file from S3
  deleteFile: async (key) => {
    const params = {
      Bucket: config.bucketName,
      Key: key
    };

    try {
      await s3.deleteObject(params).promise();
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('File deletion failed');
    }
  },

  // Generate a pre-signed URL for file download
  getSignedUrl: async (key, expirationTime = 60) => {
    const params = {
      Bucket: config.bucketName,
      Key: key,
      Expires: expirationTime
    };

    try {
      return await s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      console.error('S3 signed URL error:', error);
      throw new Error('Failed to generate download URL');
    }
  },

  // Copy a file within S3
  copyFile: async (sourceKey, destinationKey) => {
    const params = {
      Bucket: config.bucketName,
      CopySource: `${config.bucketName}/${sourceKey}`,
      Key: destinationKey
    };

    try {
      await s3.copyObject(params).promise();
    } catch (error) {
      console.error('S3 copy error:', error);
      throw new Error('File copy failed');
    }
  },

  // Check if a file exists in S3
  fileExists: async (key) => {
    const params = {
      Bucket: config.bucketName,
      Key: key
    };

    try {
      await s3.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  },

  // List files in a "directory"
  listFiles: async (prefix) => {
    const params = {
      Bucket: config.bucketName,
      Prefix: prefix
    };

    try {
      const data = await s3.listObjectsV2(params).promise();
      return data.Contents.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified
      }));
    } catch (error) {
      console.error('S3 list error:', error);
      throw new Error('Failed to list files');
    }
  },

  // Get file metadata
  getFileMetadata: async (key) => {
    const params = {
      Bucket: config.bucketName,
      Key: key
    };

    try {
      const data = await s3.headObject(params).promise();
      return {
        contentType: data.ContentType,
        contentLength: data.ContentLength,
        etag: data.ETag,
        lastModified: data.LastModified
      };
    } catch (error) {
      console.error('S3 metadata error:', error);
      throw new Error('Failed to get file metadata');
    }
  }
};

module.exports = s3Service;