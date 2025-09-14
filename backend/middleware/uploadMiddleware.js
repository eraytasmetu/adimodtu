const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece audio dosyaları kabul edilir.'), false);
  }
};

const limits = {
  fileSize: 50 * 1024 * 1024,
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

module.exports = upload; 