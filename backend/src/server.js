require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const driverRoutes = require('./routes/driverRoutes');
const tripRoutes = require('./routes/tripRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Laixeho24h API',
    database: 'MySQL',
    timestamp: new Date()
  });
});

// Cấu hình hệ thống động (VietQR 300k, Dịch vụ, Khu vực)
app.get('/api/system/config', (req, res) => {
  res.json({
    success: true,
    data: {
      app_name: 'Laixeho24h',
      slogan: ['Tham gia ngay', 'Nhận cuốc xe liên tục', 'Tăng thu nhập mỗi ngày'],
      registration_fee: 300000,
      bank: {
        bank_name: 'VIB',
        account_number: '095241233',
        account_name: 'ĐINH THẾ DUY',
        transfer_note: 'Dang ky lam tai xe laixeho24h',
        qr_image_url: 'https://img.vietqr.io/image/vib-095241233-compact2.png?amount=300000&addInfo=Dang%20ky%20lam%20tai%20xe%20laixeho24h&accountName=DINH%20THE%20DUY'
      },
      supported_areas: [
        'Thanh Hoá', 'Hà Nội', 'TP. Hồ Chí Minh', 'Nghệ An', 'Hải Phòng', 'Đà Nẵng'
      ],
      service_types: [
        { id: 'lai_xe_ho', title: 'Lái xe hộ', subtitle: 'Lái xe thay khi khách hàng cần' },
        { id: 'xe_ghep', title: 'Xe ghép / Tiện chuyến', subtitle: 'Đi cùng tuyến - chia sẻ chi phí' },
        { id: 'bao_xe', title: 'Bao xe', subtitle: 'Thuê xe theo thời gian / theo ngày' }
      ]
    }
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Lỗi hệ thống máy chủ'
  });
});

// Start Server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Đã kết nối thành công tới cơ sở dữ liệu MySQL (laixeho24h_db)!');

    app.listen(PORT, () => {
      console.log(`🚀 Server Laixeho24h đang chạy tại http://localhost:${PORT}`);
      console.log(`📡 API Endpoints sẵn sàng:`);
      console.log(`   - Driver API:  http://localhost:${PORT}/api/drivers`);
      console.log(`   - Trips API:   http://localhost:${PORT}/api/trips`);
      console.log(`   - Admin API:   http://localhost:${PORT}/api/admin`);
    });
  } catch (error) {
    console.error('❌ Không thể kết nối tới MySQL:', error);
    process.exit(1);
  }
}

startServer();
