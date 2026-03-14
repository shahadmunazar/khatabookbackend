'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'verification_token', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'otp_expiry'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'verification_token');
  }
};
