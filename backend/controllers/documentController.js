import asyncHandler from "express-async-handler";
import Document from "../models/Document.js";
import fs from 'fs';
import path from 'path';

// @desc    Upload and save documents
// @route   POST /api/documents/upload
// @access  Private
export const uploadDocuments = asyncHandler(async (req, res) => {
  try {
    const uploadedDocuments = [];

    // Handle single file upload
    if (req.file) {
      const documentData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path.replace(/\\/g, '/'),
        folder: getFolderFromFieldName(req.file.fieldname),
        uploadedBy: req.user._id,
        description: req.body.description || `Uploaded ${req.file.fieldname}`
      };

      const document = await Document.create(documentData);
      uploadedDocuments.push(document);
    }

    // Handle multiple files upload
    if (req.files) {
      for (const [fieldName, files] of Object.entries(req.files)) {
        if (Array.isArray(files)) {
          for (const file of files) {
            const documentData = {
              filename: file.filename,
              originalName: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              path: file.path.replace(/\\/g, '/'),
              folder: getFolderFromFieldName(fieldName),
              uploadedBy: req.user._id,
              description: req.body.description || `Uploaded ${fieldName}`
            };

            const document = await Document.create(documentData);
            uploadedDocuments.push(document);
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${uploadedDocuments.length} document(s)`,
      data: uploadedDocuments
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload documents'
    });
  }
});

// @desc    Get all documents with filtering
// @route   GET /api/documents
// @access  Private
export const getDocuments = asyncHandler(async (req, res) => {
  const {
    folder,
    uploadedBy,
    tags,
    page = 1,
    limit = 10,
    sortBy = 'uploadedAt',
    sortOrder = 'desc'
  } = req.query;

  let query = { isActive: true };

  if (folder) {
    query.folder = folder;
  }

  if (uploadedBy) {
    query.uploadedBy = uploadedBy;
  }

  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : tags.split(',');
    query.tags = { $in: tagArray.map(tag => tag.toLowerCase()) };
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const documents = await Document.find(query)
    .populate('uploadedBy', 'name email')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Document.countDocuments(query);

  res.json({
    success: true,
    data: documents,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single document by ID
// @route   GET /api/documents/:id
// @access  Private
export const getDocumentById = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id)
    .populate('uploadedBy', 'name email');

  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  // Check if user is authorized to view this document
  if (
    req.user.role !== "admin" &&
    req.user.role !== "staff" &&
    document.uploadedBy._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to view this document");
  }

  res.json({
    success: true,
    data: document
  });
});

// @desc    Update document metadata
// @route   PUT /api/documents/:id
// @access  Private
export const updateDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  // Check if user is authorized to update this document
  if (
    req.user.role !== "admin" &&
    req.user.role !== "staff" &&
    document.uploadedBy.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to update this document");
  }

  // Update allowed fields
  const allowedUpdates = ['description', 'tags', 'metadata'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      document[field] = req.body[field];
    }
  });

  await document.save();

  res.json({
    success: true,
    message: "Document updated successfully",
    data: document
  });
});

// @desc    Delete document (soft delete)
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error("Document not found");
  }

  // Check if user is authorized to delete this document
  if (
    req.user.role !== "admin" &&
    document.uploadedBy.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to delete this document");
  }

  // Soft delete the document
  await document.softDelete();

  // Optionally delete the physical file (uncomment if needed)
  // if (fs.existsSync(document.path)) {
  //   fs.unlinkSync(document.path);
  // }

  res.json({
    success: true,
    message: "Document deleted successfully"
  });
});

// @desc    Get documents by folder
// @route   GET /api/documents/folder/:folder
// @access  Private
export const getDocumentsByFolder = asyncHandler(async (req, res) => {
  const { folder } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const documents = await Document.findByFolder(folder, {
    uploadedBy: req.query.uploadedBy
  })
    .populate('uploadedBy', 'name email')
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Document.countDocuments({ folder, isActive: true });

  res.json({
    success: true,
    data: documents,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Search documents by tags
// @route   GET /api/documents/search/tags
// @access  Private
export const searchDocumentsByTags = asyncHandler(async (req, res) => {
  const { tags } = req.query;

  if (!tags) {
    res.status(400);
    throw new Error("Tags parameter is required");
  }

  const tagArray = Array.isArray(tags) ? tags : tags.split(',');
  const documents = await Document.findByTags(tagArray, {
    folder: req.query.folder,
    uploadedBy: req.query.uploadedBy
  }).populate('uploadedBy', 'name email');

  res.json({
    success: true,
    data: documents,
    count: documents.length
  });
});

// @desc    Get document statistics
// @route   GET /api/documents/stats
// @access  Private/Admin/Staff
export const getDocumentStats = asyncHandler(async (req, res) => {
  // Check if user is admin or staff
  if (req.user.role !== "admin" && req.user.role !== "staff") {
    res.status(403);
    throw new Error("Not authorized to view document statistics");
  }

  const stats = await Document.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$folder',
        count: { $sum: 1 },
        totalSize: { $sum: '$size' },
        avgSize: { $avg: '$size' }
      }
    },
    {
      $project: {
        folder: '$_id',
        count: 1,
        totalSize: 1,
        avgSize: 1,
        _id: 0
      }
    }
  ]);

  const totalDocuments = await Document.countDocuments({ isActive: true });
  const totalSize = await Document.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: null, total: { $sum: '$size' } } }
  ]);

  res.json({
    success: true,
    data: {
      byFolder: stats,
      totalDocuments,
      totalSize: totalSize[0]?.total || 0
    }
  });
});

// Helper function to determine folder from field name
const getFolderFromFieldName = (fieldName) => {
  const folderMap = {
    'identificationDocument': 'identifications',
    'roomImage': 'room-images',
    'guestDocument': 'guest-documents',
    'bookingAttachment': 'booking-attachments',
    'reservationAttachment': 'reservation-attachments',
    'paymentReceipt': 'payment-receipts'
  };

  return folderMap[fieldName] || 'general-documents';
};
