const { Driver, Trip, Review, sequelize } = require('../models');
const aiTripService = require('../services/aiTripService');

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

// Tự động sinh hàng loạt 3-5 cuốc ảo đa dạng (Hỗ trợ theo Tỉnh thành & AI tự động)
exports.autoGenerateVirtualTrips = async (req, res) => {
  try {
    const { province } = req.body || {};
    const targetProvince = province || ['Đà Nẵng', 'TP. Hồ Chí Minh', 'Hà Nội', 'Thanh Hóa'][Math.floor(Math.random() * 4)];

    let generatedTrips = [];

    // Ưu tiên 1: Thử dùng AI Groq tạo 3 cuốc hoàn toàn mới lạ cho tỉnh này
    try {
      const aiResult = await aiTripService.generateVirtualTrips('', {
        province: targetProvince,
        scope: 'intra_province',
        count: 3
      });
      if (aiResult && Array.isArray(aiResult.trips) && aiResult.trips.length > 0) {
        generatedTrips = aiResult.trips;
      }
    } catch (aiErr) {
      console.warn('AI generate trong autoGenerateVirtualTrips gặp lỗi, dùng Dynamic Diversity Generator:', aiErr.message);
    }

    // Ưu tiên 2: Nếu AI không khả dụng, dùng Kho dữ liệu ngẫu nhiên đa dạng (không bao giờ lặp lại 3 cuốc cứng)
    if (generatedTrips.length === 0) {
      const { DIVERSITY_DATA } = aiTripService;
      const shuffledCars = [...(DIVERSITY_DATA?.car_models || ['Mazda CX-5', 'Mercedes C200', 'Toyota Camry'])].sort(() => 0.5 - Math.random());
      const shuffledSituations = [...(DIVERSITY_DATA?.customer_situations || ['Khách say cần lái xe hộ đưa cả người và xe về nhà an toàn.'])].sort(() => 0.5 - Math.random());
      const shuffledNames = [...(DIVERSITY_DATA?.customer_names || ['Anh Tuấn Anh', 'Chị Mai Lan', 'Anh Quốc Hùng'])].sort(() => 0.5 - Math.random());

      // Kho địa điểm phong phú theo từng khu vực
      const venuePools = {
        'TP. Hồ Chí Minh': [
          { p: 'Quán ốc Đêm 79, 142 Bờ Kè Kênh Nhiêu Lộc, P. 11, Q. 3', d: 'Chung cư Masteri Thảo Điền Tháp T3, TP. Thủ Đức', dist: 9.8, pr: 210000 },
          { p: 'Nhà hàng Lẩu Nướng Sân Vườn 365, 88 Bàu Cát, P. 14, Q. Tân Bình', d: 'Khu dân cư Trung Sơn, Bình Hưng, Huyện Bình Chánh', dist: 14.2, pr: 270000 },
          { p: 'Hầm rượu vang V VIP, 18 Pasteur, P. Bến Nghé, Quận 1', d: 'Khu biệt thự Chateau, Tân Phú, Quận 7', dist: 12.5, pr: 290000 },
          { p: 'Beer Garden Phố Đêm, 220 Phạm Văn Đồng, P. 1, Q. Gò Vấp', d: 'Chung cư Sunrise City Block Central, Q. 7', dist: 16.8, pr: 320000 },
          { p: 'Quán Dê Tươi Núi Ngự, 45 Sư Vạn Hạnh, P. 12, Quận 10', d: 'Hẻm 382/15 Quang Trung, P. 10, Q. Gò Vấp', dist: 11.2, pr: 230000 },
          { p: 'Nhà hàng Hải Sản Bơi Sống Biển Đông, 716 Trần Hưng Đạo, P. 2, Quận 5', d: 'KĐT Sala Đại Quang Minh, P. An Lợi Đông, TP. Thủ Đức', dist: 8.5, pr: 190000 }
        ],
        'Hà Nội': [
          { p: 'Quán Bia Hơi Cổ 1980, 52 Bát Đàn, P. Hàng Bồ, Q. Hoàn Kiếm', d: 'Chung cư Vinhomes Smart City Tòa S2, Q. Nam Từ Liêm', dist: 15.6, pr: 280000 },
          { p: 'Lẩu Nướng Than Hoa Phố Đêm, 118 Tô Hiệu, P. Dịch Vọng, Q. Cầu Giấy', d: 'Khu đô thị Ngoại Giao Đoàn Tòa N03, Q. Bắc Từ Liêm', dist: 7.2, pr: 180000 },
          { p: 'Hầm Rượu Vang De Paris, 36 Phan Chu Trinh, Q. Hoàn Kiếm', d: 'Biệt thự Bằng Lăng Vinhomes Riverside, Q. Long Biên', dist: 11.8, pr: 260000 },
          { p: 'Nhà hàng Lẩu Dê Đồng Quê, 89 Nguyễn Khang, P. Yên Hòa, Q. Cầu Giấy', d: 'KĐT Văn Quán, P. Phúc La, Q. Hà Đông', dist: 10.5, pr: 220000 },
          { p: 'Rooftop Bar Hồ Tây, 24 Quảng An, P. Quảng An, Q. Tây Hồ', d: 'Chung cư Imperia Garden, 203 Nguyễn Huy Tưởng, Q. Thanh Xuân', dist: 12.3, pr: 240000 }
        ],
        'Đà Nẵng': [
          { p: 'Quán Bia Tươi Biển Đêm, 158 Võ Nguyên Giáp, P. Phước Mỹ, Q. Sơn Trà', d: 'Khu đô thị Hòa Xuân, P. Hòa Xuân, Q. Cẩm Lệ', dist: 11.4, pr: 230000 },
          { p: 'Nhà hàng Nướng Cay 77, 24 Phan Tứ, P. Mỹ An, Q. Ngũ Hành Sơn', d: 'Chung cư Blooming Tower, P. Thuận Phước, Q. Hải Châu', dist: 8.2, pr: 190000 },
          { p: 'Quán Lẩu Bò Sáu Cay, 89 Nguyễn Tri Phương, P. Chính Gián, Q. Thanh Khê', d: 'Khu biệt thự Đảo Xanh, P. Hòa Cường Bắc, Q. Hải Châu', dist: 6.5, pr: 160000 },
          { p: 'Beer Club Bờ Sông Hàn, 32 Bạch Đằng, P. Thạch Thang, Q. Hải Châu', d: 'Hẻm 120 Điện Biên Phủ, P. Hòa Minh, Q. Liên Chiểu', dist: 12.8, pr: 250000 }
        ],
        'Thanh Hóa': [
          { p: 'Nhà hàng Dê Tươi Rừng Thông, 128 Lê Lợi, P. Đông Hương, TP. Thanh Hóa', d: 'Khu biệt thự ven biển FLC, P. Quảng Cư, TP. Sầm Sơn', dist: 16.5, pr: 260000 },
          { p: 'Quán Nhậu Nướng Ngói Phố Mới, 45 Quang Trung, P. Ngọc Trạo, TP. Thanh Hóa', d: 'Khu công nghiệp Lễ Môn, P. Quảng Hưng, TP. Thanh Hóa', dist: 7.8, pr: 170000 },
          { p: 'Bia Hơi Lam Sơn, 22 Bà Triệu, P. Trường Thi, TP. Thanh Hóa', d: 'Khu đô thị Bình Minh, P. Đông Hương, TP. Thanh Hóa', dist: 5.5, pr: 140000 }
        ]
      };

      const pool = venuePools[targetProvince] || venuePools['Đà Nẵng'];
      const shuffledVenues = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);

      generatedTrips = shuffledVenues.map((v, idx) => ({
        pickup_location: v.p,
        dropoff_location: v.d,
        distance_km: v.dist,
        estimated_minutes: Math.round(v.dist * 1.6 + 5),
        price: v.pr,
        service_tags: ['Lái xe hộ', targetProvince],
        customer_name: shuffledNames[idx % shuffledNames.length],
        customer_phone: `09${Math.floor(10 + Math.random() * 89)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`,
        notes: `Xe ${shuffledCars[idx % shuffledCars.length]}. ${shuffledSituations[idx % shuffledSituations.length]}`,
        badge: ['Mới', 'Cuốc HOT', 'VIP'][idx % 3],
        time_posted: ['Vừa xong', '1 phút trước', '3 phút trước'][idx % 3]
      }));
    }

    const createdList = [];
    const now = Date.now();
    for (let i = 0; i < generatedTrips.length; i++) {
      const item = generatedTrips[i];
      const tripId = 'vjob_' + (now + i).toString(36) + Math.random().toString(36).substring(2, 6);
      const trip = await Trip.create({
        id: tripId,
        badge: item.badge || 'Mới',
        pickup_location: item.pickup_location,
        dropoff_location: item.dropoff_location,
        distance_km: item.distance_km,
        estimated_minutes: item.estimated_minutes,
        price: item.price,
        service_tags: item.service_tags || ['Lái xe hộ', targetProvince],
        status: 'new',
        is_virtual: true,
        time_posted: item.time_posted || 'Vừa xong',
        customer_name: item.customer_name || 'Khách hàng',
        customer_phone: item.customer_phone || '0988 888 888',
        notes: item.notes || null
      });
      createdList.push(trip);
    }

    res.json({
      success: true,
      message: `Đã tự động tạo ${createdList.length} cuốc xe ảo đa dạng cho ${targetProvince}!`,
      province: targetProvince,
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

    if (!new_password || new_password.trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 4 ký tự'
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

// ==========================================
// 11. TRỢ LÝ AI GROQ TẠO & DUYỆT CUỐC ẢO
// ==========================================

// Bước 2: AI Tạo và Kiểm Tra Cuốc Xe (Preview)
exports.generateAiTrips = async (req, res) => {
  try {
    const { prompt, province, scope, count } = req.body || {};

    const result = await aiTripService.generateVirtualTrips(prompt, {
      province: province || 'Đà Nẵng',
      scope: scope || 'intra_province',
      count: Number(count) || 5
    });

    res.json({
      success: true,
      message: `AI đã tạo và kiểm tra thành công ${result.count} cuốc xe hợp lệ!`,
      data: result
    });
  } catch (error) {
    console.error('admin generateAiTrips error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi gọi Groq AI để tạo cuốc xe'
    });
  }
};

// Bước 3: Duyệt và Xác Nhận Đăng Lên Hệ Thống
exports.publishAiTrips = async (req, res) => {
  try {
    const { trips } = req.body || {};

    if (!Array.isArray(trips) || trips.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách cuốc xe để đăng không hợp lệ hoặc đang trống'
      });
    }

    const tripsToCreate = [];
    const now = Date.now();

    for (let i = 0; i < trips.length; i++) {
      const item = trips[i];
      if (!item || !item.pickup_location || !item.dropoff_location) continue;

      const tripId = 'vjob_' + (now + i).toString(36) + Math.random().toString(36).substring(2, 6);

      tripsToCreate.push({
        id: tripId,
        badge: item.badge || 'Mới',
        pickup_location: item.pickup_location.trim(),
        dropoff_location: item.dropoff_location.trim(),
        distance_km: Number(item.distance_km) || 15,
        estimated_minutes: Number(item.estimated_minutes) || 25,
        price: Number(item.price) || 200000,
        service_tags: Array.isArray(item.service_tags) ? item.service_tags : ['Lái xe hộ'],
        status: 'new',
        is_virtual: true,
        time_posted: item.time_posted || 'Vừa xong',
        customer_name: item.customer_name || 'Khách hàng',
        customer_phone: item.customer_phone || '0988 888 888',
        notes: item.notes || null
      });
    }

    if (tripsToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có cuốc xe nào hợp lệ để đăng'
      });
    }

    const createdTrips = await Trip.bulkCreate(tripsToCreate);

    res.status(201).json({
      success: true,
      message: `Đã xác nhận đăng thành công ${createdTrips.length} cuốc xe ảo lên hệ thống!`,
      count: createdTrips.length,
      data: createdTrips
    });
  } catch (error) {
    console.error('admin publishAiTrips error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi lưu cuốc xe vào hệ thống'
    });
  }
};

