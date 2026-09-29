const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 1. Thống kê tổng quan hệ thống
router.get('/overview', adminController.getOverview);

// 2. YÊU CẦU 1: Thêm cuốc xe thật
router.post('/trips', adminController.createTrip);

// 3. YÊU CẦU 2: Quản lý & Duyệt tài xế (300k & Giấy tờ)
router.get('/drivers', adminController.getAllDrivers);
router.patch('/drivers/:id/approve', adminController.approveDriver);
router.patch('/drivers/:id/reject', adminController.rejectDriver);
router.patch('/drivers/:id/documents', adminController.updateDriverDocuments);

// 4. YÊU CẦU 3: Tạo cuốc ảo
router.post('/trips/virtual', adminController.createVirtualTrip);
router.post('/trips/virtual/auto-generate', adminController.autoGenerateVirtualTrips);

// 5. YÊU CẦU 4: Cộng số cuốc ảo, tỷ lệ hoàn thành, kinh nghiệm (Màn 2)
router.patch('/drivers/:id/metrics', adminController.updateDriverMetrics);

// 6. YÊU CẦU 5: Xóa / tắt hoạt động user
router.patch('/drivers/:id/toggle-block', adminController.toggleBlockDriver);
router.delete('/drivers/:id', adminController.deleteDriver);

// 7. YÊU CẦU 6: Thêm / sửa thu nhập hôm nay và số cuốc xe (Màn 3)
router.patch('/drivers/:id/income', adminController.updateDriverIncome);

// 8. YÊU CẦU 7: Thêm / sửa đánh giá tài xế (sao & lượt & feedback)
router.patch('/drivers/:id/rating', adminController.updateDriverRating);

// 9. Danh sách & Quản lý cuốc xe
router.get('/trips', adminController.getAllTrips);
router.patch('/trips/:id/unassign', adminController.unassignTrip);
router.patch('/trips/:id/complete', adminController.completeTrip);
router.delete('/trips/:id', adminController.deleteTrip);

module.exports = router;
