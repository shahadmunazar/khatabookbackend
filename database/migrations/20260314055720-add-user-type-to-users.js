'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'user_type', {
      type: Sequelize.ENUM('individual', 'company'),
      allowNull: false,
      defaultValue: 'individual',
      after: 'password'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'user_type');
    // Note: Removing ENUM types in MySQL can be tricky if shared, 
    // but column removal is generally enough for this case.
  }
};
