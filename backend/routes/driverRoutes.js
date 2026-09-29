const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Lấy thông tin tài xế hiện tại (mặc định ID = 1 hoặc theo query)
router.get('/profile/:id?', (req, res) => {
  try {
    const driverId = req.params.id || 1;
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
    }
    // Parse JSON fields
    const formatted = {
      ...driver,
      service_types: JSON.parse(driver.service_types || '[]'),
      verified_docs: JSON.parse(driver.verified_docs || '[]'),
      is_online: Boolean(driver.is_online)
    };
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Đăng ký tài xế mới (Màn 1)
router.post('/register', (req, res) => {
  try {
    const { full_name, phone, area, service_types, vehicle_info, payment_receipt } = req.body;
    if (!full_name || !phone || !area) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ Họ tên, SĐT và Khu vực' });
    }

    // Kiểm tra số điện thoại đã tồn tại chưa
    const existing = db.prepare('SELECT id FROM drivers WHERE phone = ?').get(phone);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Số điện thoại này đã được đăng ký trên hệ thống' });
    }

    const stmt = db.prepare(`
      INSERT INTO drivers (
        full_name, phone, area, service_types, vehicle_info, payment_receipt,
        status, payment_status, payment_amount, total_trips, completion_rate,
        experience, daily_income, daily_trips, rating, rating_count, is_online
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 'paid', 300000, 0, 100, 'Mới tham gia', 0, 0, 5.0, 0, 0)
    `);

    const result = stmt.run(
      full_name,
      phone,
      area,
      JSON.stringify(service_types || ['lai_xe_ho']),
      vehicle_info || 'Đang cập nhật phương tiện',
      payment_receipt || null
    );

    res.json({
      success: true,
      message: 'Đăng ký thành công! Hồ sơ đang được Admin kiểm duyệt kích hoạt tài khoản.',
      driver_id: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bật / Tắt nhận cuốc xe (Màn 2)
router.patch('/:id/toggle-online', (req, res) => {
  try {
    const driverId = req.params.id;
    const driver = db.prepare('SELECT is_online FROM drivers WHERE id = ?').get(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
    }

    const nextState = driver.is_online ? 0 : 1;
    db.prepare('UPDATE drivers SET is_online = ? WHERE id = ?').run(nextState, driverId);

    res.json({
      success: true,
      is_online: Boolean(nextState),
      message: nextState ? 'Đã bật nhận cuốc xe! Sẵn sàng nhận chuyến mới.' : 'Đã tạm tắt nhận cuốc xe.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
