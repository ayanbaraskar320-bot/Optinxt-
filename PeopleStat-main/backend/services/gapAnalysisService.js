/**
 * Task 7: Gap Analysis Engine
 */

export const calculateGapAnalysis = (
  leadershipScore = 0,
  aptitudeScores = {},
  softskillScores = [],
  completedSprintCount = 0,
  maxExpectedSprints = 12
) => {
  // STEP 1: Core input scores
  const avgAptitude = (aptitudeScores.spiritScore + aptitudeScores.purposeScore + aptitudeScores.rewardsScore + aptitudeScores.professionScore) / 4 || 0;
  
  const performance = (leadershipScore + avgAptitude) / 2;

  // FocusScore: avg subcategories of 'Time Management'
  const timeManagementScores = softskillScores
    .filter(s => s.category === 'Time Management')
    .map(s => s.score);
  const focusScore = timeManagementScores.length > 0
    ? timeManagementScores.reduce((a, b) => a + b, 0) / timeManagementScores.length
    : 0;

  // StressScore: Adaptability + Interpersonal subScores (Inverse metric: Higher = Worse)
  const stressRelatedScores = softskillScores
    .filter(s => s.category === 'Adaptability' || s.category === 'Interpersonal Skills')
    .map(s => s.score);
  const stressScore = stressRelatedScores.length > 0
    ? stressRelatedScores.reduce((a, b) => a + b, 0) / stressRelatedScores.length
    : 0;

  const workloadScore = (completedSprintCount / maxExpectedSprints) * 100;

  // STEP 2: Gap Detection against thresholds
  let performanceGap = Math.max(75 - performance, 0);
  let focusGap = Math.max(80 - focusScore, 0);
  let stressGap = Math.max(stressScore - 50, 0);
  let workloadGap = Math.max(workloadScore - 85, 0);

  // STEP 3: Gap Count
  let gapsDetected = 0;
  if (performance < 75) gapsDetected++;
  if (focusScore < 80) gapsDetected++;
  if (stressScore > 50) gapsDetected++;
  if (workloadScore > 85) gapsDetected++;

  // STEP 4: Gap Severity Score
  const gapSeverityScore = (performanceGap * 0.3) + (focusGap * 0.3) + (stressGap * 0.4);

  // STEP 5: Severity Classification
  let label;
  if (gapSeverityScore < 20) label = 'OK';
  else if (gapSeverityScore < 50) label = 'Needs Improvement';
  else label = 'Serious Issue';

  return {
    scores: { performance, focus: focusScore, stress: stressScore, workload: workloadScore },
    gaps: { performanceGap, focusGap, stressGap, workloadGap, gapCount: gapsDetected },
    severity: { score: gapSeverityScore, label }
  };
};
