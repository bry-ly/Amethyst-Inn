import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Document from '../models/Document.js';

// Create uploads directory structure if it doesn't exist
const createUploadsStructure = () => {
  const baseUploadsDir = path.join(process.cwd(), 'uploads');
  const folders = [
    'identifications',
    'room-images',
    'guest-documents',
    'booking-attachments',
    'reservation-attachments',
    'payment-receipts',
    'general-documents'
  ];

  if (!fs.existsSync(baseUploadsDir)) {
    fs.mkdirSync(baseUploadsDir, { recursive: true });
  }

  folders.forEach(folder => {
    const folderPath = path.join(baseUploadsDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  });
};

// Initialize uploads structure
createUploadsStructure();

// Configure storage with organized folder structure
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine folder based on field name or request context
    let folder = 'general-documents';

    if (file.fieldname === 'identificationDocument') {
      folder = 'identifications';
    } else if (file.fieldname === 'roomImage') {
      folder = 'room-images';
    } else if (file.fieldname === 'guestDocument') {
      folder = 'guest-documents';
    } else if (file.fieldname === 'bookingAttachment') {
      folder = 'booking-attachments';
    } else if (file.fieldname === 'reservationAttachment') {
      folder = 'reservation-attachments';
    } else if (file.fieldname === 'paymentReceipt') {
      folder = 'payment-receipts';
    }

    const uploadPath = path.join(process.cwd(), 'uploads', folder);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename: timestamp-userId-fieldName-originalname
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const userId = req.user?._id || 'guest';
    const fieldName = file.fieldname;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');

    const uniqueFilename = `${userId}-${fieldName}-${timestamp}-${random}-${name}${ext}`;
    cb(null, uniqueFilename);
  }
});

// Enhanced file filter with more file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|webp|bmp|tiff/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) ||
    file.mimetype === 'application/pdf' ||
    file.mimetype.startsWith('image/');

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP, BMP, TIFF) and PDF documents are allowed'));
  }
};

// Configure multer with enhanced options
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size (increased from 5MB)
  },
  fileFilter: fileFilter
});

// Middleware to handle single file upload for identification
export const uploadIdentification = upload.single('identificationDocument');

// Middleware to handle multiple file uploads
export const uploadMultiple = upload.fields([
  { name: 'identificationDocument', maxCount: 1 },
  { name: 'roomImage', maxCount: 5 },
  { name: 'guestDocument', maxCount: 3 },
  { name: 'bookingAttachment', maxCount: 5 },
  { name: 'reservationAttachment', maxCount: 5 },
  { name: 'paymentReceipt', maxCount: 3 }
]);

// Middleware to handle any file upload with custom field name
export const uploadAny = upload.any();

// Enhanced error handling middleware for multer errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files uploaded.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message || 'File upload failed'
    });
  }
  next();
};

// Middleware to save uploaded files to database
export const saveUploadedFiles = async (req, res, next) => {
  try {
    if (!req.files && !req.file) {
      return next();
    }

    const uploadedDocuments = [];

    // Handle single file upload
    if (req.file) {
      const documentData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path.replace(/\\/g, '/'), // Normalize path separators
        folder: getFolderFromFieldName(req.file.fieldname),
        uploadedBy: req.user._id,
        description: req.body.description || `Uploaded ${req.file.fieldname}`
      };

      const document = await Document.create(documentData);
      uploadedDocuments.push(document);
      req.uploadedDocument = document;
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
              path: file.path.replace(/\\/g, '/'), // Normalize path separators
              folder: getFolderFromFieldName(fieldName),
              uploadedBy: req.user._id,
              description: req.body.description || `Uploaded ${fieldName}`
            };

            const document = await Document.create(documentData);
            uploadedDocuments.push(document);
          }
        }
      }
      req.uploadedDocuments = uploadedDocuments;
    }

    next();
  } catch (error) {
    console.error('Error saving uploaded files:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save file information'
    });
  }
};

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
