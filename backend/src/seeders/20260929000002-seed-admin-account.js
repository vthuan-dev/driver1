'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const adminAccounts = [
      {
        full_name: 'Quản trị viên Hệ thống',
        phone: 'admin',
        password: '11223344',
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
      },
      {
        full_name: 'Quản trị viên Dự phòng',
        phone: 'admin2',
        password: '11223344',
        role: 'admin',
        area: 'Hệ thống Quản trị',
        service_types: JSON.stringify(['lai_xe_ho']),
        vehicle_info: 'Admin System 2',
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
        note: 'Tài khoản admin dự phòng thứ 2',
        payment_status: 'paid',
        payment_amount: 0,
        payment_receipt: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const acc of adminAccounts) {
      const exists = await queryInterface.sequelize.query(
        `SELECT id FROM drivers WHERE phone = '${acc.phone}' LIMIT 1`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (exists.length === 0) {
        await queryInterface.bulkInsert('drivers', [acc]);
      } else {
        await queryInterface.sequelize.query(
          `UPDATE drivers SET password = '${acc.password}', role = 'admin', status = 'active' WHERE phone = '${acc.phone}'`
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('drivers', { phone: 'admin' }, {});
  }
};
