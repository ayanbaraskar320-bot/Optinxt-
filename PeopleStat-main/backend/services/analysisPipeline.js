/**
 * Task 11: 5-Stage Data Pipeline
 */

import Employee from '../models/Employee.js';
import FitmentResponse from '../models/FitmentResponse.js';
import WorkingHours from '../models/WorkingHours.js';
import AssessmentResult from '../models/AssessmentResult.js';
import SprintHistory from '../models/SprintHistory.js';
import CareerProfile from '../models/CareerProfile.js';
import GapAnalysisSnapshot from '../models/GapAnalysisSnapshot.js';

import * as fitmentService from './fitmentService.js';
import * as productivityService from './productivityService.js';
import * as fatigueService from './fatigueService.js';
import * as gapAnalysisService from './gapAnalysisService.js';
import * as talentMatrixService from './talentMatrixService.js';
import * as careerService from './careerService.js';

export const runAnalysisPipeline = async (employeeId, cycle = '2024-Q1') => {
  // Stage 1: Ingestion
  const employee = await Employee.findById(employeeId);
  if (!employee) throw new Error('Employee not found');

  const fitmentResponses = await FitmentResponse.findOne({ employeeId, evaluationCycle: cycle }) || { responses: {}, computedScores: {} };
  const workingHours = await WorkingHours.findOne({ employeeId, reportingPeriod: cycle }) || { processHours: {}, generalHours: {}, computed: {} };
  const assessmentResult = await AssessmentResult.findOne({ employeeId }).sort({ assessmentDate: -1 }) || { aptitudeScores: {}, softskillScoresFull: [], computed: {} };
  const sprintHistory = await SprintHistory.findOne({ employeeId, cycle }) || { completedSprintCount: 0, maxExpectedSprints: 12 };
  const careerProfile = await CareerProfile.findOne({ employeeId }) || { currentPathway: {}, targetRole: {}, verifiedSkills: [], computed: {} };

  // Stage 2: Core Score Calculation
  const softskillScores = assessmentResult.softskillScoresFull || [];
  const aptitudeScores = assessmentResult.aptitudeScores || {};
  const completedSprintCount = sprintHistory.completedSprintCount || 0;
  const maxExpectedSprints = sprintHistory.maxExpectedSprints || 12;

  // Avg Aptitude
  const avgAptitude = ((aptitudeScores?.spiritScore || 0) + (aptitudeScores?.purposeScore || 0) + (aptitudeScores?.rewardsScore || 0) + (aptitudeScores?.professionScore || 0)) / 4 || 0;
  
  // Leadership score logic
  const categoryMeans = softskillScores.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s.score);
    return acc;
  }, {});
  const behavioralStats = Object.values(categoryMeans).map(scores => scores.reduce((a, b) => a + b, 0) / scores.length);
  const avgBehavioral = behavioralStats.length > 0 ? (behavioralStats.reduce((a, b) => a + b, 0) / behavioralStats.length) : 0;
  const leadershipScoreValue = avgAptitude + avgBehavioral;

  const performance = (leadershipScoreValue + avgAptitude) / 2;
  
  const focusScores = softskillScores.filter(s => s.category === 'Time Management').map(s => s.score);
  const focusScore = focusScores.length > 0 ? (focusScores.reduce((a, b) => a + b, 0) / focusScores.length) : 0;
  
  const stressRelatedScores = softskillScores.filter(s => ['Adaptability', 'Interpersonal Skills'].includes(s.category)).map(s => s.score);
  const stressResourceScore = stressRelatedScores.length > 0 ? (stressRelatedScores.reduce((a, b) => a + b, 0) / stressRelatedScores.length) : 0;
  
  const workloadScore = (completedSprintCount / maxExpectedSprints) * 100;
  const overtimeRatio = Math.min((workingHours.generalHours?.overtimeHours || 0) / (workingHours.generalHours?.standardHours || 160), 1.0);

  // Stage 3: Run Analysis Engines
  // Gap Analysis
  const gapAnalysis = gapAnalysisService.calculateGapAnalysis(
    leadershipScoreValue,
    aptitudeScores,
    softskillScores,
    completedSprintCount,
    maxExpectedSprints
  );

  // Talent Matrix
  const matrixPosition = talentMatrixService.calculateMatrixPosition(
    leadershipScoreValue,
    aptitudeScores,
    focusScore,
    stressResourceScore,
    workloadScore,
    overtimeRatio
  );

  // Fitment Engine (13-param)
  const fitmentEngineResult = fitmentService.calculateFitmentScore(
    employee,
    fitmentResponses.responses,
    assessmentResult,
    sprintHistory,
    careerProfile
  );

  // Fatigue Risk
  const fatigueResult = fatigueService.calculateFatigueRisk(
    workingHours.generalHours?.overtimeHours || 0,
    workingHours.generalHours?.standardHours || 160,
    workingHours.generalHours?.weekendWork || 'No',
    workingHours.generalHours?.multipleRoles || 'No',
    workingHours.generalHours?.deadlinePressure || 'Low'
  );

  // Career Readiness
  const careerReadiness = careerService.calculateCareerReadiness(
    careerProfile.verifiedSkills || [],
    careerProfile.targetRole?.requiredSkills || [],
    leadershipScoreValue,
    aptitudeScores,
    softskillScores,
    completedSprintCount
  );

  // Update Snapshots and Databases
  await GapAnalysisSnapshot.findOneAndUpdate(
    { employeeId, evaluationCycle: cycle },
    {
      ...gapAnalysis,
      talentMatrix: matrixPosition,
      fitmentScoreAlt: fitmentService.calculateFitmentScoreAlt(aptitudeScores, leadershipScoreValue)
    },
    { upsert: true, new: true }
  );

  // Update workingHours computed
  await WorkingHours.findOneAndUpdate(
    { employeeId, reportingPeriod: cycle },
    {
      'computed.utilizationRate': ((workingHours.totalProcessHours || 0) / (workingHours.generalHours?.standardHours || 160)) * 100,
      'computed.fatigueRisk': fatigueResult.fatigueRisk,
      'computed.fatigueRiskScore': fatigueResult.fatigueRisk,
      'computed.fatigueTier': fatigueResult.tier,
      'computed.fatigueRiskLevel': fatigueResult.tier,
      'computed.overtimeRatio': fatigueResult.overtimeRatio
    }
  );

  // Update SprintHistory
  const productivity = productivityService.calculateProductivity(completedSprintCount, maxExpectedSprints);
  await SprintHistory.findOneAndUpdate(
    { employeeId, cycle },
    {
      'computed.productivityScore': productivity.productivityScore,
      'computed.productivityTier': productivity.tier,
      'computed.workloadScore': workloadScore
    }
  );

  // Update CareerProfile
  await CareerProfile.findOneAndUpdate(
    { employeeId },
    {
      'computed.careerFitment': careerReadiness.checklistCompletion,
      'computed.skillGaps': careerReadiness.skillGaps,
      'computed.promotionReadiness': careerReadiness.promotionReadiness,
      'computed.competencyRadar': careerReadiness.radar
    }
  );

  // Update Employee (for simple dashboard view)
  await Employee.findByIdAndUpdate(employeeId, {
    productivity: workloadScore,
    fitmentScore: fitmentEngineResult.fitmentScore,
    fatigueScore: fatigueResult.fatigueRisk,
    communication: careerReadiness.radar.communication,
    problemSolving: careerReadiness.radar.problemSolving,
    teamwork: careerReadiness.radar.teamwork,
    adaptability: careerReadiness.radar.adaptability,
    updatedAt: new Date()
  });

  return {
    employeeId,
    cycle,
    fitment: fitmentEngineResult,
    gapAnalysis,
    matrixPosition,
    fatigue: fatigueResult,
    careerReadiness
  };
};
