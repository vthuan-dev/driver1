'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if driver 1 already exists
    const drivers = await queryInterface.sequelize.query(
      'SELECT id FROM drivers WHERE id = 1 LIMIT 1',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (drivers.length === 0) {
      await queryInterface.bulkInsert('drivers', [
        {
          id: 1,
          full_name: 'Nguyễn Văn Nam',
          phone: '0987 654 321',
          area: 'Thanh Hoá và khu vực lân cận',
          service_types: JSON.stringify(['lai_xe_ho']),
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          vehicle_info: 'Toyota Vios - 30K 123.45',
          experience: '2 năm',
          total_trips: 320,
          completion_rate: 98,
          daily_income: 1250000,
          daily_trips: 5,
          rating: 4.9,
          rating_count: 320,
          status: 'active',
          is_online: true,
          verified_docs: JSON.stringify(['CCCD/CMND', 'Giấy phép lái xe', 'Đăng kiểm xe', 'Bảo hiểm xe']),
          note: 'Tài xế chuyên nghiệp, thân thiện, đúng giờ',
          payment_status: 'paid',
          payment_amount: 300000,
          payment_receipt: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }

    const trips = await queryInterface.sequelize.query(
      'SELECT id FROM trips WHERE id = "job_01" LIMIT 1',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (trips.length === 0) {
      await queryInterface.bulkInsert('trips', [
        {
          id: 'job_01',
          badge: 'Mới',
          pickup_location: '432 Lê Lai, Thanh Hoá',
          dropoff_location: 'Sân bay Thọ Xuân',
          distance_km: 28,
          estimated_minutes: 35,
          price: 180000,
          service_tags: JSON.stringify(['Lái xe hộ', 'Đường dài']),
          status: 'new',
          is_virtual: false,
          driver_id: null,
          time_posted: '2 phút trước',
          customer_name: 'Anh Hùng',
          customer_phone: '0981 123 456',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'job_02',
          badge: 'Mới',
          pickup_location: 'Vincom Thanh Hoá',
          dropoff_location: 'TP. Sầm Sơn',
          distance_km: 16,
          estimated_minutes: 25,
          price: 120000,
          service_tags: JSON.stringify(['Lái xe hộ', 'Xe tiện chuyến']),
          status: 'new',
          is_virtual: false,
          driver_id: null,
          time_posted: '5 phút trước',
          customer_name: 'Chị Mai',
          customer_phone: '0972 345 678',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'job_03',
          badge: 'Mới',
          pickup_location: 'Bệnh viện Đa khoa Thanh Hoá',
          dropoff_location: 'Khu công nghiệp Lễ Môn',
          distance_km: 12,
          estimated_minutes: 20,
          price: 100000,
          service_tags: JSON.stringify(['Lái xe hộ', 'Đường dài']),
          status: 'new',
          is_virtual: true,
          driver_id: null,
          time_posted: '8 phút trước',
          customer_name: 'Khách công ty',
          customer_phone: '0963 888 999',
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('trips', null, {});
    await queryInterface.bulkDelete('drivers', null, {});
  }
};
