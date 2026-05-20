const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const storage = (subDir) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '..', 'uploads', subDir);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`);
    },
  });

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed'), false);
  }
};

const uploadMedicineImage = multer({ storage: storage('medicines'), fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadPrescription = multer({ storage: storage('prescriptions'), fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadAvatar = multer({ storage: storage('avatars'), fileFilter: imageFilter, limits: { fileSize: 2 * 1024 * 1024 } });

module.exports = { uploadMedicineImage, uploadPrescription, uploadAvatar };
