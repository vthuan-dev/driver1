'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('drivers');

    if (!tableDesc.password) {
      await queryInterface.addColumn('drivers', 'password', {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: '123456'
      });
    }

    if (!tableDesc.role) {
      await queryInterface.addColumn('drivers', 'role', {
        type: Sequelize.ENUM('user', 'driver', 'admin'),
        allowNull: false,
        defaultValue: 'driver'
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('drivers', 'password');
    await queryInterface.removeColumn('drivers', 'role');
  }
};
