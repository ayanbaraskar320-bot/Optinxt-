import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-workforce');
    const users = await User.find().select('username email role');
    console.log('Users:', users);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
