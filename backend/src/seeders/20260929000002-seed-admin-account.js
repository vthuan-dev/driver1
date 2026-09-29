'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const admins = await queryInterface.sequelize.query(
      "SELECT id FROM drivers WHERE phone = 'admin' LIMIT 1",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (admins.length === 0) {
      await queryInterface.bulkInsert('drivers', [
        {
          full_name: 'Quản trị viên Hệ thống',
          phone: 'admin',
          password: 'admin',
          role: 'admin',
          area: 'Hệ thống Quản trị',
          service_types: JSON.stringify(['lai_xe_ho']),
          vehicle_info: 'Admin System',
          experience: '10 năm',
          total_trips: 999,
          completion_rate: 100,
          daily_income: 0,
          daily_trips: 0,
          rating: 5.0,
          rating_count: 0,
          status: 'active',
          is_online: true,
          verified_docs: JSON.stringify(['Toàn quyền Root']),
          note: 'Tài khoản quản trị viên tối cao của hệ thống',
          payment_status: 'paid',
          payment_amount: 0,
          payment_receipt: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
    } else {
      // Đảm bảo mật khẩu và role luôn là admin
      await queryInterface.sequelize.query(
        "UPDATE drivers SET password = 'admin', role = 'admin', status = 'active' WHERE phone = 'admin'"
      );
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('drivers', { phone: 'admin' }, {});
  }
};
