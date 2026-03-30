import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

const quickSeed = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('pass1234', salt);
    
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ai-workforce");
    await User.deleteMany({ email: 'admin@peoplestat.com' });
    await User.create({
      name: 'Admin User',
      username: 'admin',
      email: 'admin@peoplestat.com',
      password: hashedPassword,
      role: 'manager'
    });
    console.log('Quick seed complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
quickSeed();
