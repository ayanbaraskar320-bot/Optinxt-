import { calculateFitmentScore } from './services/fitmentService.js';
import { calculateSoftSkillHealth, calculateCareerReadiness } from './services/careerService.js';
import { calculateGapAnalysis } from './services/gapAnalysisService.js';

const mockEmployee = {
  name: 'Test Employee',
  experience_years: 6,
  salary: 450000,
  band: 'D1'
};

const mockResponses = {
  pmsRating: 'High',
  complexityOfWork: 'High',
  customerOrientation: 'High',
  selfMotivation: 'Strong',
  changeReadiness: 'Ready',
  locationPreference: 'Preferred'
};

const mockAptitude = {
  spiritScore: 80,
  purposeScore: 75,
  rewardsScore: 70,
  professionScore: 85
};

const mockSoftSkills = [
  { category: 'Communication', score: 85 },
  { category: 'Problem Solving', score: 80 },
  { category: 'Teamwork', score: 90 },
  { category: 'Adaptability', score: 75 },
  { category: 'Time Management', score: 80 }
];

const mockSprintHistory = {
  completedSprintCount: 8,
  maxExpectedSprints: 12
};

console.log('--- Algorithm Verification ---');

// 1. Fitment Score
const fitment = calculateFitmentScore(mockEmployee, mockResponses, { aptitudeScores: mockAptitude, softskillScoresFull: mockSoftSkills }, mockSprintHistory);
console.log('Fitment:', JSON.stringify(fitment, null, 2));

// 2. Soft Skill Health
const health = calculateSoftSkillHealth(mockSoftSkills);
console.log('Health:', JSON.stringify(health, null, 2));

// 3. Gap Analysis
const gap = calculateGapAnalysis(80, mockAptitude, mockSoftSkills, 8, 12);
console.log('Gap:', JSON.stringify(gap, null, 2));

// 4. Career Readiness
const career = calculateCareerReadiness(['skill1'], ['skill1', 'skill2'], 80, mockAptitude, mockSoftSkills, 8);
console.log('Career:', JSON.stringify(career, null, 2));

console.log('--- Verification Complete ---');
