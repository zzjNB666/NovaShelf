const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { ok, fail } = require('../utils/response');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('只能上传图片文件'));
      return;
    }
    cb(null, true);
  }
});

router.post('/cover', requireAuth, requireAdmin, (req, res) => {
  upload.single('cover')(req, res, (err) => {
    if (err) {
      return fail(res, 400, err.message || '上传失败');
    }

    if (!req.file) {
      return fail(res, 400, '请选择要上传的图片');
    }

    ok(res, { url: `/uploads/${req.file.filename}` }, '上传成功');
  });
});

module.exports = router;
