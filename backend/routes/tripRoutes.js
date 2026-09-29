const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Lấy danh sách cuốc xe theo tab (new, in_progress, history)
router.get('/feed', (req, res) => {
  try {
    const { status = 'new', driver_id = 1 } = req.query;

    let trips;
    if (status === 'new') {
      trips = db.prepare(`
        SELECT * FROM trips 
        WHERE status = 'new'
        ORDER BY created_at DESC
      `).all();
    } else if (status === 'in_progress') {
      trips = db.prepare(`
        SELECT * FROM trips 
        WHERE status = 'accepted' AND driver_id = ?
        ORDER BY created_at DESC
      `).all(driver_id);
    } else {
      // history
      trips = db.prepare(`
        SELECT * FROM trips 
        WHERE status = 'completed' AND driver_id = ?
        ORDER BY created_at DESC
      `).all(driver_id);
    }

    const formatted = trips.map(t => ({
      ...t,
      service_tags: JSON.parse(t.service_tags || '[]'),
      is_virtual: Boolean(t.is_virtual)
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Nhận cuốc xe
router.post('/:id/accept', (req, res) => {
  try {
    const tripId = req.params.id;
    const { driver_id = 1 } = req.body;

    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Cuốc xe không tồn tại' });
    }
    if (trip.status !== 'new') {
      return res.status(400).json({ success: false, message: 'Cuốc xe này đã được tài xế khác nhận' });
    }

    // Cập nhật trạng thái cuốc xe
    db.prepare('UPDATE trips SET status = "accepted", driver_id = ? WHERE id = ?').run(driver_id, tripId);

    // Tự động cộng thu nhập và số cuốc trong ngày cho tài xế
    db.prepare(`
      UPDATE drivers 
      SET daily_income = daily_income + ?,
          daily_trips = daily_trips + 1,
          total_trips = total_trips + 1
      WHERE id = ?
    `).run(trip.price, driver_id);

    res.json({
      success: true,
      message: `Nhận cuốc thành công! Thu nhập +${trip.price.toLocaleString('vi-VN')}đ`,
      trip_id: tripId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Hoàn thành cuốc xe
router.post('/:id/complete', (req, res) => {
  try {
    const tripId = req.params.id;
    db.prepare('UPDATE trips SET status = "completed" WHERE id = ?').run(tripId);
    res.json({ success: true, message: 'Cuốc xe đã hoàn thành' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
