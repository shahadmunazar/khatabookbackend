'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'user_type', {
      type: Sequelize.ENUM('individual', 'company', 'admin'),
      allowNull: false,
      defaultValue: 'individual'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'user_type', {
      type: Sequelize.ENUM('individual', 'company'),
      allowNull: false,
      defaultValue: 'individual'
    });
  }
};
