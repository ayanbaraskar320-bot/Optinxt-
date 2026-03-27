/**
 * Task 6: Fatigue & Workload Risk Model
 */

const DEADLINE_PRESSURE_WEIGHTS = {
  'Low': 0.2,
  'Medium': 0.5,
  'High': 0.8,
  'Critical': 1.0
};

export const calculateFatigueRisk = (
  overtimeHours = 0,
  standardHours = 160,
  weekendWork = 'No',
  multipleRoles = 'No',
  deadlinePressure = 'Low'
) => {
  const overtimeRatio = Math.min(overtimeHours / standardHours, 1.0);
  const weekendFlag = weekendWork === 'Yes' ? 1 : 0;
  const multiRoleFlag = multipleRoles === 'Yes' ? 1 : 0;
  const deadlineWeight = DEADLINE_PRESSURE_WEIGHTS[deadlinePressure] || 0.2;

  const fatigueRisk = (0.35 * overtimeRatio) + (0.25 * weekendFlag) +
                    (0.20 * multiRoleFlag) + (0.20 * deadlineWeight);

  const fatigueRiskPercent = fatigueRisk * 100;

  let tier;
  if (fatigueRiskPercent <= 20) tier = 'Low';
  else if (fatigueRiskPercent <= 45) tier = 'Moderate';
  else if (fatigueRiskPercent <= 70) tier = 'High';
  else tier = 'Critical';

  // Independent flag: OvertimeRatio > 0.5 is always flagged
  const isHighOvertimeFlag = overtimeRatio > 0.5;

  return {
    fatigueRisk: parseFloat(fatigueRiskPercent.toFixed(2)),
    tier,
    isHighOvertimeFlag,
    overtimeRatio
  };
};
