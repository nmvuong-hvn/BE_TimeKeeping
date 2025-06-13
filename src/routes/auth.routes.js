const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Đăng ký tài khoản (chỉ superadmin mới nên dùng thực tế)
router.post('/register', authController.register);

// Đăng nhập
router.post('/login', authController.login);

module.exports = router;
