'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('drivers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      full_name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      area: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      service_types: {
        type: Sequelize.JSON,
        defaultValue: ['lai_xe_ho']
      },
      avatar_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      vehicle_info: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      experience: {
        type: Sequelize.STRING(50),
        defaultValue: '2 năm'
      },
      total_trips: {
        type: Sequelize.INTEGER,
        defaultValue: 320
      },
      completion_rate: {
        type: Sequelize.INTEGER,
        defaultValue: 98
      },
      daily_income: {
        type: Sequelize.INTEGER,
        defaultValue: 1250000
      },
      daily_trips: {
        type: Sequelize.INTEGER,
        defaultValue: 5
      },
      rating: {
        type: Sequelize.FLOAT,
        defaultValue: 4.9
      },
      rating_count: {
        type: Sequelize.INTEGER,
        defaultValue: 320
      },
      status: {
        type: Sequelize.ENUM('pending', 'active', 'blocked'),
        defaultValue: 'active'
      },
      is_online: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      verified_docs: {
        type: Sequelize.JSON,
        defaultValue: ['CCCD/CMND', 'Giấy phép lái xe', 'Đăng kiểm xe', 'Bảo hiểm xe']
      },
      note: {
        type: Sequelize.TEXT,
        defaultValue: 'Tài xế chuyên nghiệp, thân thiện, đúng giờ'
      },
      payment_status: {
        type: Sequelize.ENUM('unpaid', 'paid'),
        defaultValue: 'paid'
      },
      payment_amount: {
        type: Sequelize.INTEGER,
        defaultValue: 300000
      },
      payment_receipt: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('drivers');
  }
};
