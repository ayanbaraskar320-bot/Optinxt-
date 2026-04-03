import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

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

const BANDS = ['OR', 'D3', 'D2', 'D1', 'M4', 'M3', 'M2', 'M1', 'L3', 'L2', 'L1'];
const PROCESS_AREAS = ['F&A', 'PSS', 'SAP'];

const seed10 = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI is not defined in .env');

        await mongoose.connect(uri);
        console.log('Connected to MongoDB...');

        // Clear existing data
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
        console.log('Cleared existing data.');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('pass1234', salt);

        // Create 1 Manager
        await User.create({
            name: 'OptiNxt Manager',
            username: 'manager_optinxt',
            email: 'manager@optinxt.com',
            password: hashedPassword,
            role: 'manager',
        });
        console.log('Manager created: manager@optinxt.com / pass1234');

        // Create 9 Employees (+ Users)
        for (let i = 0; i < 9; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const name = `${firstName} ${lastName}`;
            const email = faker.internet.email({ firstName, lastName }).toLowerCase();
            const username = faker.internet.username({ firstName, lastName }).toLowerCase();
            const empId = `EMP-${faker.string.alphanumeric(6).toUpperCase()}`;

            const processArea = faker.helpers.arrayElement(PROCESS_AREAS);
            const band = faker.helpers.arrayElement(BANDS);

            await User.create({
                name,
                username,
                email,
                password: hashedPassword,
                role: 'employee',
            });

            const employee = await Employee.create({
                userid: empId,
                name,
                email,
                department: processArea + ' Department',
                position: faker.person.jobTitle(),
                band,
                process_area: processArea,
                sub_process: 'General Support',
                salary: faker.number.int({ min: 500000, max: 2000000 }),
                currentCTC: faker.number.int({ min: 500000, max: 2000000 }),
                experience_years: faker.number.int({ min: 1, max: 15 }),
                location: faker.location.city() + ', India',
                grade: band,
                designation: faker.person.jobTitle(),
                employmentType: 'Full-Time',
                productivity: faker.number.int({ min: 60, max: 100 }),
                utilization: faker.number.int({ min: 50, max: 100 }),
                fitmentScore: faker.number.int({ min: 40, max: 95 }),
                skills: [faker.person.jobType(), faker.person.jobType(), 'Communication', 'Teamwork'],
                joiningDate: faker.date.past({ years: 5 }),
            });

            // Add some performance records
            await PerformanceRecord.create({
                employee_id: employee._id,
                tasks_completed: faker.number.int({ min: 10, max: 30 }),
                expected_tasks: 25,
                working_hours: faker.number.float({ min: 7, max: 10, fractionDigits: 1 }),
                overtime_hours: faker.number.float({ min: 0, max: 3, fractionDigits: 1 }),
                error_rate: faker.number.float({ min: 0, max: 0.05, fractionDigits: 3 }),
                department_process: processArea,
                record_date: new Date(),
            });

            // Add career profile
            await CareerProfile.create({
                employeeId: employee._id,
                verifiedSkills: employee.skills,
                targetRole: { title: 'Senior ' + employee.position, requiredSkills: employee.skills },
                computed: { skillGaps: [] }
            });
        }

        console.log('Seeded 10 entries (1 manager + 9 employees).');
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed10();
