'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trips', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING(50)
      },
      badge: {
        type: Sequelize.STRING(50),
        defaultValue: 'Mới'
      },
      pickup_location: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      dropoff_location: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      distance_km: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      estimated_minutes: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      price: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      service_tags: {
        type: Sequelize.JSON,
        defaultValue: ['Lái xe hộ']
      },
      status: {
        type: Sequelize.ENUM('new', 'accepted', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'new'
      },
      is_virtual: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      driver_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'drivers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      time_posted: {
        type: Sequelize.STRING(100),
        defaultValue: 'Vừa xong'
      },
      customer_name: {
        type: Sequelize.STRING(100),
        defaultValue: 'Khách hàng'
      },
      customer_phone: {
        type: Sequelize.STRING(20),
        defaultValue: '0912345678'
      },
      notes: {
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
    await queryInterface.dropTable('trips');
  }
};
