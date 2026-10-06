// middleware/upload.js — Kupokea picha za bidhaa/duka/kitambulisho
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.resolve(process.env.SOKO_UPLOAD_DIR || path.join(__dirname, '..', 'public', 'uploads'));
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = crypto.randomBytes(12).toString('hex') + ext;
    cb(null, name);
  },
});

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'];
const IMAGE_ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED.includes(ext)) {
    return cb(new Error('Aina ya faili haikubaliki. Tumia JPG, PNG, WEBP au PDF.'));
  }
  cb(null, true);
}

function imageFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!IMAGE_ALLOWED.includes(ext) || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Aina ya faili haikubaliki. Chagua picha ya JPG, PNG, WEBP au GIF.'));
  }
  cb(null, true);
}

function createUploader(filter) {
  return multer({
    storage,
    fileFilter: filter,
    limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  });
}

const upload = createUploader(fileFilter);
upload.images = createUploader(imageFileFilter);

upload.removeFiles = (filenames) => {
  for (const filename of filenames || []) {
    if (typeof filename !== 'string' || path.basename(filename) !== filename) continue;
    fs.unlink(path.join(UPLOAD_DIR, filename), (error) => {
      if (error && error.code !== 'ENOENT') console.error('Could not remove upload:', error.message);
    });
  }
};
upload.uploadDir = UPLOAD_DIR;

module.exports = upload;
