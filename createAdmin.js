
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required in .env');
    }

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      existingAdmin.role = 'admin';
      await existingAdmin.save();

      console.log('Existing account promoted to admin.');
    } else {
      const hashedPassword = await bcrypt.hash(password, 12);

      await User.create({
        name: 'Admin',
        email,
        password: hashedPassword,
        role: 'admin'
      });

      console.log('Admin account created successfully.');
    }
  } catch (error) {
    console.error('Admin setup failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
