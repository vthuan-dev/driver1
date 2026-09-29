'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('drivers');
    if (!tableInfo.document_details) {
      await queryInterface.addColumn('drivers', 'document_details', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('drivers', 'document_details');
  }
};
