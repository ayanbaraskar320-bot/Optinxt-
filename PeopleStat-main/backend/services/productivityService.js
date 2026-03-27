/**
 * Task 5: Sprint-Based Productivity Model
 */

export const calculateProductivity = (completedSprintCount = 0, maxExpectedSprints = 12) => {
  const productivityScore = (completedSprintCount / maxExpectedSprints) * 100;
  
  let tier;
  if (completedSprintCount === 0) tier = 'Inactive';
  else if (completedSprintCount <= 2) tier = 'Low Activity';
  else if (completedSprintCount <= 5) tier = 'Moderate';
  else if (completedSprintCount <= 9) tier = 'High Productivity';
  else tier = 'Top Performer';

  return { productivityScore: Math.min(productivityScore, 100), tier };
};

export const calculateUtilizationRate = (actualWorkHours = 0, standardHours = 160) => {
  return (actualWorkHours / standardHours) * 100;
};

export const calculateProcessAllocation = (processHours = {}) => {
  const totalProcessHours = Object.values(processHours).reduce((sum, h) => sum + h, 0);
  if (totalProcessHours === 0) return {};

  const processNames = Object.keys(processHours);
  const allocation = {};

  processNames.forEach(key => {
    allocation[key] = (processHours[key] / totalProcessHours) * 100;
  });

  return { allocation, totalProcessHours };
};
