/**
 * Domain Seed Script — AI Workforce Optimization Platform
 * Seeds employees from the real-world JSON dataset (Quintes Global)
 * Maps real talent profiles, soft skills, and career data into 147+ employees
 */
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

import { runAnalysisPipeline } from './services/analysisPipeline.js';
import { ROLE_SKILL_MAP, BAND_EXPERIENCE } from './services/fitmentEngine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_FILE_PATH = join(__dirname, '..', 'mayamayaConsole.peopleData_QG (1).json');

// ─── DOMAIN CONFIGURATION ─────────────────────────────────────
const BANDS = ['OR', 'D3', 'D2', 'D1', 'M4', 'M3', 'M2', 'M1', 'L3', 'L2', 'L1'];
const PROCESS_AREAS = ['F&A', 'PSS', 'SAP'];

const ROLE_PROCESS_MAP = {
  // F&A Mapping
  'Accounts Payable': 'F&A',
  'Payment': 'F&A',
  'Invoice': 'F&A',
  'General Ledger': 'F&A',
  'Taxation': 'F&A',
  'Finance': 'F&A',
  'Audit': 'F&A',
  // PSS Mapping
  'Billdesk': 'PSS',
  'DMS': 'PSS',
  'Helpdesk': 'PSS',
  'Data Management': 'PSS',
  'Support': 'PSS',
  // SAP Mapping
  'SAP': 'SAP',
  'ABAP': 'SAP',
  'Basis': 'SAP',
  'Infrastructure': 'SAP',
  'Developer': 'SAP',
};

// FTE workload data (from PPT domain context)
const FTE_DATA = [
  { process: 'F&A', sub: 'Invoice Posting', fte: 10.5, volume: 2500, repetitive: true, ruleBased: true, automationPot: 75 },
  { process: 'F&A', sub: 'Payment Processing', fte: 8.0, volume: 1800, repetitive: true, ruleBased: true, automationPot: 70 },
  { process: 'F&A', sub: 'Customer Invoicing', fte: 8.5, volume: 1500, repetitive: true, ruleBased: false, automationPot: 45 },
  { process: 'F&A', sub: 'Record to Report', fte: 7.0, volume: 800, repetitive: false, ruleBased: true, automationPot: 40 },
  { process: 'F&A', sub: 'Taxation', fte: 5.5, volume: 600, repetitive: false, ruleBased: true, automationPot: 35 },
  { process: 'F&A', sub: 'Treasury', fte: 4.5, volume: 400, repetitive: false, ruleBased: false, automationPot: 20 },
  { process: 'PSS', sub: 'DMS/Billdesk', fte: 10.0, volume: 3000, repetitive: true, ruleBased: true, automationPot: 80 },
  { process: 'PSS', sub: 'Helpdesk', fte: 8.0, volume: 2000, repetitive: true, ruleBased: false, automationPot: 50 },
  { process: 'PSS', sub: 'Master Data Management', fte: 6.0, volume: 1200, repetitive: true, ruleBased: true, automationPot: 65 },
  { process: 'SAP', sub: 'Change Requests', fte: 9.0, volume: 500, repetitive: false, ruleBased: false, automationPot: 20 },
  { process: 'SAP', sub: 'SAP Support', fte: 9.5, volume: 1500, repetitive: true, ruleBased: false, automationPot: 40 },
  { process: 'SAP', sub: 'Vendor Management', fte: 7.5, volume: 800, repetitive: true, ruleBased: true, automationPot: 55 },
  { process: 'SAP', sub: 'Infrastructure', fte: 9.0, volume: 700, repetitive: false, ruleBased: false, automationPot: 25 },
  { process: 'SAP', sub: 'New Requirements', fte: 7.0, volume: 300, repetitive: false, ruleBased: false, automationPot: 15 },
];

function determineProcess(roleName) {
  if (!roleName) return faker.helpers.arrayElement(PROCESS_AREAS);
  for (const [key, area] of Object.entries(ROLE_PROCESS_MAP)) {
    if (roleName.toLowerCase().includes(key.toLowerCase())) return area;
  }
  return faker.helpers.arrayElement(PROCESS_AREAS);
}

function determineBand(roleName) {
  if (!roleName) return 'OR';
  const rn = roleName.toLowerCase();
  if (rn.includes('vp') || rn.includes('senior vp')) return 'L1';
  if (rn.includes('avp') || rn.includes('director')) return 'M1';
  if (rn.includes('senior manager')) return 'M3';
  if (rn.includes('manager')) return 'M4';
  if (rn.includes('assistant manager')) return 'D1';
  if (rn.includes('senior executive')) return 'D2';
  if (rn.includes('executive')) return 'D3';
  if (rn.includes('team leader')) return 'D1';
  return 'OR';
}

