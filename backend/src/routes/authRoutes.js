const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Đăng ký tài khoản người dùng
router.post('/register', authController.registerUser);

// Đăng nhập
router.post('/login', authController.login);

// Lấy thông tin phiên hiện tại
router.get('/me', authController.getMe);

module.exports = router;
