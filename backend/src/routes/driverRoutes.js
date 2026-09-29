const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');

// Lấy profile tài xế (mặc định id = 1 hoặc theo param)
router.get('/profile', driverController.getProfile);
router.get('/profile/:id', driverController.getProfile);

// Đăng ký tài xế mới (Màn 1)
router.post('/register', driverController.register);

// Bật / tắt nhận cuốc xe (Màn 2)
router.patch('/:id/toggle-online', driverController.toggleOnline);

// Cập nhật thông tin hồ sơ (Màn 2)
router.put('/:id/profile', driverController.updateProfile);

module.exports = router;