function generatePerformanceRecord(employeeId, processName, aptitudeScores) {
  // Use aptitude scores as weight for performance
  let performanceBias = 0.8; // default
  if (aptitudeScores) {
    const scores = Object.values(aptitudeScores).map(v => parseFloat(v));
    const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 5;
    performanceBias = Math.min((avg / 10) + 0.3, 1.2); // Map 0-10 score to 0.3-1.3 multiplier
  }

  const expectedTasks = faker.number.int({ min: 15, max: 30 });
  const tasksCompleted = Math.round(expectedTasks * faker.number.float({ min: 0.7 * performanceBias, max: 1.1 * performanceBias }));
  
  const workingHours = faker.number.float({ min: 7.5, max: 11, fractionDigits: 1 });
  const overtimeHours = workingHours > 8 ? parseFloat((workingHours - 8).toFixed(1)) : 0;
  const errorRate = faker.number.float({ min: 0.005, max: 0.1, fractionDigits: 3 });

  return {
    employee_id: employeeId,
    tasks_completed: tasksCompleted,
    expected_tasks: expectedTasks,
    working_hours: workingHours,
    overtime_hours: overtimeHours,
    error_rate: errorRate,
    department_process: processName,
    record_date: faker.date.recent({ days: 60 }),
  };
}

