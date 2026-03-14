'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'is_verified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'company_id'
    });
    await queryInterface.addColumn('users', 'otp', {
      type: Sequelize.STRING(10),
      allowNull: true,
      after: 'is_verified'
    });
    await queryInterface.addColumn('users', 'otp_expiry', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'otp'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'is_verified');
    await queryInterface.removeColumn('users', 'otp');
    await queryInterface.removeColumn('users', 'otp_expiry');
  }
};
