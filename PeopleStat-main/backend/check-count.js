import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Employee from './models/Employee.js';

const checkCount = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const userCount = await User.countDocuments();
    const employeeCount = await Employee.countDocuments();
    console.log(`Users: ${userCount}, Employees: ${employeeCount}`);
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkCount();