const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-workforce';
      try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('MongoDB Connected for Real Data Seeding...');
      } catch (err) {
        console.warn('Real MongoDB connection failed, falling back to In-Memory...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        await mongoose.connect(memUri);
        console.log('In-Memory MongoDB Connected for Seeding!');
      }
    }

    // Clear all collections
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      PerformanceRecord.deleteMany({}),
      FTEWorkload.deleteMany({}),
      AnalysisResult.deleteMany({}),
      FitmentResponse.deleteMany({}),
      WorkingHours.deleteMany({}),
      AssessmentResult.deleteMany({}),
      SprintHistory.deleteMany({}),
      CareerProfile.deleteMany({}),
      GapAnalysisSnapshot.deleteMany({}),
    ]);
    console.log('✓ Cleared existing data.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('pass1234', salt);

    // 1. Create Manager Account
    await User.create({
      name: 'Workforce Manager',
      username: 'manager_demo',
      email: 'manager@peoplestat.com',
      password: hashedPassword,
      role: 'manager',
    });
    console.log('✓ Manager account created: manager@peoplestat.com / pass1234');

    // 1.1 Create Demo Employee Account
    const demoEmpUser = await User.create({
      name: 'Demo Employee',
      username: 'employee_demo',
      email: 'employee@peoplestat.com',
      password: hashedPassword,
      role: 'employee',
    });

    const demoEmployee = await Employee.create({
      userid: 'EMP-DEMO-001',
      name: 'Demo Employee',
      email: 'employee@peoplestat.com',
      department: 'Strategy & Operations',
      position: 'Senior Analyst',
      band: 'M4',
      process_area: 'F&A',
      sub_process: 'Invoice Posting',
      salary: 850000,
      currentCTC: 850000,
      experience_years: 5,
      location: 'Bangalore, India',
      grade: 'M4',
      designation: 'Senior Analyst',
      employmentType: 'Full-Time',
      benchmarkCTC: 900000,
      primaryProcess: 'F&A',
      secondaryProcess: 'PSS',
      productivity: 88,
      utilization: 75,
      fitmentScore: 92,
      creativity: 75,
      communication: 85,
      problemSolving: 90,
      teamwork: 88,
      adaptability: 82,
      skills: ['Excel', 'SAP', 'Financial Analysis', 'Process Optimization'],
      joiningDate: new Date(2021, 0, 15),
    });

    const cycle = '2024-Q1';

    // Helper to seed all related records for an employee
    const seedEmployeeRelatedData = async (employee, record = {}) => {
      // Generate performance records
      const perfRecords = [];
      for (let i = 0; i < 3; i++) {
        perfRecords.push(generatePerformanceRecord(employee._id, employee.process_area, record.aptitudeScores));
      }
      await PerformanceRecord.insertMany(perfRecords);

      // Assessment Result
      const softskillScoresFull = (record.softskillScoresFull || []).flatMap(cat => {
        const subScores = (cat.subcategories || []).map(sub => sub.score * 10).filter(s => !isNaN(s));
        const catMean = subScores.length > 0 
          ? (subScores.reduce((a, b) => a + b, 0) / subScores.length) 
          : (typeof cat.score === 'number' ? cat.score * 10 : 50);
        
        return (cat.subcategories || []).map(sub => ({
          category: cat.categoryName,
          categoryMean: catMean,
          categoryWeight: 0.1, // default
          subCategory: sub.subCategoryName,
          score: (typeof sub.score === 'number' && !isNaN(sub.score)) ? sub.score * 10 : Math.round(40 + Math.random() * 50),
          median: (typeof sub.median === 'number' && !isNaN(sub.median)) ? sub.median * 10 : 50,
          tag: sub.tag || 'Standard'
        }));
      });

      const safeAptitude = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? Math.round(50 + Math.random() * 40) : num * 10;
      };

      await AssessmentResult.create({
        employeeId: employee._id,
        aptitudeScores: {
          spiritScore: safeAptitude(record.aptitudeScores?.spiritScore),
          purposeScore: safeAptitude(record.aptitudeScores?.purposeScore),
          rewardsScore: safeAptitude(record.aptitudeScores?.rewardsScore),
          professionScore: safeAptitude(record.aptitudeScores?.professionScore)
        },
        softskillScoresFull: softskillScoresFull
      });

      // Sprint History
      await SprintHistory.create({
        employeeId: employee._id,
        cycle: cycle,
        completedSprintCount: Math.floor(Math.random() * 12),
        maxExpectedSprints: 12,
        computed: {
          workloadScore: Math.round(Math.random() * 100)
        }
      });

      // Working Hours
      await WorkingHours.create({
        employeeId: employee._id,
        reportingPeriod: cycle,
        generalHours: {
          standardHours: 160,
          overtimeHours: Math.floor(Math.random() * 40),
          weekendWork: Math.random() > 0.8 ? 'Yes' : 'No',
          multipleRoles: Math.random() > 0.9 ? 'Yes' : 'No',
          deadlinePressure: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Critical'])
        },
        processHours: {
          invoicing: Math.random() * 20,
          collections: Math.random() * 20,
          meetings: 10
        }
      });

      // Career Profile
      await CareerProfile.create({
        employeeId: employee._id,
        verifiedSkills: employee.skills.slice(0, 4),
        targetRole: {
          title: 'Senior ' + (employee.position || 'Specialist'),
          requiredSkills: employee.skills.slice(0, 8)
        },
        computed: {
          skillGaps: employee.skills.slice(4, 8)
        }
      });

      // Fitment Response
      await FitmentResponse.create({
        employeeId: employee._id,
        evaluationCycle: cycle,
        responses: {
          pmsRating: 15,
          complexityOfWork: 15,
          innovationTechSavvy: 15,
          customerOrientation: 15,
          teamCollaboration: 15,
          communication: 15,
          leadershipCompetence: 15,
          locationPreference: 20,
          totalExperience: 20,
          ctcEfficiency: 20,
          multiplexer: 20,
          selfMotivation: 20,
          changeReadiness: 20
        }
      });

      // Run Pipeline
      try {
        await runAnalysisPipeline(employee._id, cycle);
      } catch (pipelineErr) {
        console.warn(`Pipeline failed for ${employee.name}:`, pipelineErr.message);
      }
    };

    // Seed data for demo employee
    await seedEmployeeRelatedData(demoEmployee);
    console.log('✓ Demo employee account created: employee@peoplestat.com / pass1234');

    // 2. Load JSON Data
    const rawData = JSON.parse(readFileSync(JSON_FILE_PATH, 'utf8'));
    console.log(`✓ Loaded ${rawData.length} records from JSON.`);

    // 3. Seed FTE Workload Data (Static Domain Context)
    for (const fte of FTE_DATA) {
      await FTEWorkload.create({
        process_name: fte.process,
        sub_process: fte.sub,
        band: 'D2', // Default band for workload metric
        required_fte: fte.fte,
        actual_fte: Math.round(fte.fte * 1.1),
        workload_volume: fte.volume,
        is_repetitive: fte.repetitive,
        is_rule_based: fte.ruleBased,
        automation_potential: fte.automationPot,
        estimated_cost_per_fte: 500000,
      });
    }

    // 4. Seed Employees from JSON
    console.log('Mapping JSON records to Employees...');
    for (const record of rawData) {
      const fullName = faker.person.fullName();
      const email = `${fullName.replace(/\s+/g, '').toLowerCase()}@employee.com`;
      const username = email.split('@')[0];
      
      // Create User
      const user = await User.create({
        name: fullName,
        username,
        email,
        password: hashedPassword,
        role: 'employee',
      });

      // Map career profile
      const roleName = record.careerProfile?.roles?.[0] || 'Executive';
      const processArea = determineProcess(roleName);
      const band = determineBand(roleName);
      
      // Map sub-process (pick one from FTE data that matches processArea)
      const possibleSubs = FTE_DATA.filter(f => f.process === processArea).map(f => f.sub);
      const subProcess = faker.helpers.arrayElement(possibleSubs) || (processArea === 'F&A' ? 'Invoice Posting' : 'Helpdesk');

      // Map skills from softskill categories
      const skills = [];
      if (record.softskillScoresFull) {
        record.softskillScoresFull.forEach(cat => {
          skills.push(cat.categoryName);
          cat.subcategories?.slice(0, 2).forEach(sub => skills.push(sub.subCategoryName));
        });
      }
      if (record.careerProfile?.skills) {
        skills.push(...record.careerProfile.skills.slice(0, 5));
      }

      const allSkills = [...new Set(skills)]; // Consolidate skills

      const employee = await Employee.create({
        userid: record.userId,
        name: fullName,
        email: email,
        department: record.careerProfile?.industries?.[0] || processArea,
        position: record.careerProfile?.roles?.[0] || (band.includes('M') ? 'Manager' : band.includes('L') ? 'Director' : 'Specialist'),
        band: band,
        process_area: processArea,
        sub_process: subProcess,
        salary: Math.round((400000 + Math.random() * 1200000) / 1000) * 1000, 
        currentCTC: Math.round((400000 + Math.random() * 1200000) / 1000) * 1000, // will be overwritten by same logic to be safe
        experience_years: BAND_EXPERIENCE[band] + Math.floor(Math.random() * 3),
        location: 'Bangalore, India',
        grade: band,
        designation: record.careerProfile?.roles?.[0] || 'Specialist',
        employmentType: 'Full-Time',
        primaryProcess: processArea,
        secondaryProcess: subProcess,
        // Set initial scores based on aptitude but with random variance to ensure non-zero dashboard
        productivity: Math.round(70 + Math.random() * 25),
        utilization: Math.round(65 + Math.random() * 30),
        fitmentScore: Math.round(60 + Math.random() * 35),
        fatigueScore: Math.round(15 + Math.random() * 60),
        communication: Math.round(50 + Math.random() * 45),
        problemSolving: Math.round(50 + Math.random() * 45),
        teamwork: Math.round(50 + Math.random() * 45),
        adaptability: Math.round(50 + Math.random() * 45),
        creativity: Math.round(50 + Math.random() * 45),
        skills: allSkills.slice(0, 8),
        currentRole: subProcess,
        performance: Math.random() > 0.8 ? 'High' : Math.random() > 0.4 ? 'Average' : 'Low',
        joiningDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1),
      });

      // Seed related data for this employee
      await seedEmployeeRelatedData(employee, record);
    }

    // 5. Finalize
    const employeesCount = await Employee.countDocuments();
    const recordsCount = await PerformanceRecord.countDocuments();
    const fteCount = await FTEWorkload.countDocuments();

    console.log('\n=========================================');
    console.log('SEEDING COMPLETE');
    console.log(`- Created ${employeesCount} employees with initial scores`);
    console.log(`- Created ${recordsCount} performance records`);
    console.log(`- Created ${fteCount} process workloads`);
    console.log('=========================================\n');
    console.log('Initial analysis complete. Scores have been pre-populated.');
    console.log('Use "Run Intelligence Analysis" in the UI for re-calculation.');
    console.log('=========================================\n');
    console.log('Demo Credentials:');
    console.log('Manager: manager@example.com / pass1234');
    console.log('Employee Password: pass1234 (all accounts)');
    console.log('Example Employee: ' + (await User.findOne({ role: 'employee' })).email);
    console.log('=========================================\n');

    return;

  } catch (err) {
    console.error('Seeding Error:', err);
    throw err;
  }
};

if (import.meta.url.startsWith('file:') && (process.argv[1]?.endsWith('seed.js') || process.argv[1]?.endsWith('seed'))) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}

export default seedDatabase;
