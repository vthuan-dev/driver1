/**
 * BỘ TEST TOÀN DIỆN TẤT CẢ ENDPOINT BACKEND LAIXEHO24H
 * Kiểm thử liên thông dữ liệu trực tiếp với MySQL
 */

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const start = Date.now();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const duration = Date.now() - start;
  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, duration, data };
}

async function runAllTests() {
  console.log('\n============================================================');
  console.log('🚀 BẮT ĐẦU CHẠY KIỂM THỬ TOÀN BỘ API (BACKEND + MYSQL)');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${testName} ${details ? `(${details})` : ''}`);
    } else {
      failed++;
      console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // NHÓM 1: HEALTH CHECK
    // -------------------------------------------------------------
    console.log('👉 [1/4] Kiểm tra Hệ thống & Kết nối Cơ sở dữ liệu:');
    const health = await request('/health');
    assert(health.status === 200 && health.data.database === 'MySQL', 'Health Check API', `${health.duration}ms`);

    // -------------------------------------------------------------
    // NHÓM 2: API TÀI XẾ (DRIVER APIS)
    // -------------------------------------------------------------
    console.log('\n👉 [2/4] Kiểm tra API Tài xế (Driver Screens 1, 2, 3):');

    // 2.1 Lấy thông tin tài xế mẫu (Màn 2)
    const p1 = await request('/drivers/profile/1');
    assert(
      p1.status === 200 && p1.data.data.full_name === 'Nguyễn Văn Nam',
      'GET /api/drivers/profile/1 (Xem hồ sơ tài xế)',
      `Tên: ${p1.data.data?.full_name}, Số cuốc: ${p1.data.data?.total_trips}`
    );

    // 2.2 Đăng ký tài xế mới (Màn 1)
    const regPhone = '098' + Math.floor(1000000 + Math.random() * 9000000);
    const regRes = await request('/drivers/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: 'Trần Văn Mạnh',
        phone: regPhone,
        area: 'TP. Sầm Sơn, Thanh Hoá',
        service_types: ['lai_xe_ho', 'xe_ghep'],
        vehicle_info: 'Honda City - 36A 999.88',
        payment_receipt: 'https://example.com/receipt_300k.jpg'
      })
    });
    const newDriverId = regRes.data.data?.id;
    assert(
      regRes.status === 201 && regRes.data.success && newDriverId,
      'POST /api/drivers/register (Màn 1: Đăng ký + nạp phí 300k)',
      `Mã tài xế mới: ${newDriverId}, Trạng thái: ${regRes.data.data?.status}`
    );

    // 2.3 Bật / Tắt nhận cuốc xe (Màn 2)
    const toggleRes = await request('/drivers/1/toggle-online', { method: 'PATCH' });
    assert(
      toggleRes.status === 200 && typeof toggleRes.data.is_online === 'boolean',
      'PATCH /api/drivers/1/toggle-online (Màn 2: Công tắc nhận cuốc)',
      `Online: ${toggleRes.data.is_online}`
    );

    // Bật lại online để nhận cuốc
    if (!toggleRes.data.is_online) {
      await request('/drivers/1/toggle-online', { method: 'PATCH' });
    }

    // 2.4 Cập nhật thông tin cá nhân (Màn 2)
    const updateProf = await request('/drivers/1/profile', {
      method: 'PUT',
      body: JSON.stringify({ note: 'Tài xế chuyên nghiệp, lịch sự, đúng hẹn 100%' })
    });
    assert(updateProf.status === 200, 'PUT /api/drivers/1/profile (Màn 2: Chỉnh sửa hồ sơ)');

    // -------------------------------------------------------------
    // NHÓM 3: API CUỐC XE & JOB FEED (TRIP APIS)
    // -------------------------------------------------------------
    console.log('\n👉 [3/4] Kiểm tra API Cuốc xe & Job Feed (Màn 3):');

    // 3.1 Feed tab cuốc mới
    const feedNew = await request('/trips/feed?status=new');
    assert(
      feedNew.status === 200 && Array.isArray(feedNew.data.data) && feedNew.data.data.length > 0,
      'GET /api/trips/feed?status=new (Màn 3: Tab Cuốc xe mới)',
      `Có ${feedNew.data.data?.length} cuốc đang chờ`
    );

    // 3.2 Tài xế nhận cuốc xe
    const tripToAccept = feedNew.data.data[0];
    const acceptRes = await request(`/trips/${tripToAccept.id}/accept`, {
      method: 'POST',
      body: JSON.stringify({ driver_id: 1 })
    });
    assert(
      acceptRes.status === 200 && acceptRes.data.success,
      `POST /api/trips/${tripToAccept.id}/accept (Màn 3: Nhận cuốc xe)`,
      `Thu nhập mới: ${acceptRes.data.data?.updated_driver?.daily_income?.toLocaleString('vi-VN')}đ`
    );

    // 3.3 Feed tab đang thực hiện
    const feedInProgress = await request('/trips/feed?status=in_progress&driver_id=1');
    assert(
      feedInProgress.status === 200 && feedInProgress.data.data?.length > 0,
      'GET /api/trips/feed?status=in_progress (Màn 3: Tab Đang thực hiện)',
      `${feedInProgress.data.data?.length} cuốc đang chạy`
    );

    // 3.4 Hoàn thành cuốc xe
    const compRes = await request(`/trips/${tripToAccept.id}/complete`, { method: 'POST' });
    assert(compRes.status === 200, `POST /api/trips/${tripToAccept.id}/complete (Hoàn thành cuốc xe)`);

    // -------------------------------------------------------------
    // NHÓM 4: 7 TÍNH NĂNG ADMIN ĐẶC BIỆT
    // -------------------------------------------------------------
    console.log('\n👉 [4/4] Kiểm tra Đầy đủ 7 Tính năng Quản trị viên (Admin Portal):');

    // 4.0 Dashboard Overview
    const adminOverview = await request('/admin/overview');
    assert(
      adminOverview.status === 200 && adminOverview.data.data.totalDrivers >= 1,
      'GET /api/admin/overview (Thống kê tổng quan Dashboard)'
    );

    // 4.1 YÊU CẦU 1: Thêm cuốc xe thật
    const req1 = await request('/admin/trips', {
      method: 'POST',
      body: JSON.stringify({
        pickup_location: 'Số 15 Hàng Than, Thanh Hoá',
        dropoff_location: 'Bến xe Phía Bắc',
        distance_km: 7,
        estimated_minutes: 15,
        price: 85000,
        service_tags: ['Lái xe hộ'],
        customer_name: 'Bác Nam',
        customer_phone: '0912 999 888'
      })
    });
    assert(
      req1.status === 201 && req1.data.data.is_virtual === false,
      'Admin #1: Thêm cuốc xe thật',
      `ID: ${req1.data.data?.id}, Giá: ${req1.data.data?.price?.toLocaleString('vi-VN')}đ`
    );

    // 4.2 YÊU CẦU 2: Duyệt người đăng ký 300k
    const req2 = await request(`/admin/drivers/${newDriverId}/approve`, { method: 'PATCH' });
    assert(
      req2.status === 200 && req2.data.data.status === 'active',
      'Admin #2: Duyệt tài xế đóng phí 300k',
      `Tài xế ${req2.data.data?.full_name} chuyển sang trạng thái: ACTIVE`
    );

    // 4.3 YÊU CẦU 3: Tạo cuốc ảo
    const req3a = await request('/admin/trips/virtual', {
      method: 'POST',
      body: JSON.stringify({
        pickup_location: 'FLC Grand Hotel Sầm Sơn',
        dropoff_location: 'Khu di tích Lam Kinh',
        distance_km: 55,
        estimated_minutes: 65,
        price: 450000,
        service_tags: ['Lái xe hộ', 'Đường dài']
      })
    });
    assert(
      req3a.status === 201 && req3a.data.data.is_virtual === true,
      'Admin #3A: Tạo cuốc ảo đơn lẻ (is_virtual = true)',
      `ID: ${req3a.data.data?.id}`
    );

    const req3b = await request('/admin/trips/virtual/auto-generate', { method: 'POST' });
    assert(
      req3b.status === 200 && req3b.data.data?.length > 0,
      'Admin #3B: Tự động sinh hàng loạt 3 cuốc ảo vào Feed',
      `Sinh thêm ${req3b.data.data?.length} cuốc ảo`
    );

    // 4.4 YÊU CẦU 4: Cộng số cuốc ảo, tỷ lệ hoàn thành, kinh nghiệm (Màn 2)
    const req4 = await request('/admin/drivers/1/metrics', {
      method: 'PATCH',
      body: JSON.stringify({
        add_trips: 20,          // Cộng thêm 20 cuốc ảo
        completion_rate: 99,    // Buff lên 99%
        experience: '3 năm'     // Sửa kinh nghiệm
      })
    });
    assert(
      req4.status === 200 && req4.data.data.completion_rate === 99,
      'Admin #4: Cộng số cuốc ảo, tỷ lệ hoàn thành & kinh nghiệm',
      `Tổng cuốc: ${req4.data.data?.total_trips}, Tỷ lệ: ${req4.data.data?.completion_rate}%, Kn: ${req4.data.data?.experience}`
    );

    // 4.5 YÊU CẦU 5: Xóa / tắt hoạt động user
    const req5a = await request(`/admin/drivers/${newDriverId}/toggle-block`, { method: 'PATCH' });
    assert(
      req5a.status === 200 && req5a.data.status === 'blocked',
      'Admin #5A: Tắt / khóa hoạt động user',
      `Trạng thái: ${req5a.data.status}`
    );

    const req5b = await request(`/admin/drivers/${newDriverId}`, { method: 'DELETE' });
    assert(
      req5b.status === 200 && req5b.data.success,
      'Admin #5B: Xóa vĩnh viễn user khỏi hệ thống'
    );

    // 4.6 YÊU CẦU 6: Thêm thu nhập hôm nay và số cuốc xe (Màn 3)
    const req6 = await request('/admin/drivers/1/income', {
      method: 'PATCH',
      body: JSON.stringify({
        add_income: 500000,    // Cộng thêm 500.000đ
        add_daily_trips: 2     // Cộng thêm 2 cuốc trong ngày
      })
    });
    assert(
      req6.status === 200,
      'Admin #6: Thêm thu nhập hôm nay & số cuốc trong ngày',
      `Thu nhập mới: ${req6.data.data?.daily_income?.toLocaleString('vi-VN')}đ, Cuốc ngày: ${req6.data.data?.daily_trips}`
    );

    // 4.7 YÊU CẦU 7: Thêm đánh giá tài xế (sao, lượt đánh giá, comment)
    const req7 = await request('/admin/drivers/1/rating', {
      method: 'PATCH',
      body: JSON.stringify({
        rating: 5.0,
        rating_count: 365,
        customer_name: 'Nguyễn Thu Trang',
        comment: 'Tài xế lái xe rất cẩn thận, đón đúng giờ, phong cách 5 sao!'
      })
    });
    assert(
      req7.status === 200 && req7.data.data.rating === 5.0,
      'Admin #7: Thêm / sửa đánh giá tài xế',
      `Sao: ${req7.data.data?.rating}⭐, Lượt: ${req7.data.data?.rating_count}, Review mới: "${req7.data.data?.review?.customer_name}"`
    );
  } catch (err) {
    console.error('❌ Lỗi ngoại lệ trong quá trình chạy test:', err);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`📊 TỔNG KẾT KIỂM THỬ: ${passed} PASSED / ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed === 0) {
    console.log('🎉 TẤT CẢ API ĐỀU HOẠT ĐỘNG HOÀN HẢO 100% TRÊN MYSQL!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAllTests();
