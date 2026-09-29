const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

// Lấy danh sách cuốc xe theo tab: new, in_progress, history (Màn 3)
router.get('/feed', tripController.getFeed);
router.get('/counts', tripController.getCounts);

// Tài xế nhận cuốc xe (Màn 3)
router.post('/:id/accept', tripController.acceptTrip);

// Hoàn thành cuốc xe (Màn 3)
router.post('/:id/complete', tripController.completeTrip);

module.exports = router;
