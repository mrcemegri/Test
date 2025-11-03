const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { successResponse } = require('../utils/response');

const router = express.Router();

// File upload directory
const UPLOAD_DIR = path.join(__dirname, '../uploads');

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch (error) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
};

// File upload endpoint
router.post('/upload', authenticateToken, async (req, res, next) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const file = req.files.file;
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    // Validate file type
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type'
      });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'File size too large (max 10MB)'
      });
    }

    await ensureUploadDir();

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, uniqueFilename);

    // Move file to upload directory
    await file.mv(filePath);

    const fileUrl = `/api/files/download/${uniqueFilename}`;

    res.json(
      successResponse({
        filename: file.name,
        originalName: file.name,
        uniqueFilename,
        fileUrl,
        size: file.size,
        mimetype: file.mimetype
      }, 'File uploaded successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Download file endpoint
router.get('/download/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

// Delete file endpoint
router.delete('/:filename', authenticateToken, async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Delete file
    await fs.unlink(filePath);

    res.json(
      successResponse(null, 'File deleted successfully')
    );
  } catch (error) {
    next(error);
  }
});

// Get file info endpoint
router.get('/info/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Get file stats
    const stats = await fs.stat(filePath);

    res.json(
      successResponse({
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      })
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;