import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

// Import All Models for Clearing
import User from './models/User.js';
import Employee from './models/Employee.js';
import PerformanceRecord from './models/PerformanceRecord.js';
import FTEWorkload from './models/FTEWorkload.js';
import AnalysisResult from './models/AnalysisResult.js';
import FitmentResponse from './models/FitmentResponse.js';
import WorkingHours from './models/WorkingHours.js';
import AssessmentResult from './models/AssessmentResult.js';
import SprintHistory from './models/SprintHistory.js';
import CareerProfile from './models/CareerProfile.js';
import GapAnalysisSnapshot from './models/GapAnalysisSnapshot.js';

const clearDatabase = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-workforce';
    console.log(`Connecting to: ${uri}`);
    await mongoose.connect(uri);

    const collections = [
      User,
      Employee,
      PerformanceRecord,
      FTEWorkload,
      AnalysisResult,
      FitmentResponse,
      WorkingHours,
      AssessmentResult,
      SprintHistory,
      CareerProfile,
      GapAnalysisSnapshot,
    ];

    console.log('Clearing all workforce data collections...');
    
    await Promise.all(collections.map(model => model.deleteMany({})));

    console.log('=========================================');
    console.log('DATABASE CLEARED SUCCESSFULLY');
    console.log('All 170+ employee records and associated data removed.');
    console.log('You can now add your own algorithm and seed new data.');
    console.log('=========================================');

    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
};

clearDatabase();
