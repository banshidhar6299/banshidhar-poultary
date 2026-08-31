import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

// Ensure local uploads directory exists (used as temp staging even for Cloudinary)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Cloudinary if credentials exist
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// ─── File Signature Validation ───────────────────────────────────────
const FILE_SIGNATURES: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  'image/webp': [Buffer.from('RIFF'), Buffer.from('WEBP')], // bytes 0-3 = RIFF, 8-11 = WEBP
  'image/gif': [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
  'audio/mpeg': [Buffer.from([0xff, 0xfb]), Buffer.from([0xff, 0xf3]), Buffer.from([0xff, 0xf2]), Buffer.from('ID3')],
  'audio/mp3': [Buffer.from([0xff, 0xfb]), Buffer.from([0xff, 0xf3]), Buffer.from('ID3')],
  'audio/ogg': [Buffer.from('OggS')],
  'audio/wav': [Buffer.from('RIFF')],
  'audio/webm': [Buffer.from([0x1a, 0x45, 0xdf, 0xa3])],
  'video/mp4': [], // ftyp at offset 4 checked separately
  'video/webm': [Buffer.from([0x1a, 0x45, 0xdf, 0xa3])],
  'video/quicktime': [] // ftyp at offset 4
};

/**
 * Validate that a file's actual content matches its declared MIME type.
 */
export const validateFileSignature = (filePath: string, mimeType: string): boolean => {
  try {
    const fd = fs.openSync(filePath, 'r');
    const header = Buffer.alloc(12);
    fs.readSync(fd, header, 0, 12, 0);
    fs.closeSync(fd);

    // WebP: RIFF....WEBP
    if (mimeType === 'image/webp') {
      return header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WEBP';
    }

    // MP4/MOV: ftyp at offset 4
    if (mimeType === 'video/mp4' || mimeType === 'video/quicktime') {
      return header.subarray(4, 8).toString() === 'ftyp';
    }

    // M4A audio
    if (mimeType === 'audio/x-m4a' || mimeType === 'audio/m4a') {
      return header.subarray(4, 8).toString() === 'ftyp';
    }

    const sigs = FILE_SIGNATURES[mimeType];
    if (!sigs || sigs.length === 0) return true; // Unknown type, allow (filtered by MIME already)

    return sigs.some((sig) => header.subarray(0, sig.length).equals(sig));
  } catch {
    return false;
  }
};

// ─── Size limits by type ─────────────────────────────────────────────
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;   // 5 MB
const AUDIO_MAX_BYTES = 10 * 1024 * 1024;  // 10 MB
const VIDEO_MAX_BYTES = 25 * 1024 * 1024;  // 25 MB
const AI_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB for AI images

// ─── Multer config ───────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, _file, cb) => {
    // Generate safe server-side filename with crypto UUID
    const ext = path.extname(_file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const safeName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  }
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    // Audio
    'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp3',
    'audio/wav', 'audio/x-m4a', 'audio/m4a',
    // Video
    'video/mp4', 'video/webm', 'video/quicktime'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported media format. Please upload valid image, audio, or video files.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: VIDEO_MAX_BYTES, // Use largest as multer limit; enforce per-type in processUploadedFile
    files: 3
  }
});

/**
 * Safely delete a temporary file, ignoring errors.
 */
const cleanupTempFile = (filePath?: string): void => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors
  }
};

/**
 * Uploads a local file to Cloudinary if configured.
 * In production, refuses to fall back to local disk.
 * Always cleans up temporary files.
 */
export const processUploadedFile = async (
  file: Express.Multer.File,
  folder = 'banshidhar_poultry'
): Promise<{ url: string; publicId?: string; mimeType: string; size: number }> => {
  const isProduction = process.env.NODE_ENV === 'production';

  try {
    // ── Validate file signature (magic bytes) ──────────────────────────
    if (!validateFileSignature(file.path, file.mimetype)) {
      throw Object.assign(
        new Error('File content does not match declared type. Upload rejected.'),
        { statusCode: 400 }
      );
    }

    // ── Enforce per-type size limits ────────────────────────────────────
    let maxBytes = IMAGE_MAX_BYTES;
    if (file.mimetype.startsWith('audio/')) maxBytes = AUDIO_MAX_BYTES;
    if (file.mimetype.startsWith('video/')) maxBytes = VIDEO_MAX_BYTES;

    if (file.size > maxBytes) {
      const maxMB = Math.round(maxBytes / (1024 * 1024));
      throw Object.assign(
        new Error(`File too large. Maximum ${maxMB}MB allowed for ${file.mimetype.split('/')[0]} files.`),
        { statusCode: 413 }
      );
    }

    // ── Upload to Cloudinary ───────────────────────────────────────────
    const isCloudinaryConfigured =
      Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
      Boolean(process.env.CLOUDINARY_API_KEY) &&
      Boolean(process.env.CLOUDINARY_API_SECRET);

    if (isCloudinaryConfigured) {
      const resourceType = file.mimetype.startsWith('video/')
        ? 'video'
        : file.mimetype.startsWith('audio/')
        ? 'video' // Cloudinary stores audio under video resource_type
        : 'image';

      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: resourceType,
        quality: 'auto',
        fetch_format: 'auto'
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        mimeType: file.mimetype,
        size: file.size
      };
    }

    // ── Production: no local fallback ──────────────────────────────────
    if (isProduction) {
      throw Object.assign(
        new Error('File storage service is unavailable. Please try again later.'),
        { statusCode: 503 }
      );
    }

    // ── Development: local fallback ────────────────────────────────────
    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5050}`;
    return {
      url: `${serverUrl}/uploads/${file.filename}`,
      publicId: file.filename,
      mimeType: file.mimetype,
      size: file.size
    };
  } catch (error) {
    // In production, if Cloudinary fails, don't fall back to local
    if (isProduction && !(error as any)?.statusCode) {
      logger.error('MediaUpload', 'Upload failed in production', error);
      throw Object.assign(
        new Error('File storage service is unavailable. Please try again later.'),
        { statusCode: 503 }
      );
    }
    throw error;
  } finally {
    // Always clean up temp file (except local dev fallback where file IS the final storage)
    const isCloudinaryConfigured = Boolean(process.env.CLOUDINARY_CLOUD_NAME);
    if (isCloudinaryConfigured || isProduction) {
      cleanupTempFile(file.path);
    }
  }
};

export { AI_IMAGE_MAX_BYTES, IMAGE_MAX_BYTES, AUDIO_MAX_BYTES, VIDEO_MAX_BYTES };
