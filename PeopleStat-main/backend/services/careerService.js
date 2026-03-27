/**
 * Task 4 & 9 & 10: Soft Skills, Career Growth, AI Coach
 */

export const calculateSoftSkillHealth = (softskillScores = []) => {
  const categoryGroups = softskillScores.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s.score);
    return acc;
  }, {});

  const categoryMeans = Object.entries(categoryGroups).map(([name, scores]) => {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    return { name, mean };
  });

  const healthIndex = categoryMeans.length > 0
    ? categoryMeans.reduce((sum, cat) => sum + cat.mean, 0) / categoryMeans.length
    : 0;

  return { healthIndex, categoryMeans };
};

export const calculateCareerReadiness = (
  employeeSkills = [],
  targetSkills = [],
  leadershipScore = 0,
  aptitudeScores = {},
  softskillScores = [],
  completedSprintCount = 0
) => {
  const matchedSkills = employeeSkills.filter(s => targetSkills.includes(s));
  const checklistCompletion = targetSkills.length > 0 ? (matchedSkills.length / targetSkills.length) : 0;

  // Competency Radar (5 axes, each 0-100)
  const getCategoryMean = (catName) => {
    const scores = softskillScores.filter(s => s.category === catName).map(s => s.score);
    return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  };

  const radar = {
    communication: getCategoryMean('Communication'),
    problemSolving: getCategoryMean('Problem Solving'),
    teamwork: getCategoryMean('Teamwork'),
    adaptability: getCategoryMean('Adaptability'),
    productivity: (completedSprintCount / 12) * 100
  };

  // Simplified Area check
  const radarFill = Object.values(radar).reduce((a, b) => a + b, 0) / 500;

  // Promotion Readiness
  const peerDelta = 0.1; // Placeholder
  const promotionReadiness = (0.40 * checklistCompletion * 100) + (0.35 * radarFill * 100) + (0.25 * peerDelta * 100);

  return {
    checklistCompletion: checklistCompletion * 100,
    radar,
    promotionReadiness: Math.min(promotionReadiness, 100),
    skillGaps: targetSkills.filter(s => !employeeSkills.includes(s))
  };
};
