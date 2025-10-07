import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, "Original filename is required"],
      trim: true
    },
    originalName: {
      type: String,
      required: [true, "Original name is required"],
      trim: true
    },
    mimetype: {
      type: String,
      required: [true, "MIME type is required"],
      enum: {
        values: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'application/pdf',
          'image/webp',
          'image/bmp',
          'image/tiff'
        ],
        message: "Unsupported file type"
      }
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
      min: [0, "File size cannot be negative"],
      max: [10 * 1024 * 1024, "File size cannot exceed 10MB"]
    },
    path: {
      type: String,
      required: [true, "File path is required"],
      trim: true
    },
    folder: {
      type: String,
      required: [true, "Folder is required"],
      enum: {
        values: [
          'identifications',
          'room-images',
          'guest-documents',
          'booking-attachments',
          'reservation-attachments',
          'payment-receipts',
          'general-documents'
        ],
        message: "Invalid folder type"
      }
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader is required"],
      index: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"]
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    metadata: {
      width: Number, // For images
      height: Number, // For images
      pages: Number, // For PDFs
      thumbnail: String // Path to thumbnail if generated
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
documentSchema.index({ folder: 1, uploadedBy: 1 });
documentSchema.index({ uploadedAt: -1 });
documentSchema.index({ filename: 1 });
documentSchema.index({ mimetype: 1 });
documentSchema.index({ tags: 1 });

// Virtual for file extension
documentSchema.virtual('extension').get(function() {
  return this.filename.split('.').pop().toLowerCase();
});

// Virtual for formatted file size
documentSchema.virtual('formattedSize').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for file URL
documentSchema.virtual('url').get(function() {
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  return `${backendUrl}/${this.path}`;
});

// Virtual for thumbnail URL
documentSchema.virtual('thumbnailUrl').get(function() {
  if (!this.metadata?.thumbnail) return null;
  const backendUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  return `${backendUrl}/${this.metadata.thumbnail}`;
});

// Static method to find documents by folder
documentSchema.statics.findByFolder = function(folder, options = {}) {
  const query = { folder, isActive: true };

  if (options.uploadedBy) {
    query.uploadedBy = options.uploadedBy;
  }

  return this.find(query).sort({ uploadedAt: -1 });
};

// Static method to find documents by tags
documentSchema.statics.findByTags = function(tags, options = {}) {
  const query = {
    tags: { $in: tags.map(tag => tag.toLowerCase()) },
    isActive: true
  };

  if (options.folder) {
    query.folder = options.folder;
  }

  if (options.uploadedBy) {
    query.uploadedBy = options.uploadedBy;
  }

  return this.find(query).sort({ uploadedAt: -1 });
};

// Instance method to soft delete
documentSchema.methods.softDelete = function() {
  this.isActive = false;
  return this.save();
};

// Pre-save middleware to generate filename if not provided
documentSchema.pre('save', function(next) {
  if (!this.filename && this.originalName) {
    this.filename = this.originalName;
  }
  next();
});

const Document = mongoose.model("Document", documentSchema);

export default Document;
