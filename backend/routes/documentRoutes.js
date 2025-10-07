import express from "express";
import {
  uploadDocuments,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentsByFolder,
  searchDocumentsByTags,
  getDocumentStats
} from "../controllers/documentController.js";
import {
  uploadMultiple,
  handleUploadError,
  saveUploadedFiles
} from "../middleware/uploadMiddleware.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// All document routes require authentication
router.use(protect);

// Upload documents (multiple types supported)
router.post("/upload", uploadMultiple, handleUploadError, saveUploadedFiles, uploadDocuments);

// Get all documents with filtering
router.get("/", getDocuments);

// Get document by ID
router.get("/:id", getDocumentById);

// Update document metadata
router.put("/:id", updateDocument);

// Delete document (soft delete)
router.delete("/:id", deleteDocument);

// Get documents by folder
router.get("/folder/:folder", getDocumentsByFolder);

// Search documents by tags
router.get("/search/tags", searchDocumentsByTags);

// Get document statistics (admin/staff only)
router.get("/stats", authorizeRoles("admin", "staff"), getDocumentStats);

export default router;
