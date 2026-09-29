const { Trip, Driver } = require('../models');

// Lấy danh sách cuốc xe theo Tab (Màn 3)
// Tab: 'new' (cuốc mới), 'in_progress' (đang thực hiện), 'history' (lịch sử)
exports.getFeed = async (req, res) => {
  try {
    const { status = 'new', driver_id = 1 } = req.query;

    let whereClause = {};
    if (status === 'new') {
      whereClause = { status: 'new' };
    } else if (status === 'in_progress') {
      whereClause = { status: ['accepted', 'in_progress'], driver_id };
    } else if (status === 'history') {
      whereClause = { status: 'completed', driver_id };
    }

    const trips = await Trip.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: trips
    });
  } catch (error) {
    console.error('getFeed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Đếm số lượng cuốc xe thực tế cho 3 tabs (Màn 3)
exports.getCounts = async (req, res) => {
  try {
    const { driver_id = 1 } = req.query;

    const new_count = await Trip.count({ where: { status: 'new' } });
    const in_progress_count = await Trip.count({
      where: {
        status: ['accepted', 'in_progress'],
        driver_id
      }
    });
    const history_count = await Trip.count({
      where: {
        status: 'completed',
        driver_id
      }
    });

    res.json({
      success: true,
      data: {
        new_count,
        in_progress_count,
        history_count
      }
    });
  } catch (error) {
    console.error('getCounts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Nhận cuốc xe (Màn 3)
exports.acceptTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const { driver_id = 1 } = req.body;

    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Cuốc xe không tồn tại' });
    }

    if (trip.status !== 'new') {
      return res.status(400).json({
        success: false,
        message: 'Cuốc xe này đã được nhận bởi tài xế khác hoặc đã kết thúc'
      });
    }

    const driver = await Driver.findByPk(driver_id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Tài xế không tồn tại' });
    }

    if (driver.role === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Bạn chưa hoàn tất đăng ký làm đối tác tài xế. Vui lòng đăng ký tài xế để nhận cuốc!'
      });
    }

    if (driver.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản tài xế của bạn đang bị khóa bởi Admin. Vui lòng liên hệ hỗ trợ!'
      });
    }

    if (driver.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Hồ sơ tài xế của bạn đang chờ Admin xác nhận phí 300k. Vui lòng chờ kích hoạt để nhận cuốc!'
      });
    }

    if (!driver.is_online) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng bật trạng thái "Nhận cuốc xe" ở Màn hình Thông tin tài xế trước khi nhận cuốc!'
      });
    }

    // Nhận cuốc
    trip.status = 'accepted';
    trip.driver_id = driver_id;
    await trip.save();

    // Tự động cộng thu nhập và số cuốc xe hôm nay cho tài xế
    driver.daily_income += trip.price;
    driver.daily_trips += 1;
    driver.total_trips += 1;
    await driver.save();

    res.json({
      success: true,
      message: `Nhận cuốc thành công! Thu nhập hôm nay đã tăng thêm +${trip.price.toLocaleString('vi-VN')}đ`,
      data: {
        trip,
        updated_driver: {
          daily_income: driver.daily_income,
          daily_trips: driver.daily_trips,
          total_trips: driver.total_trips
        }
      }
    });
  } catch (error) {
    console.error('acceptTrip error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hoàn thành cuốc xe (Màn 3)
exports.completeTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Cuốc xe không tồn tại' });
    }

    trip.status = 'completed';
    await trip.save();

    res.json({
      success: true,
      message: 'Cuốc xe đã hoàn thành thành công!',
      data: trip
    });
  } catch (error) {
    console.error('completeTrip error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
