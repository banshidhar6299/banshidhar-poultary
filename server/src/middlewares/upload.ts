import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

// Ensure local uploads directory exists
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

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    // Audio
    'audio/webm',
    'audio/ogg',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-m4a',
    'audio/m4a',
    // Video
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported media format. Please upload valid image, audio, or video files.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max limit for full video uploads
  }
});

/**
 * Uploads a local file to Cloudinary if configured, otherwise returns local URL
 */
export const processUploadedFile = async (
  file: Express.Multer.File,
  folder = 'banshidhar_poultry'
): Promise<{ url: string; publicId?: string; mimeType: string; size: number }> => {
  const isCloudinaryConfigured =
    Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET);

  if (isCloudinaryConfigured) {
    try {
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

      // Remove local temp file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
        mimeType: file.mimetype,
        size: file.size
      };
    } catch (err) {
      console.warn('[MediaUpload] Cloudinary upload failed, falling back to local storage URL:', err);
    }
  }

  // Fallback to local server URL
  const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
  return {
    url: `${serverUrl}/uploads/${file.filename}`,
    publicId: file.filename,
    mimeType: file.mimetype,
    size: file.size
  };
};
