/**
 * Task 2: Fitment Analysis Engine (13-Parameter Model)
 * Implementation of the role fitment scoring logic.
 */

/**
 * Main Fitment Formula
 * @param {Object} employee - Employee document
 * @param {Object} responses - 13 parameter responses
 * @param {Object} assessment - Assessment results (aptitude/soft skills)
 * @param {Object} sprintHistory - Sprint productivity data
 * @param {Object} careerProfile - Career profile data
 * @param {Object} benchmarkCTC - Benchmark CTC for the role
 * @returns {Object} { fitmentScore, classification, parameters }
 */
export const calculateFitmentScore = (
  employee,
  responses = {},
  assessment = {},
  sprintHistory = {},
  careerProfile = {},
  benchmarkCTC = 500000 // Default or from settings
) => {
  const aptitude = assessment?.aptitudeScores || { spiritScore: 0, purposeScore: 0, rewardsScore: 0, professionScore: 0 };
  const softskillScores = assessment?.softskillScoresFull || [];
  const completedSprintCount = sprintHistory?.completedSprintCount || 0;
  const currentCTC = employee?.salary || 0;

  // 7. Leadership Score (composite input for parameter 7)
  const behavioralCategoryMeans = softskillScores.length > 0
    ? Object.values(
        softskillScores.reduce((acc, s) => {
          if (!acc[s.category]) acc[s.category] = [];
          acc[s.category].push(s.score);
          return acc;
        }, {})
      ).map(scores => scores.reduce((a, b) => a + b, 0) / scores.length)
    : [0];
  
  const avgAptitude = ((aptitude.spiritScore || 0) + (aptitude.purposeScore || 0) + (aptitude.rewardsScore || 0) + (aptitude.professionScore || 0)) / 4;
  const avgBehavioral = behavioralCategoryMeans.length > 0 ? behavioralCategoryMeans.reduce((a, b) => a + b, 0) / behavioralCategoryMeans.length : 0;
  const leadershipRaw = (avgAptitude + avgBehavioral) || 0;
  
  // Mapping helper
  const mapScore = (val) => {
    if (typeof val === 'number') return val >= 15 ? 20 : 10;
    const highValues = ['high', 'strong', 'yes', 'exceptional', 'ready', 'preferred', 'fit', '5', '4'];
    return highValues.includes(String(val).toLowerCase()) ? 20 : 10;
  };

  // CTC Efficiency scoring
  const ctcRatio = benchmarkCTC > 0 ? currentCTC / benchmarkCTC : 1.0;
  let ctcScore;
  if (ctcRatio <= 1.0) ctcScore = 20;
  else if (ctcRatio <= 1.15) ctcScore = 15;
  else ctcScore = 10;

  // Parameters Configuration (Name, Weight, Score)
  const params = [
    { name: 'PMS Rating', weight: 0.05, score: mapScore(responses.pmsRating) },
    { name: 'Complexity of Work', weight: 0.10, score: mapScore(responses.complexityOfWork || responses.complexity) },
    { name: 'Innovation / Tech Savvy', weight: 0.10, score: (aptitude.spiritScore >= 70 || mapScore(responses.innovationTechSavvy)) ? 20 : 10 },
    { name: 'Customer Orientation', weight: 0.10, score: mapScore(responses.customerOrientation) },
    { name: 'Team Collaboration', weight: 0.08, score: (aptitude.purposeScore >= 70 || mapScore(responses.teamCollaboration)) ? 20 : 10 },
    { name: 'Communication', weight: 0.08, score: mapScore(responses.communication) },
    { name: 'Leadership Competence', weight: 0.08, score: leadershipRaw >= 75 ? 20 : (leadershipRaw >= 40 ? 15 : 10) },
    { name: 'Location Preference', weight: 0.05, score: mapScore(responses.locationPreference) },
    { name: 'Total Experience', weight: 0.05, score: (employee.experience_years || 0) >= 5 ? 20 : 10 },
    { name: 'CTC Efficiency', weight: 0.08, score: ctcScore },
    { name: 'Multiplexer', weight: 0.07, score: completedSprintCount >= 6 ? 20 : 10 },
    { name: 'Self-Motivation', weight: 0.08, score: mapScore(responses.selfMotivation) },
    { name: 'Change Readiness', weight: 0.08, score: mapScore(responses.changeReadiness) },
  ];

  // Validate weights sum to 1.00
  const weightSum = params.reduce((sum, p) => sum + p.weight, 0);
  if (Math.abs(weightSum - 1.0) > 0.001) {
    console.warn('Fitment weights alignment warning: Sum =', weightSum);
  }

  const fitmentScore = params.reduce((sum, p) => sum + (p.weight * p.score), 0);

  // Classification
  let classification;
  if (fitmentScore >= 20) classification = 'FIT';
  else if (fitmentScore >= 11) classification = 'TRAIN TO FIT';
  else classification = 'UNFIT';

  return {
    fitmentScore: parseFloat(fitmentScore.toFixed(2)),
    classification,
    parameters: params,
    leadershipScoreRaw: leadershipRaw
  };
};

/**
 * Alternate fitment (used in Gap Analysis module only)
 */
export const calculateFitmentScoreAlt = (aptitudeScores = {}, leadershipScore = 0) => {
  const avgAptitude = (aptitudeScores.spiritScore + aptitudeScores.purposeScore + aptitudeScores.rewardsScore + aptitudeScores.professionScore) / 4 || 0;
  return (avgAptitude * 0.6) + (leadershipScore * 0.4);
};
