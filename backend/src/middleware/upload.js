const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

const USE_CLOUDINARY = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (USE_CLOUDINARY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadToCloudinary = (buffer, folder = 'medicines') =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `som-care/${folder}`,
        resource_type: 'image',
        transformation: [{ width: 900, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    ).end(buffer);
  });

const imageFilter = (req, file, cb) => {
  file.mimetype.startsWith('image/')
    ? cb(null, true)
    : cb(new Error('Only image files are allowed'), false);
};

// Local disk fallback (development)
const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
const diskStorage = (sub) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', sub);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`);
  },
});

const LIMITS = { fileSize: 5 * 1024 * 1024 };

// Export multer instances (not pre-called middleware) so route files can call .single() themselves
const uploadMedicineImage = USE_CLOUDINARY
  ? multer({ storage: multer.memoryStorage(), fileFilter: imageFilter, limits: LIMITS })
  : multer({ storage: diskStorage('medicines'), fileFilter: imageFilter, limits: LIMITS });

const uploadPrescription = USE_CLOUDINARY
  ? multer({ storage: multer.memoryStorage(), fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } })
  : multer({ storage: diskStorage('prescriptions'), fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const uploadAvatar = USE_CLOUDINARY
  ? multer({ storage: multer.memoryStorage(), fileFilter: imageFilter, limits: { fileSize: 2 * 1024 * 1024 } })
  : multer({ storage: diskStorage('avatars'), fileFilter: imageFilter, limits: { fileSize: 2 * 1024 * 1024 } });

module.exports = { uploadMedicineImage, uploadPrescription, uploadAvatar, uploadToCloudinary, USE_CLOUDINARY };
