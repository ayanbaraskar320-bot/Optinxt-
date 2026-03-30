import mongoose from 'mongoose';
import 'dotenv/config';
import User from './models/User.js';

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ai-workforce");
    const count = await User.countDocuments();
    console.log('User count:', count);
    const users = await User.find().limit(5);
    console.log('Sample users:', users.map(u => u.email));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
checkUsers();
