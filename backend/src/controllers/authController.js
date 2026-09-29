const { Driver, sequelize } = require('../models');
const { Op } = require('sequelize');

const findByPhone = (rawPhone) => {
  const cleanPhone = (rawPhone || '').replace(/\s+/g, '');
  return Driver.findOne({
    where: {
      [Op.or]: [
        { phone: cleanPhone },
        { phone: rawPhone },
        sequelize.where(
          sequelize.fn('REPLACE', sequelize.col('phone'), ' ', ''),
          cleanPhone
        )
      ]
    }
  });
};

// Đăng ký tài khoản người dùng mới (User)
exports.registerUser = async (req, res) => {
  try {
    const { full_name, phone, password } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ Họ tên và Số điện thoại'
      });
    }

    const cleanPhone = phone.replace(/\s+/g, '');
    const existing = await findByPhone(cleanPhone);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại này đã được đăng ký. Vui lòng chọn Đăng nhập!'
      });
    }

    const newUser = await Driver.create({
      full_name: full_name.trim(),
      phone: cleanPhone,
      password: password || '123456',
      role: 'user', // Mới chỉ là Người dùng thông thường, chưa phải Tài xế
      status: 'pending',
      area: 'Thanh Hoá',
      service_types: ['lai_xe_ho'],
      vehicle_info: 'Chưa đăng ký',
      experience: 'Mới tham gia',
      total_trips: 0,
      completion_rate: 100,
      daily_income: 0,
      daily_trips: 0,
      rating: 5.0,
      rating_count: 0,
      is_online: false,
      payment_status: 'unpaid',
      payment_amount: 300000
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Bây giờ bạn có thể đăng ký làm đối tác tài xế.',
      data: newUser
    });
  } catch (error) {
    console.error('registerUser error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Đăng nhập tài khoản (bằng SĐT & Mật khẩu)
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập số điện thoại đăng nhập'
      });
    }

    const cleanPhone = phone.replace(/\s+/g, '');
    const user = await findByPhone(cleanPhone);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Số điện thoại chưa tồn tại trong hệ thống. Vui lòng tạo tài khoản mới!'
      });
    }

    // Kiểm tra mật khẩu (hỗ trợ mật khẩu DB và các mật khẩu mặc định admin/123456 cho tiện demo)
    const isPasswordValid = 
      !user.password ||
      user.password === password ||
      password === '123456' ||
      (user.role === 'admin' && (password === 'admin' || password === 'admin123'));

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu đăng nhập không chính xác'
      });
    }

    res.json({
      success: true,
      message: `Chào mừng ${user.full_name} quay trở lại!`,
      data: user
    });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy thông tin phiên hiện tại
exports.getMe = async (req, res) => {
  try {
    const userId = req.query.id || req.headers['x-user-id'] || 1;
    const user = await Driver.findByPk(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Phiên đăng nhập không tồn tại' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
