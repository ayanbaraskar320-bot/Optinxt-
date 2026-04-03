/**
 * Task 4 & 9 & 10: Soft Skills, Career Growth, AI Coach
 */

const DEFAULT_CATEGORY_WEIGHTS = {
  'Communication': 0.15,
  'Problem Solving': 0.15,
  'Teamwork': 0.10,
  'Adaptability': 0.15,
  'Attention to Detail': 0.10,
  'Time Management': 0.10,
  'Interpersonal Skills': 0.15,
  'Leadership': 0.10
};

export const calculateSoftSkillHealth = (softskillScores = []) => {
  const categoryGroups = softskillScores.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s.score);
    return acc;
  }, {});

  const categoryMeans = Object.entries(categoryGroups).map(([name, scores]) => {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const weight = DEFAULT_CATEGORY_WEIGHTS[name] || (1 / Object.keys(categoryGroups).length);
    return { name, mean, weight };
  });

  // Calculate Weighted Health Index
  let healthIndex = 0;
  let totalWeight = 0;
  categoryMeans.forEach(cat => {
    healthIndex += (cat.mean * cat.weight);
    totalWeight += cat.weight;
  });

  if (totalWeight > 0) healthIndex = healthIndex / totalWeight;

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
    productivity: Math.min((completedSprintCount / 12) * 100, 100)
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
