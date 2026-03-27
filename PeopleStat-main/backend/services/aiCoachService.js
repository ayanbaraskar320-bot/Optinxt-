/**
 * Task 10: AI Coach Context Assembly
 */

import { runAnalysisPipeline } from './analysisPipeline.js';
import Employee from '../models/Employee.js';
import AssessmentResult from '../models/AssessmentResult.js';
import SprintHistory from '../models/SprintHistory.js';
import CareerProfile from '../models/CareerProfile.js';
import GapAnalysisSnapshot from '../models/GapAnalysisSnapshot.js';

export const assembleCoachContext = async (employeeId, cycle = '2024-Q1') => {
  const employee = await Employee.findById(employeeId);
  if (!employee) return null;

  // Ensure latest analysis is run
  const analysisResult = await runAnalysisPipeline(employeeId, cycle);

  const assessment = await AssessmentResult.findOne({ employeeId }).sort({ assessmentDate: -1 });
  const careerProfile = await CareerProfile.findOne({ employeeId });
  const snapshot = await GapAnalysisSnapshot.findOne({ employeeId, evaluationCycle: cycle });
  const sprintHistory = await SprintHistory.find({ employeeId }).sort({ createdAt: -1 }).limit(3);

  const context = {
    employeeName: employee.name,
    role: employee.position,
    fitmentScore: analysisResult.fitment.fitmentScore,
    fitmentClassification: analysisResult.fitment.classification,
    competencyRadar: analysisResult.careerReadiness.radar,
    promotionReadiness: analysisResult.careerReadiness.promotionReadiness,
    promotionChecklist: {
      completed: careerProfile?.verifiedSkills || [],
      missing: analysisResult.careerReadiness.skillGaps || []
    },
    peerBenchmarks: {
      // Mocked percentiles for context
      technicalProficiency: 75,
      softSkillHealth: 82,
      sprintProductivity: 68,
      leadership: 90
    },
    sprintTrend: sprintHistory.map(s => s.completedSprintCount),
    fatigueRisk: analysisResult.fatigue.fatigueRisk,
    gapAnalysis: {
      gapCount: snapshot?.gaps.gapCount || 0,
      severity: snapshot?.severity.label || 'Low',
      performanceGap: snapshot?.gaps.performanceGap || 0,
      focusGap: snapshot?.gaps.focusGap || 0,
      stressGap: snapshot?.gaps.stressGap || 0,
      workloadGap: snapshot?.gaps.workloadGap || 0
    },
    matrixPosition: snapshot?.talentMatrix.cellPosition || 'N/A',
    skillGaps: analysisResult.careerReadiness.skillGaps
  };

  return context;
};
