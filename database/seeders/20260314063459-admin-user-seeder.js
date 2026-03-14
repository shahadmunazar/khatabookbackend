const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insert admin user
    await queryInterface.bulkInsert('users', [{
      id: 1, // Explicitly set ID for seeding link
      name: 'Admin User',
      email: 'admin@khatabook.com',
      phone: '9999999999',
      password: hashedPassword,
      user_type: 'admin',
      is_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    }], {});

    // Find admin role
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id from roles WHERE name = 'admin' LIMIT 1;`
    );

    if (roles && roles.length > 0) {
      await queryInterface.bulkInsert('user_roles', [{
        user_id: 1,
        role_id: roles[0].id,
        created_at: new Date()
      }]);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_roles', { user_id: 1 }, {});
    await queryInterface.bulkDelete('users', { email: 'admin@khatabook.com' }, {});
  }
};
