const { Driver, Review, Trip } = require('../models');

// Lấy thông tin tài xế
exports.getProfile = async (req, res) => {
  try {
    const driverId = req.params.id || 1;
    const driver = await Driver.findByPk(driverId, {
      include: [
        { model: Review, as: 'reviews', limit: 5, order: [['created_at', 'DESC']] }
      ]
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
    }

    res.json({
      success: true,
      data: driver
    });
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Đăng ký tài xế mới (Màn 1)
exports.register = async (req, res) => {
  try {
    const { full_name, phone, area, service_types, vehicle_info, payment_receipt } = req.body;

    if (!full_name || !phone || !area) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Khu vực hoạt động'
      });
    }

    // Chuẩn hóa SĐT và kiểm tra tài khoản
    const cleanPhone = (phone || '').replace(/\s+/g, '');
    const { Op } = require('sequelize');

    const existing = await Driver.findOne({
      where: {
        [Op.or]: [
          { phone: cleanPhone },
          { phone: phone }
        ]
      }
    });

    if (existing) {
      if (existing.role === 'driver' && existing.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Tài khoản này đã là Đối tác Tài xế chính thức đang hoạt động.'
        });
      }

      if (existing.role === 'driver' && existing.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Hồ sơ tài xế của bạn đang trong danh sách chờ Admin phê duyệt kích hoạt (300k).'
        });
      }

      // Nếu là tài khoản Người dùng (role === 'user') -> Nâng cấp lên Tài xế chờ duyệt
      existing.full_name = full_name.trim();
      existing.area = area;
      existing.service_types = service_types || ['lai_xe_ho'];
      existing.vehicle_info = vehicle_info || 'Đang cập nhật';
      existing.payment_receipt = payment_receipt || null;
      existing.payment_status = 'paid';
      existing.payment_amount = 300000;
      existing.role = 'driver';
      existing.status = 'pending'; // Chờ Admin kiểm duyệt 300k

      await existing.save();

      return res.status(200).json({
        success: true,
        message: 'Nâng cấp hồ sơ tài xế thành công! Phí thành viên 300.000đ đang được Admin kiểm duyệt kích hoạt.',
        data: existing
      });
    }

    // Nếu chưa có tài khoản, tạo mới với vai trò Driver chờ duyệt
    const newDriver = await Driver.create({
      full_name: full_name.trim(),
      phone: cleanPhone,
      area,
      service_types: service_types || ['lai_xe_ho'],
      vehicle_info: vehicle_info || 'Đang cập nhật',
      payment_receipt: payment_receipt || null,
      role: 'driver',
      status: 'pending', // Chờ Admin kiểm duyệt 300k
      payment_status: 'paid', // Đã chuyển khoản 300k
      payment_amount: 300000,
      total_trips: 0,
      completion_rate: 100,
      experience: 'Mới tham gia',
      daily_income: 0,
      daily_trips: 0,
      rating: 5.0,
      rating_count: 0,
      is_online: false
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Phí thành viên 300.000đ đang được Admin kiểm duyệt kích hoạt.',
      data: newDriver
    });
  } catch (error) {
    console.error('register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bật / Tắt nhận cuốc xe (Màn 2)
exports.toggleOnline = async (req, res) => {
  try {
    const driverId = req.params.id || 1;
    const driver = await Driver.findByPk(driverId);

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
    }

    if (driver.role === 'user') {
      return res.status(403).json({
        success: false,
        message: 'Bạn chưa đăng ký làm đối tác tài xế. Vui lòng đăng ký đối tác để bật nhận cuốc!'
      });
    }

    if (driver.status === 'blocked') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đang bị khóa bởi Admin. Vui lòng liên hệ hỗ trợ!'
      });
    }
    if (driver.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Hồ sơ tài xế đang chờ duyệt kích hoạt phí 300k từ Admin.'
      });
    }

    const nextState = !driver.is_online;
    driver.is_online = nextState;
    await driver.save();

    res.json({
      success: true,
      is_online: nextState,
      data: { is_online: nextState },
      message: nextState
        ? 'Đã bật nhận cuốc xe! Sẵn sàng nhận cuốc mới.'
        : 'Đã tạm tắt nhận cuốc xe.'
    });
  } catch (error) {
    console.error('toggleOnline error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Chỉnh sửa hồ sơ tài xế (Màn 2)
exports.updateProfile = async (req, res) => {
  try {
    const driverId = req.params.id || 1;
    const { full_name, area, vehicle_info, note, service_types, document_details } = req.body;

    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài xế' });
    }

    if (full_name) driver.full_name = full_name;
    if (area) driver.area = area;
    if (vehicle_info) driver.vehicle_info = vehicle_info;
    if (note) driver.note = note;
    if (service_types) driver.service_types = service_types;
    if (document_details) {
      driver.document_details = {
        ...(driver.document_details || {}),
        ...document_details
      };
    }

    await driver.save();

    res.json({
      success: true,
      message: 'Cập nhật thông tin hồ sơ và giấy tờ thành công! Hồ sơ đã được lưu trữ an toàn.',
      data: driver
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
