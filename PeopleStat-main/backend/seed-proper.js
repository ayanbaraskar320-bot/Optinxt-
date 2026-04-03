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
import JobDescription from './models/jobDescriptions.js';
import Settings from './models/Settings.js';
import { runAnalysisPipeline } from './services/analysisPipeline.js';

const BANDS = ['OR', 'D3', 'D2', 'D1', 'M4', 'M3', 'M2', 'M1', 'L3', 'L2', 'L1'];
const PROCESS_AREAS = ['F&A', 'PSS', 'SAP'];

const seedProper = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI not in .env');

        await mongoose.connect(uri);
        console.log('Connected to MongoDB for proper seeding...');

        // 1. Clear All Collections
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
            JobDescription.deleteMany({}),
            Settings.deleteMany({}),
        ]);
        console.log('Cleared all collections.');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('pass1234', salt);

        // 2. Create Managers (2 managers)
        const managers = [];
        for (let i = 1; i <= 2; i++) {
            const manager = await User.create({
                name: `Manager User ${i}`,
                username: `manager${i}`,
                email: `manager${i}@optinxt.com`,
                password: hashedPassword,
                role: 'manager',
            });
            managers.push(manager);
        }
        console.log('Created 2 Managers.');

        // 3. Create FTE Workloads (Static Domain Data)
        const fteData = [
            { process: 'F&A', sub: 'Invoice Posting', fte: 10.5, volume: 2500, repetitive: true, ruleBased: true, automationPot: 75 },
            { process: 'PSS', sub: 'Helpdesk', fte: 8.0, volume: 2000, repetitive: true, ruleBased: false, automationPot: 50 },
            { process: 'SAP', sub: 'SAP Support', fte: 9.5, volume: 1500, repetitive: true, ruleBased: false, automationPot: 40 },
        ];
        for (const fte of fteData) {
            await FTEWorkload.create({
                process_name: fte.process,
                sub_process: fte.sub,
                band: 'D2',
                required_fte: fte.fte,
                actual_fte: Math.round(fte.fte * 1.1),
                workload_volume: fte.volume,
                is_repetitive: fte.repetitive,
                is_rule_based: fte.ruleBased,
                automation_potential: fte.automationPot,
                estimated_cost_per_fte: 500000,
            });
        }
        console.log('Created FTE Workloads.');

        // 4. Create 10 Employees (+ Users and related data)
        const cycle = '2024-Q1';
        for (let i = 0; i < 10; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const name = `${firstName} ${lastName}`;
            const email = faker.internet.email({ firstName, lastName }).toLowerCase();
            const username = faker.internet.username({ firstName, lastName }).toLowerCase();
            const empId = `EMP-OPTINXT-${1000 + i}`;

            const processArea = faker.helpers.arrayArea ? faker.helpers.arrayElement(PROCESS_AREAS) : faker.helpers.arrayElement(PROCESS_AREAS);
            const band = faker.helpers.arrayElement(BANDS);
            const subProcess = fteData.find(f => f.process === processArea)?.sub || 'General';

            // Create User Account
            const user = await User.create({
                name,
                username,
                email,
                password: hashedPassword,
                role: 'employee',
            });

            // Create Employee Profile
            const employee = await Employee.create({
                userid: empId,
                name,
                email,
                department: processArea + ' Area',
                position: faker.person.jobTitle(),
                band,
                process_area: processArea,
                sub_process: subProcess,
                salary: faker.number.int({ min: 600000, max: 2500000 }),
                currentCTC: faker.number.int({ min: 600000, max: 2500000 }),
                experience_years: faker.number.int({ min: 2, max: 20 }),
                location: faker.location.city() + ', India',
                grade: band,
                designation: faker.person.jobTitle(),
                employmentType: 'Full-Time',
                joiningDate: faker.date.past({ years: 6 }),
                managerId: faker.helpers.arrayElement(managers)._id,
                skills: [faker.person.jobType(), 'Project Management', 'Financial Analysis', 'Communication', 'Teamwork'].slice(0, 4),
            });

            // 5. Create Related Data for Algorithms
            
            // Working Hours (Fatigue trigger: High overtime, weekend work)
            const standardHours = 160;
            const overtimeHours = faker.number.float({ min: 10, max: 80, fractionDigits: 1 }); // Trigger fatigue
            await WorkingHours.create({
                employeeId: employee._id,
                reportingPeriod: cycle,
                generalHours: {
                    standardHours,
                    overtimeHours,
                    weekendWork: faker.helpers.arrayElement(['Yes', 'No']),
                    multipleRoles: faker.helpers.arrayElement(['Yes', 'No']),
                    deadlinePressure: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Critical'])
                },
                processHours: {
                    core: 120,
                    meetings: 20,
                    other: overtimeHours
                },
                totalProcessHours: 140 + overtimeHours
            });

            // Performance Records (Trend for fatigue engine)
            for (let j = 0; j < 5; j++) {
                await PerformanceRecord.create({
                    employee_id: employee._id,
                    tasks_completed: faker.number.int({ min: 15, max: 35 }),
                    expected_tasks: 30,
                    working_hours: faker.number.float({ min: 8, max: 12, fractionDigits: 1 }),
                    overtime_hours: faker.number.float({ min: 0, max: 4, fractionDigits: 1 }),
                    error_rate: faker.number.float({ min: 0.001, max: 0.08, fractionDigits: 3 }),
                    department_process: processArea,
                    record_date: new Date(Date.now() - (j * 7 * 24 * 60 * 60 * 1000)), // weekly
                });
            }

            // Assessment Results (Aptitude and Soft Skills)
            const softSkillCategories = ['Communication', 'Problem Solving', 'Teamwork', 'Adaptability', 'Time Management', 'Leadership'];
            const softskillScoresFull = softSkillCategories.map(cat => ({
                categoryName: cat,
                score: faker.number.int({ min: 4, max: 10 }), // 0-10 base
                subcategories: [
                    { subCategoryName: 'Skill A', score: faker.number.int({ min: 4, max: 10 }) },
                    { subCategoryName: 'Skill B', score: faker.number.int({ min: 4, max: 10 }) }
                ]
            }));

            await AssessmentResult.create({
                employeeId: employee._id,
                aptitudeScores: {
                    spiritScore: faker.number.int({ min: 50, max: 100 }),
                    purposeScore: faker.number.int({ min: 50, max: 100 }),
                    rewardsScore: faker.number.int({ min: 50, max: 100 }),
                    professionScore: faker.number.int({ min: 50, max: 100 })
                },
                softskillScoresFull: softskillScoresFull.map(cat => ({
                    category: cat.categoryName,
                    categoryMean: cat.score * 10,
                    subCategory: 'General',
                    score: cat.score * 10,
                    median: 60,
                    tag: 'Standard'
                }))
            });

            // Sprint History
            await SprintHistory.create({
                employeeId: employee._id,
                cycle: cycle,
                completedSprintCount: faker.number.int({ min: 6, max: 12 }),
                maxExpectedSprints: 12,
            });

            // Career Profile
            await CareerProfile.create({
                employeeId: employee._id,
                verifiedSkills: employee.skills,
                targetRole: {
                    title: 'Senior ' + employee.position,
                    requiredSkills: [...employee.skills, 'Strategy', 'Big Data']
                }
            });

            // Fitment Responses
            await FitmentResponse.create({
                employeeId: employee._id,
                evaluationCycle: cycle,
                responses: {
                    pmsRating: faker.number.int({ min: 10, max: 20 }),
                    complexityOfWork: faker.number.int({ min: 10, max: 20 }),
                    innovationTechSavvy: faker.number.int({ min: 10, max: 20 }),
                    customerOrientation: faker.number.int({ min: 10, max: 20 }),
                    teamCollaboration: faker.number.int({ min: 10, max: 20 }),
                    leadershipCompetence: faker.number.int({ min: 10, max: 20 }),
                    locationPreference: 20,
                    totalExperience: 20,
                    ctcEfficiency: 20,
                    multiplexer: 20,
                    selfMotivation: 20,
                    changeReadiness: 20
                }
            });

            // 6. RUN ANALYSIS PIPELINE TO CALCULATE SCORES
            const pipelineResult = await runAnalysisPipeline(employee._id, cycle);

            // 7. Create AnalysisResult (used for Dashboard metrics)
            const recType = pipelineResult.fatigue.fatigueRisk > 70 ? 'burnout_risk' : 
                          pipelineResult.fitment.fitmentScore > 85 ? 'high_performer' : 
                          pipelineResult.fitment.fitmentScore < 40 ? 'role_misalignment' : 'stable';

            await AnalysisResult.create({
                employee_id: employee._id,
                productivity_score: employee.productivity || 0,
                utilization_score: Math.round(50 + Math.random() * 40),
                fitment_score: pipelineResult.fitment.fitmentScore,
                fatigue_score: pipelineResult.fatigue.fatigueRisk,
                recommendation: `Based on analysis, this employee is ${recType.replace('_', ' ')}.`,
                recommendation_type: recType,
                matrix_x: faker.number.int({ min: 1, max: 6 }),
                matrix_y: faker.number.int({ min: 1, max: 6 }),
                talent_category: 'Core Contributor',
                details: {
                    overtime_index: pipelineResult.fatigue.overtimeRatio * 100,
                    workload_intensity: Math.round(40 + Math.random() * 50),
                    performance_decline: faker.number.int({ min: 0, max: 20 }),
                    skill_match_score: pipelineResult.fitment.fitmentScore,
                    experience_score: employee.experience_years * 5,
                }
            });
        }

        // 8. Create JobDescriptions
        const jdData = [
            { title: 'Senior Finance Analyst', department: 'F&A', skills: ['SAP', 'Excel', 'Audit'] },
            { title: 'Support Specialist', department: 'PSS', skills: ['Customer Service', 'Troubleshooting'] },
            { title: 'SAP Functional Consultant', department: 'SAP', skills: ['SAP S/4HANA', 'ABAP'] }
        ];
        for (const jd of jdData) {
            await JobDescription.create({
                jdId: `JD-${faker.string.alphanumeric(5).toUpperCase()}`,
                title: jd.title,
                department: jd.department,
                location: 'Remote',
                requiredSkills: jd.skills,
                experienceRequired: 5,
                responsibilities: ['Responsibility A', 'Responsibility B'],
                createdBy: managers[0]._id
            });
        }
        console.log('Created JobDescriptions.');

        // 9. Create Settings
        const settingsData = [
            { key: 'analysis_cycle', value: '2024-Q1', category: 'analysis', description: 'Active analysis reporting period' },
            { key: 'overtime_threshold', value: 40, category: 'fatigue', description: 'Hours per month to flag fatigue risk' }
        ];
        for (const set of settingsData) {
            await Settings.create(set);
        }
        console.log('Created Settings Data.');

        console.log('Seeding and analysis complete for 10 employees.');
        
        // Output counts
        const userCount = await User.countDocuments();
        const empCount = await Employee.countDocuments();
        const workingHoursCount = await WorkingHours.countDocuments();
        const perfCount = await PerformanceRecord.countDocuments();
        const analysisResultsCount = await AnalysisResult.countDocuments();
        const fteCount = await FTEWorkload.countDocuments();
        const jdCount = await JobDescription.countDocuments();
        const setCount = await Settings.countDocuments();

        console.log('\n--- COLLECTION SUMMARY ---');
        console.log(`Users: ${userCount}`);
        console.log(`Employees: ${empCount}`);
        console.log(`WorkingHours: ${workingHoursCount}`);
        console.log(`PerformanceRecords: ${perfCount}`);
        console.log(`AnalysisResults: ${analysisResultsCount}`);
        console.log(`FTEWorkloads: ${fteCount}`);
        console.log(`JobDescriptions: ${jdCount}`);
        console.log(`Settings: ${setCount}`);
        console.log('--------------------------\n');

        await mongoose.connection.close();
        process.exit(0);

    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedProper();
