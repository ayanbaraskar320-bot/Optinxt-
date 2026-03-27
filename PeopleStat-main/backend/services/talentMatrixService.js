/**
 * Task 8: 6x6 Talent Matrix Service
 */

export const calculateMatrixPosition = (
  leadershipScore = 0,
  aptitudeScores = {},
  focusScore = 0,
  stressScore = 0,
  workloadScore = 0,
  overtimeRatio = 0
) => {
  // STEP 1: Matrix Performance Score
  const avgAptitude = ((aptitudeScores?.spiritScore || 0) + (aptitudeScores?.purposeScore || 0) + (aptitudeScores?.rewardsScore || 0) + (aptitudeScores?.professionScore || 0)) / 4 || 0;
  const matrixPerformance = (leadershipScore * 0.5) + (avgAptitude * 0.3) + (focusScore * 0.2);

  // STEP 2: Matrix Risk Score
  const matrixRisk = (stressScore * 0.4) + (workloadScore * 0.3) + (overtimeRatio * 0.3);

  // STEP 3 & 4: Normalize to 6 discrete levels (assuming 0-100 scale inputs)
  const getLevel = (score) => {
    if (score <= 20) return 1;
    if (score <= 40) return 2;
    if (score <= 60) return 3;
    if (score <= 80) return 4;
    if (score <= 90) return 5;
    return 6;
  };

  const perfLevel = getLevel(matrixPerformance);
  const riskLevel = getLevel(matrixRisk);

  return {
    performanceLevel: perfLevel,
    riskLevel: riskLevel,
    cellPosition: `P${perfLevel}-R${riskLevel}`
  };
};
