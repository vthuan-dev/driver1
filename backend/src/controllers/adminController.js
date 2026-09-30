const { Driver, Trip, Review, sequelize } = require('../models');

// ==========================================
// 1. TỔNG QUAN HỆ THỐNG
// ==========================================
exports.getOverview = async (req, res) => {
  try {
    const totalDrivers = await Driver.count();
    const pendingDrivers = await Driver.count({ where: { status: 'pending' } });
    const activeDrivers = await Driver.count({ where: { status: 'active' } });
    const onlineDrivers = await Driver.count({ where: { status: 'active', is_online: true } });

    const totalTrips = await Trip.count();
    const virtualTrips = await Trip.count({ where: { is_virtual: true } });
    const newTrips = await Trip.count({ where: { status: 'new' } });

    // Doanh thu thật từ các tài xế đã nộp/kích hoạt phí 300k
    const totalRegistrationRevenue = (await Driver.sum('payment_amount', { where: { payment_status: 'paid' } })) || 0;

    res.json({
      success: true,
      data: {
        totalDrivers,
        pendingDrivers,
        activeDrivers,
        onlineDrivers,
        totalTrips,
        virtualTrips,
        newTrips,
        totalRegistrationRevenue
      }
    });
  } catch (error) {
    console.error('admin getOverview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. YÊU CẦU 1: THÊM CUỐC XE THẬT
// ==========================================
exports.createTrip = async (req, res) => {
  try {
    const {
      pickup_location,
      dropoff_location,
      distance_km,
      estimated_minutes,
      price,
      service_tags,
      customer_name,
      customer_phone,
      notes
    } = req.body;

    if (!pickup_location || !dropoff_location || !price) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập Điểm đón, Điểm trả và Giá cước'
      });
    }

    const tripId = 'trip_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

    const trip = await Trip.create({
      id: tripId,
      badge: 'Mới',
      pickup_location,
      dropoff_location,
      distance_km: Number(distance_km) || 10,
      estimated_minutes: Number(estimated_minutes) || 20,
      price: Number(price),
      service_tags: service_tags || ['Lái xe hộ'],
      status: 'new',
      is_virtual: false,
      time_posted: 'Vừa xong',
      customer_name: customer_name || 'Khách hàng',
      customer_phone: customer_phone || '0988 888 888',
      notes: notes || null
    });

    res.status(201).json({
      success: true,
      message: 'Thêm cuốc xe thật thành công!',
      data: trip
    });
  } catch (error) {
    console.error('admin createTrip error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. YÊU CẦU 2: DUYỆT NGƯỜI (TÀI XẾ 300K)
// ==========================================
exports.getAllDrivers = async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = status ? { status } : {};

    const drivers = await Driver.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: drivers
    });
  } catch (error) {
    console.error('admin getAllDrivers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveDriver = async (req, res) => {
  try {
    const driverId = req.params.id;
    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
    }

    driver.status = 'active';
    driver.payment_status = 'paid';
    if (!driver.verified_docs || driver.verified_docs.length === 0) {
      driver.verified_docs = ['CCCD/CMND', 'Giấy phép lái xe', 'Đăng kiểm xe', 'Bảo hiểm xe'];
    }
    await driver.save();

    res.json({
      success: true,
      message: `Đã duyệt thành công tài xế: ${driver.full_name} (Thu phí kích hoạt 300.000đ và xác minh hồ sơ)`,
      data: driver
    });
  } catch (error) {
    console.error('admin approveDriver error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDriverDocuments = async (req, res) => {
  try {
    const driverId = req.params.id;
    const { verified_docs, document_details } = req.body;

    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
    }

    if (verified_docs !== undefined) {
      driver.verified_docs = verified_docs;
    }
    if (document_details !== undefined) {
      driver.document_details = {
        ...(driver.document_details || {}),
        ...document_details
      };
    }

    await driver.save();

    res.json({
      success: true,
      message: `Đã cập nhật phê duyệt giấy tờ hồ sơ cho tài xế ${driver.full_name}`,
      data: driver
    });
  } catch (error) {
    console.error('admin updateDriverDocuments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectDriver = async (req, res) => {
  try {
    const driverId = req.params.id;
    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
    }

    driver.status = 'blocked';
    await driver.save();

    res.json({
      success: true,
      message: `Đã từ chối / hủy hồ sơ đăng ký của tài xế: ${driver.full_name}`,
      data: driver
    });
  } catch (error) {
    console.error('admin rejectDriver error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. YÊU CẦU 3: TẠO CUỐC ẢO (IS_VIRTUAL = TRUE)
// ==========================================
exports.createVirtualTrip = async (req, res) => {
  try {
    const {
      pickup_location,
      dropoff_location,
      distance_km,
      estimated_minutes,
      price,
      service_tags,
      time_posted
    } = req.body;

    const tripId = 'vjob_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

    const trip = await Trip.create({
      id: tripId,
      badge: 'Mới',
      pickup_location: pickup_location || 'Vinpearl Hotel Thanh Hoá',
      dropoff_location: dropoff_location || 'Khu du lịch Hải Tiến',
      distance_km: Number(distance_km) || 22,
      estimated_minutes: Number(estimated_minutes) || 30,
      price: Number(price) || 200000,
      service_tags: service_tags || ['Lái xe hộ', 'Đường dài'],
      status: 'new',
      is_virtual: true,
      time_posted: time_posted || 'Vừa xong',
      customer_name: 'Khách hàng đối tác',
      customer_phone: '0909 000 111'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo cuốc xe ảo thành công! Cuốc này sẽ hiển thị trên Job Feed của tài xế.',
      data: trip
    });
  } catch (error) {
    console.error('admin createVirtualTrip error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tự động sinh hàng loạt 3-5 cuốc ảo mẫu
exports.autoGenerateVirtualTrips = async (req, res) => {
  try {
    const sampleTrips = [
      {
        pickup_location: 'Khu Đô Thị Vinhomes Star City',
        dropoff_location: 'Sân Golf FLC Sầm Sơn',
        distance_km: 18,
        estimated_minutes: 25,
        price: 150000,
        service_tags: ['Lái xe hộ', 'Xe tiện chuyến'],
        time_posted: '1 phút trước'
      },
      {
        pickup_location: 'Ngã Ba Voi, P. Đông Hương',
        dropoff_location: 'Thị xã Bỉm Sơn',
        distance_km: 36,
        estimated_minutes: 45,
        price: 260000,
        service_tags: ['Lái xe hộ', 'Đường dài'],
        time_posted: '3 phút trước'
      },
      {
        pickup_location: 'Khách sạn Mường Thanh Thanh Hoá',
        dropoff_location: 'Nhà ga Thanh Hoá',
        distance_km: 8,
        estimated_minutes: 15,
        price: 90000,
        service_tags: ['Lái xe hộ'],
        time_posted: '4 phút trước'
      }
    ];

    const createdList = [];
    for (const item of sampleTrips) {
      const tripId = 'vjob_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      const trip = await Trip.create({
        id: tripId,
        badge: 'Mới',
        pickup_location: item.pickup_location,
        dropoff_location: item.dropoff_location,
        distance_km: item.distance_km,
        estimated_minutes: item.estimated_minutes,
        price: item.price,
        service_tags: item.service_tags,
        status: 'new',
        is_virtual: true,
        time_posted: item.time_posted,
        customer_name: 'Khách đặt tự động',
        customer_phone: '0977 123 789'
      });
      createdList.push(trip);
    }

    res.json({
      success: true,
      message: `Đã tự động tạo ${createdList.length} cuốc xe ảo vào bảng tin!`,
      data: createdList
    });
  } catch (error) {
    console.error('admin autoGenerateVirtualTrips error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. YÊU CẦU 4: CỘNG CUỐC ẢO, TỶ LỆ HOÀN THÀNH, KINH NGHIỆM (MÀN 2)
// ==========================================
exports.updateDriverMetrics = async (req, res) => {
  try {
    const driverId = req.params.id;
    const { add_trips, total_trips, completion_rate, experience } = req.body;

    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
    }

    // Nếu truyền add_trips thì cộng dồn, nếu truyền total_trips thì gán thẳng
    if (add_trips !== undefined) {
      driver.total_trips += Number(add_trips);
    } else if (total_trips !== undefined) {
      driver.total_trips = Number(total_trips);
    }

    if (completion_rate !== undefined) {
      driver.completion_rate = Math.min(100, Math.max(0, Number(completion_rate)));
    }

    if (experience !== undefined) {
      driver.experience = experience;
    }

    await driver.save();

    res.json({
      success: true,
      message: 'Đã cập nhật chỉ số tài xế thành công! (Màn 2 sẽ hiển thị ngay)',
      data: {
        id: driver.id,
        full_name: driver.full_name,
        total_trips: driver.total_trips,
        completion_rate: driver.completion_rate,
        experience: driver.experience
      }
    });
  } catch (error) {
    console.error('admin updateDriverMetrics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. YÊU CẦU 5: BẬT / TẮT & XOÁ USER
// ==========================================
exports.toggleBlockDriver = async (req, res) => {
  try {
    const driverId = req.params.id;
    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
    }

    const nextStatus = driver.status === 'blocked' ? 'active' : 'blocked';
    driver.status = nextStatus;
    if (nextStatus === 'blocked') {
      driver.is_online = false;
    }
    await driver.save();

    res.json({
      success: true,
      message: nextStatus === 'blocked'
        ? `Đã khóa/tắt hoạt động của tài xế: ${driver.full_name}`
        : `Đã mở khóa hoạt động cho tài xế: ${driver.full_name}`,
      status: nextStatus
    });
  } catch (error) {
    console.error('admin toggleBlockDriver error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteDriver = async (req, res) => {
  try {
    const driverId = req.params.id;
    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
    }

    const driverName = driver.full_name;
    await driver.destroy();

    res.json({
      success: true,
      message: `Đã xóa hoàn toàn tài khoản tài xế "${driverName}" khỏi hệ thống!`
    });
  } catch (error) {
    console.error('admin deleteDriver error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 7. YÊU CẦU 6: THÊM THU NHẬP VÀ CUỐC XE (MÀN 3)
// ==========================================
exports.updateDriverIncome = async (req, res) => {
  try {
    const driverId = req.params.id;
    const { add_income, daily_income, add_daily_trips, daily_trips } = req.body;

    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
    }

    // Cộng hoặc gán thu nhập hôm nay
    if (add_income !== undefined) {
      driver.daily_income += Number(add_income);
    } else if (daily_income !== undefined) {
      driver.daily_income = Number(daily_income);
    }

    // Cộng hoặc gán số cuốc hôm nay
    if (add_daily_trips !== undefined) {
      driver.daily_trips += Number(add_daily_trips);
    } else if (daily_trips !== undefined) {
      driver.daily_trips = Number(daily_trips);
    }

    await driver.save();

    res.json({
      success: true,
      message: 'Đã cập nhật thu nhập và số cuốc trong ngày thành công! (Màn 3 sẽ hiển thị ngay)',
      data: {
        id: driver.id,
        daily_income: driver.daily_income,
        daily_trips: driver.daily_trips
      }
    });
  } catch (error) {
    console.error('admin updateDriverIncome error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 8. YÊU CẦU 7: THÊM ĐÁNH GIÁ TÀI XẾ (MÀN 2 & MÀN 3)
// ==========================================
exports.updateDriverRating = async (req, res) => {
  try {
    const driverId = req.params.id;
    const { rating, rating_count, customer_name, comment } = req.body;

    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
    }

    if (rating !== undefined) {
      driver.rating = Number(rating);
    }
    if (rating_count !== undefined) {
      driver.rating_count = Number(rating_count);
    }
    await driver.save();

    // Nếu có gửi kèm nội dung review, tạo bản ghi trong bảng reviews
    let newReview = null;
    if (customer_name && comment) {
      newReview = await Review.create({
        driver_id: driver.id,
        customer_name,
        rating: rating || 5.0,
        comment
      });
    }

    res.json({
      success: true,
      message: 'Đã cập nhật điểm đánh giá sao và lượt feedback của tài xế!',
      data: {
        rating: driver.rating,
        rating_count: driver.rating_count,
        review: newReview
      }
    });
  } catch (error) {
    console.error('admin updateDriverRating error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 9. QUẢN LÝ TẤT CẢ CUỐC XE
// ==========================================
exports.getAllTrips = async (req, res) => {
  try {
    const { is_virtual, status } = req.query;
    const whereClause = {};

    if (is_virtual !== undefined) {
      whereClause.is_virtual = is_virtual === 'true' || is_virtual === '1';
    }
    if (status) {
      whereClause.status = status;
    }

    const trips = await Trip.findAll({
      where: whereClause,
      include: [{
        model: Driver,
        as: 'driver',
        attributes: ['id', 'full_name', 'phone', 'vehicle_info', 'area', 'avatar_url', 'rating', 'status', 'is_online']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: trips
    });
  } catch (error) {
    console.error('admin getAllTrips error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unassignTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cuốc xe' });
    }
    trip.driver_id = null;
    trip.status = 'new';
    await trip.save();

    res.json({
      success: true,
      message: 'Đã thu hồi cuốc xe và nhả về trạng thái Chờ tài xế nhận',
      data: trip
    });
  } catch (error) {
    console.error('admin unassignTrip error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.completeTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cuốc xe' });
    }
    trip.status = 'completed';
    await trip.save();

    res.json({
      success: true,
      message: 'Đã đánh dấu cuốc xe hoàn thành',
      data: trip
    });
  } catch (error) {
    console.error('admin completeTrip error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cuốc xe' });
    }

    await trip.destroy();
    res.json({
      success: true,
      message: 'Đã xóa cuốc xe thành công'
    });
  } catch (error) {
    console.error('admin deleteTrip error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 10. ĐỔI MẬT KHẨU QUẢN TRỊ VIÊN (ADMIN)
// ==========================================
exports.changeAdminPassword = async (req, res) => {
  try {
    const { admin_id, current_password, new_password } = req.body || {};

    if (!new_password || new_password.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Tìm tài khoản admin theo ID hoặc phone = 'admin'
    let admin = null;
    if (admin_id) {
      admin = await Driver.findOne({ where: { id: admin_id, role: 'admin' } });
    }
    if (!admin) {
      admin = await Driver.findOne({ where: { phone: 'admin', role: 'admin' } });
    }

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản Quản trị viên'
      });
    }

    // Kiểm tra mật khẩu hiện tại nếu có gửi lên
    if (current_password) {
      const isValid = 
        admin.password === current_password ||
        (!admin.password && (current_password === 'admin' || current_password === '123456'));

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không chính xác'
        });
      }
    }

    // Cập nhật mật khẩu mới
    admin.password = new_password.trim();
    await admin.save();

    res.json({
      success: true,
      message: 'Đổi mật khẩu Quản trị viên thành công! Mật khẩu mới đã được kích hoạt.',
      data: {
        id: admin.id,
        phone: admin.phone,
        full_name: admin.full_name
      }
    });
  } catch (error) {
    console.error('changeAdminPassword error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

