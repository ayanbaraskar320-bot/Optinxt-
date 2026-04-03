/**
 * COMPREHENSIVE RE-SEED SCRIPT
 * - 20 employees with diverse, realistic scores
 * - Simple passwords (optinxt123)
 * - Full score diversity: fitment, utilization, fatigue, productivity
 * - Ensures all outcomes: high risk, low risk, medium, promotion ready, attrition etc.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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

const BANDS = ['OR', 'D3', 'D2', 'D1', 'M4', 'M3', 'M2', 'M1', 'L3', 'L2', 'L1'];
const PROCESS_AREAS = ['F&A', 'PSS', 'SAP'];

// Pre-defined employee profiles for diverse outcomes
const EMPLOYEE_PROFILES = [
  // HIGH PERFORMERS (promotion ready)
  { name: 'Sarah Mitchell', email: 'sarah.mitchell@optinxt.com', username: 'sarah.mitchell', dept: 'F&A Area', pos: 'Senior Finance Analyst', band: 'M3', proc: 'F&A', sub: 'Invoice Posting', fitment: 92, productivity: 88, utilization: 82, fatigue: 25, recType: 'high_performer', exp: 8, salary: 1800000 },
  { name: 'James Hartley', email: 'james.hartley@optinxt.com', username: 'james.hartley', dept: 'SAP Area', pos: 'SAP Consultant', band: 'M4', proc: 'SAP', sub: 'SAP Support', fitment: 95, productivity: 91, utilization: 78, fatigue: 20, recType: 'promotion_candidate', exp: 10, salary: 2200000 },
  { name: 'Emily Carter', email: 'emily.carter@optinxt.com', username: 'emily.carter', dept: 'PSS Area', pos: 'Operations Lead', band: 'M2', proc: 'PSS', sub: 'Helpdesk', fitment: 89, productivity: 85, utilization: 75, fatigue: 30, recType: 'high_performer', exp: 7, salary: 1600000 },
  
  // ATTRITION RISK (high fatigue, burnout)
  { name: 'Derek Collins', email: 'derek.collins@optinxt.com', username: 'derek.collins', dept: 'F&A Area', pos: 'Finance Executive', band: 'D2', proc: 'F&A', sub: 'Invoice Posting', fitment: 62, productivity: 55, utilization: 95, fatigue: 88, recType: 'burnout_risk', exp: 4, salary: 900000 },
  { name: 'Monica Reyes', email: 'monica.reyes@optinxt.com', username: 'monica.reyes', dept: 'SAP Area', pos: 'SAP Support Engineer', band: 'D1', proc: 'SAP', sub: 'SAP Support', fitment: 58, productivity: 48, utilization: 98, fatigue: 92, recType: 'burnout_risk', exp: 3, salary: 800000 },
  
  // UNDERUTILIZED (low utilization)
  { name: 'Tyler Brooks', email: 'tyler.brooks@optinxt.com', username: 'tyler.brooks', dept: 'PSS Area', pos: 'Data Analyst', band: 'D3', proc: 'PSS', sub: 'Helpdesk', fitment: 75, productivity: 70, utilization: 35, fatigue: 15, recType: 'underutilized', exp: 2, salary: 700000 },
  { name: 'Olivia Grant', email: 'olivia.grant@optinxt.com', username: 'olivia.grant', dept: 'F&A Area', pos: 'Junior Analyst', band: 'OR', proc: 'F&A', sub: 'Invoice Posting', fitment: 68, productivity: 65, utilization: 28, fatigue: 12, recType: 'underutilized', exp: 1, salary: 650000 },
  
  // ROLE MISALIGNMENT (low fitment)
  { name: 'Brandon Walsh', email: 'brandon.walsh@optinxt.com', username: 'brandon.walsh', dept: 'SAP Area', pos: 'SAP Basis Admin', band: 'D2', proc: 'SAP', sub: 'SAP Support', fitment: 32, productivity: 58, utilization: 68, fatigue: 45, recType: 'role_misalignment', exp: 5, salary: 950000 },
  { name: 'Lauren Hayes', email: 'lauren.hayes@optinxt.com', username: 'lauren.hayes', dept: 'PSS Area', pos: 'Process Coordinator', band: 'D3', proc: 'PSS', sub: 'Helpdesk', fitment: 28, productivity: 45, utilization: 52, fatigue: 58, recType: 'role_misalignment', exp: 3, salary: 750000 },
  
  // STABLE PERFORMERS
  { name: 'Nathan Foster', email: 'nathan.foster@optinxt.com', username: 'nathan.foster', dept: 'F&A Area', pos: 'Accounts Manager', band: 'M4', proc: 'F&A', sub: 'Invoice Posting', fitment: 78, productivity: 75, utilization: 68, fatigue: 38, recType: 'stable', exp: 6, salary: 1200000 },
  { name: 'Rachel Simmons', email: 'rachel.simmons@optinxt.com', username: 'rachel.simmons', dept: 'PSS Area', pos: 'Helpdesk Lead', band: 'D1', proc: 'PSS', sub: 'Helpdesk', fitment: 80, productivity: 78, utilization: 72, fatigue: 42, recType: 'stable', exp: 5, salary: 1050000 },
  { name: 'Marcus Webb', email: 'marcus.webb@optinxt.com', username: 'marcus.webb', dept: 'SAP Area', pos: 'ABAP Developer', band: 'D2', proc: 'SAP', sub: 'SAP Support', fitment: 82, productivity: 80, utilization: 65, fatigue: 35, recType: 'stable', exp: 4, salary: 1100000 },
  
  // OVERLOADED
  { name: 'Brittany Stone', email: 'brittany.stone@optinxt.com', username: 'brittany.stone', dept: 'F&A Area', pos: 'Senior Executive', band: 'D2', proc: 'F&A', sub: 'Invoice Posting', fitment: 70, productivity: 72, utilization: 97, fatigue: 75, recType: 'overloaded', exp: 3, salary: 850000 },
  
  // MID-RANGE
  { name: 'Ethan Morrison', email: 'ethan.morrison@optinxt.com', username: 'ethan.morrison', dept: 'PSS Area', pos: 'Support Analyst', band: 'D3', proc: 'PSS', sub: 'Helpdesk', fitment: 55, productivity: 60, utilization: 58, fatigue: 52, recType: 'stable', exp: 2, salary: 720000 },
  { name: 'Jessica Larson', email: 'jessica.larson@optinxt.com', username: 'jessica.larson', dept: 'SAP Area', pos: 'Functional Analyst', band: 'D1', proc: 'SAP', sub: 'SAP Support', fitment: 65, productivity: 68, utilization: 62, fatigue: 40, recType: 'stable', exp: 4, salary: 1000000 },
  { name: 'Ryan Callahan', email: 'ryan.callahan@optinxt.com', username: 'ryan.callahan', dept: 'F&A Area', pos: 'Tax Analyst', band: 'D2', proc: 'F&A', sub: 'Invoice Posting', fitment: 72, productivity: 66, utilization: 55, fatigue: 45, recType: 'stable', exp: 3, salary: 880000 },
  { name: 'Amanda Pierce', email: 'amanda.pierce@optinxt.com', username: 'amanda.pierce', dept: 'PSS Area', pos: 'DMS Coordinator', band: 'D3', proc: 'PSS', sub: 'Helpdesk', fitment: 60, productivity: 62, utilization: 48, fatigue: 60, recType: 'stable', exp: 2, salary: 730000 },
  { name: 'Kevin Thornton', email: 'kevin.thornton@optinxt.com', username: 'kevin.thornton', dept: 'SAP Area', pos: 'Infrastructure Specialist', band: 'D2', proc: 'SAP', sub: 'SAP Support', fitment: 77, productivity: 73, utilization: 80, fatigue: 55, recType: 'stable', exp: 5, salary: 1080000 },
  { name: 'Stephanie Bell', email: 'stephanie.bell@optinxt.com', username: 'stephanie.bell', dept: 'F&A Area', pos: 'GL Accountant', band: 'D2', proc: 'F&A', sub: 'Invoice Posting', fitment: 85, productivity: 82, utilization: 73, fatigue: 28, recType: 'high_performer', exp: 6, salary: 1150000 },
  { name: 'Daniel Crawford', email: 'daniel.crawford@optinxt.com', username: 'daniel.crawford', dept: 'SAP Area', pos: 'Change Manager', band: 'M4', proc: 'SAP', sub: 'SAP Support', fitment: 76, productivity: 79, utilization: 70, fatigue: 44, recType: 'stable', exp: 7, salary: 1350000 },
];

const seedMega = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI not in .env');

        await mongoose.connect(uri);
        console.log('Connected to MongoDB...');

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

        // Simple password: optinxt123
        const hashedPassword = await bcrypt.hash('optinxt123', 10);

        // 2. Create Managers
        const managers = [];
        for (let i = 1; i <= 2; i++) {
            const mgr = await User.create({
                name: `Manager ${i}`,
                username: `manager${i}`,
                email: `manager${i}@optinxt.com`,
                password: hashedPassword,
                role: 'manager',
            });
            managers.push(mgr);
        }
        console.log('Created 2 Managers. Password: optinxt123');

        // 3. Create FTE Workloads
        const fteData = [
            { process: 'F&A', sub: 'Invoice Posting', fte: 10.5, volume: 2500, repetitive: true, ruleBased: true, automationPot: 75 },
            { process: 'F&A', sub: 'Payment Processing', fte: 8.0, volume: 1800, repetitive: true, ruleBased: true, automationPot: 70 },
            { process: 'PSS', sub: 'Helpdesk', fte: 8.0, volume: 2000, repetitive: true, ruleBased: false, automationPot: 50 },
            { process: 'PSS', sub: 'Data Management', fte: 6.0, volume: 1200, repetitive: true, ruleBased: true, automationPot: 65 },
            { process: 'SAP', sub: 'SAP Support', fte: 9.5, volume: 1500, repetitive: true, ruleBased: false, automationPot: 40 },
            { process: 'SAP', sub: 'Infrastructure', fte: 9.0, volume: 700, repetitive: false, ruleBased: false, automationPot: 25 },
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

        const cycle = '2024-Q1';
        const skillSets = {
            'F&A': ['SAP Fi/Co', 'Excel Advanced', 'Financial Analysis', 'Tax Compliance', 'Audit', 'Account Reconciliation'],
            'PSS': ['Customer Service', 'Helpdesk', 'DMS', 'Data Management', 'Communication', 'Problem Solving'],
            'SAP': ['SAP S/4HANA', 'ABAP Development', 'SAP Basis', 'Infrastructure', 'Change Management', 'Testing'],
        };

        // 4. Create 20 Employees from profiles
        for (let i = 0; i < EMPLOYEE_PROFILES.length; i++) {
            const p = EMPLOYEE_PROFILES[i];
            const empId = `EMP-OPTINXT-${1000 + i}`;

            // Create User
            await User.create({
                name: p.name,
                username: p.username,
                email: p.email,
                password: hashedPassword,
                role: 'employee',
            });

            // Derive skill gap count from fitment
            const skillGapCount = p.fitment >= 85 ? 1 : p.fitment >= 65 ? 2 : p.fitment >= 45 ? 3 : 5;
            const procSkills = skillSets[p.proc] || [];
            const currentSkills = procSkills.slice(0, 6 - skillGapCount);
            const missingSkills = procSkills.slice(6 - skillGapCount);

            // Create Employee with all fields populated
            const employee = await Employee.create({
                userid: empId,
                name: p.name,
                email: p.email,
                department: p.dept,
                position: p.pos,
                band: p.band,
                process_area: p.proc,
                sub_process: p.sub,
                salary: p.salary,
                currentCTC: p.salary,
                benchmarkCTC: Math.round(p.salary * 1.1),
                experience_years: p.exp,
                location: ['New York', 'Austin', 'Chicago', 'Seattle', 'San Francisco'][i % 5] + ', USA',
                grade: p.band,
                designation: p.pos,
                employmentType: 'Full-Time',
                joiningDate: new Date(2022 - Math.floor(p.exp / 3), Math.floor(Math.random() * 12), 1),
                managerId: managers[i % 2]._id,
                skills: currentSkills,
                // Pre-populate all score fields
                productivity: Math.round(p.productivity),
                utilization: Math.round(p.utilization),
                fitmentScore: Math.round(p.fitment),
                fatigueScore: Math.round(p.fatigue),
                automationPotential: Math.round(20 + Math.random() * 55),
                communication: Math.round(50 + (p.fitment - 50) * 0.8 + (Math.random() - 0.5) * 20),
                problemSolving: Math.round(45 + (p.productivity - 50) * 0.7 + (Math.random() - 0.5) * 15),
                teamwork: Math.round(55 + (p.fitment - 55) * 0.6 + (Math.random() - 0.5) * 20),
                adaptability: Math.round(50 + (p.productivity - 50) * 0.5 + (Math.random() - 0.5) * 15),
                creativity: Math.round(40 + (p.fitment - 40) * 0.6 + (Math.random() - 0.5) * 20),
                currentRole: p.sub,
                recommendedRole: p.fitment >= 85 ? 'Senior ' + p.pos : p.fitment <= 40 ? 'Reskilling Required' : undefined,
                performance: p.productivity >= 80 ? 'High' : p.productivity >= 65 ? 'Average' : 'Low',
            });

            // Working Hours (tied to fatigue)
            const standardHours = 160;
            const overtimeHours = Math.round((p.fatigue / 100) * 80); // Higher fatigue = more overtime
            const weekendWork = p.fatigue > 70 ? 'Yes' : 'No';
            const multipleRoles = p.utilization > 90 ? 'Yes' : 'No';
            const deadlinePressure = p.fatigue > 80 ? 'Critical' : p.fatigue > 60 ? 'High' : p.fatigue > 40 ? 'Medium' : 'Low';

            await WorkingHours.create({
                employeeId: employee._id,
                reportingPeriod: cycle,
                generalHours: {
                    standardHours,
                    overtimeHours,
                    weekendWork,
                    multipleRoles,
                    deadlinePressure
                },
                processHours: {
                    core: Math.round(120 + (p.utilization / 100) * 30),
                    meetings: 15,
                    other: overtimeHours
                },
                totalProcessHours: standardHours + overtimeHours
            });

            // Performance Records (5 records per employee)
            for (let j = 0; j < 5; j++) {
                await PerformanceRecord.create({
                    employee_id: employee._id,
                    tasks_completed: Math.round((p.productivity / 100) * 30 + (Math.random() - 0.5) * 5),
                    expected_tasks: 30,
                    working_hours: 8 + (overtimeHours / (30 * 5)),
                    overtime_hours: Math.round(overtimeHours / 30 + Math.random() * 2),
                    error_rate: parseFloat((0.1 - (p.productivity / 100) * 0.09 + Math.random() * 0.02).toFixed(3)),
                    department_process: p.proc,
                    record_date: new Date(Date.now() - (j * 7 * 24 * 60 * 60 * 1000)),
                });
            }

            // Soft skill scores mapped to fitment
            const softSkillCategories = ['Communication', 'Problem Solving', 'Teamwork', 'Adaptability', 'Time Management', 'Leadership'];
            const softskillScoresFull = softSkillCategories.map(cat => {
                const base = Math.round(p.fitment / 10 + (Math.random() - 0.5) * 2);
                const score = Math.max(1, Math.min(10, base));
                return {
                    category: cat,
                    categoryMean: score * 10,
                    subCategory: 'General',
                    score: score * 10,
                    median: 60,
                    tag: p.fitment >= 85 ? 'Star' : p.fitment >= 65 ? 'Standard' : 'Gap'
                };
            });

            await AssessmentResult.create({
                employeeId: employee._id,
                aptitudeScores: {
                    spiritScore: Math.round(p.fitment * 0.9 + Math.random() * 10),
                    purposeScore: Math.round(p.fitment * 0.95 + Math.random() * 10),
                    rewardsScore: Math.round(p.productivity * 0.85 + Math.random() * 15),
                    professionScore: Math.round(p.fitment * 0.9 + Math.random() * 10)
                },
                softskillScoresFull
            });

            // Sprint History (mapped to productivity)
            const completedSprints = Math.round((p.productivity / 100) * 12);
            await SprintHistory.create({
                employeeId: employee._id,
                cycle,
                completedSprintCount: completedSprints,
                maxExpectedSprints: 12,
                computed: {
                    productivityScore: p.productivity,
                    productivityTier: p.productivity >= 80 ? 'High' : p.productivity >= 60 ? 'Medium' : 'Low',
                    workloadScore: p.utilization
                }
            });

            // Career Profile (with real skill gaps)
            await CareerProfile.create({
                employeeId: employee._id,
                verifiedSkills: currentSkills,
                targetRole: {
                    title: 'Senior ' + p.pos,
                    requiredSkills: procSkills
                },
                computed: {
                    skillGaps: missingSkills,
                    careerFitment: p.fitment,
                    promotionReadiness: p.fitment >= 85 && p.productivity >= 80 ? 90 : p.fitment >= 70 ? 60 : 30,
                    competencyRadar: {
                        communication: employee.communication,
                        problemSolving: employee.problemSolving,
                        teamwork: employee.teamwork,
                        adaptability: employee.adaptability,
                    }
                }
            });

            // Fitment Responses
            const responseFactor = p.fitment / 100;
            await FitmentResponse.create({
                employeeId: employee._id,
                evaluationCycle: cycle,
                responses: {
                    pmsRating: Math.round(10 + responseFactor * 10),
                    complexityOfWork: Math.round(10 + responseFactor * 10),
                    innovationTechSavvy: Math.round(8 + responseFactor * 12),
                    customerOrientation: Math.round(10 + responseFactor * 10),
                    teamCollaboration: Math.round(10 + responseFactor * 10),
                    leadershipCompetence: Math.round(8 + responseFactor * 12),
                    locationPreference: 20,
                    totalExperience: Math.min(20, p.exp * 2),
                    ctcEfficiency: Math.round(10 + responseFactor * 10),
                    multiplexer: Math.round(10 + responseFactor * 10),
                    selfMotivation: Math.round(10 + responseFactor * 10),
                    changeReadiness: Math.round(10 + responseFactor * 10)
                }
            });

            // Gap Analysis Snapshot
            const matrixX = Math.max(1, Math.min(6, Math.round(p.productivity / 100 * 6)));
            const matrixY = Math.max(1, Math.min(6, Math.round(p.fitment / 100 * 6)));
            await GapAnalysisSnapshot.create({
                employeeId: employee._id,
                evaluationCycle: cycle,
                talentMatrix: {
                    performanceLevel: matrixX,
                    riskLevel: matrixY
                },
                fitmentScoreAlt: p.fitment,
                overallScore: Math.round((p.fitment + p.productivity) / 2),
            });

            // Create AnalysisResult (key for 6x6 and dashboard)
            await AnalysisResult.create({
                employee_id: employee._id,
                productivity_score: Math.round(p.productivity),
                utilization_score: Math.round(p.utilization),
                fitment_score: Math.round(p.fitment),
                fatigue_score: Math.round(p.fatigue),
                recommendation: `Employee classified as ${p.recType.replace(/_/g, ' ')}.`,
                recommendation_type: p.recType,
                matrix_x: matrixX,
                matrix_y: matrixY,
                talent_category: p.fitment >= 85 ? 'High Potential' : p.fitment <= 40 ? 'At Risk' : 'Core Contributor',
                details: {
                    overtime_index: Math.round(overtimeHours / 80 * 100),
                    workload_intensity: Math.round(p.utilization),
                    performance_decline: p.recType === 'burnout_risk' ? Math.round(20 + Math.random() * 20) : Math.round(Math.random() * 10),
                    skill_match_score: Math.round(p.fitment),
                    experience_score: Math.min(100, p.exp * 5),
                    quality_score: Math.round(p.productivity + (Math.random() - 0.5) * 10)
                }
            });

            console.log(`  ✓ ${p.name} (${p.recType}) - Fit:${p.fitment}% Util:${p.utilization}% Fatigue:${p.fatigue}%`);
        }

        // 5. JobDescriptions
        const jdItems = [
            { title: 'Senior Finance Analyst', dept: 'F&A', skills: ['SAP Fi/Co', 'Excel Advanced', 'Financial Analysis'] },
            { title: 'Helpdesk Specialist', dept: 'PSS', skills: ['Customer Service', 'Communication', 'Helpdesk'] },
            { title: 'SAP Functional Consultant', dept: 'SAP', skills: ['SAP S/4HANA', 'ABAP Development'] }
        ];
        for (const jd of jdItems) {
            await JobDescription.create({
                jdId: `JD-${Math.random().toString(36).substring(2,7).toUpperCase()}`,
                title: jd.title, department: jd.dept, location: 'Remote',
                requiredSkills: jd.skills, experienceRequired: 5,
                responsibilities: ['Handle process tasks', 'Collaborate with team', 'Report to manager'],
                createdBy: managers[0]._id
            });
        }

        // 6. Settings
        await Settings.create({ key: 'analysis_cycle', value: '2024-Q1', category: 'analysis', description: 'Active analysis cycle' });
        await Settings.create({ key: 'fatigue_threshold', value: 70, category: 'fatigue', description: 'Fatigue risk threshold %' });
        await Settings.create({ key: 'promotion_threshold', value: 85, category: 'fitment', description: 'Fitment % for promotion consideration' });

        // 7. Print Summary
        const counts = await Promise.all([
            User.countDocuments(), Employee.countDocuments(), AnalysisResult.countDocuments(),
            WorkingHours.countDocuments(), PerformanceRecord.countDocuments(), FTEWorkload.countDocuments()
        ]);
        
        console.log('\n========= SEED COMPLETE =========');
        console.log(`Users: ${counts[0]} | Employees: ${counts[1]} | AnalysisResults: ${counts[2]}`);
        console.log(`WorkingHours: ${counts[3]} | PerformanceRecords: ${counts[4]} | FTEWorkloads: ${counts[5]}`);
        console.log('\nCredentials:');
        console.log('  Manager: manager1@optinxt.com / optinxt123');
        console.log('  Employee: sarah.mitchell@optinxt.com / optinxt123');
        console.log('\nOutcome Breakdown:');
        
        const outcomes = {};
        EMPLOYEE_PROFILES.forEach(p => {
            outcomes[p.recType] = (outcomes[p.recType] || 0) + 1;
        });
        Object.entries(outcomes).forEach(([k, v]) => console.log(`  ${k}: ${v} employees`));
        console.log('=================================\n');

        await mongoose.connection.close();
        process.exit(0);

    } catch (err) {
        console.error('Seeding error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
};

seedMega();
