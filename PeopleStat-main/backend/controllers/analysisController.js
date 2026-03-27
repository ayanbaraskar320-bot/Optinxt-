/**
 * Analysis Controller — Triggers and retrieves workforce analytics
 */
import Employee from '../models/Employee.js';
import PerformanceRecord from '../models/PerformanceRecord.js';
import FTEWorkload from '../models/FTEWorkload.js';
import AnalysisResult from '../models/AnalysisResult.js';
import { calculateProductivity, calculateUtilization } from '../services/metricsEngine.js';
import { calculateFitmentScore } from '../services/fitmentEngine.js';
import { calculateFatigueScore } from '../services/fatigueEngine.js';
import { generateAutomationRecommendation, categorizeTalent } from '../services/recommendationEngine.js';
import { runAnalysisPipeline } from '../services/analysisPipeline.js';
import GapAnalysisSnapshot from '../models/GapAnalysisSnapshot.js';

/**
 * POST /api/analysis/run
 * Trigger workforce analysis for all employees (or specific employee by query param)
 */
export const runAnalysis = async (req, res) => {
  try {
    const { employeeId, cycle = '2024-Q1' } = req.query;
    
    const query = employeeId ? { _id: employeeId } : {};
    const employees = await Employee.find(query);

    if (employees.length === 0) {
      return res.status(404).json({ success: false, error: 'No employees found to analyze' });
    }

    const results = [];
    let errors = [];

    for (const employee of employees) {
      try {
        const analysisResult = await runAnalysisPipeline(employee._id, cycle);
        results.push(analysisResult);
      } catch (empErr) {
        errors.push({ employeeId: employee._id, error: empErr.message });
      }
    }

    res.json({
      success: true,
      analyzedCount: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Analysis run error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/analysis/results
 * Get all analysis results with optional filters
 */
export const getAnalysisResults = async (req, res) => {
  try {
    const { process_area, band, recommendation_type, page = 1, limit = 50 } = req.query;

    // Build filter from employee attributes
    const employeeFilter = {};
    if (process_area) employeeFilter.process_area = process_area;
    if (band) employeeFilter.band = band;

    let employeeIds = null;
    if (Object.keys(employeeFilter).length > 0) {
      const filteredEmployees = await Employee.find(employeeFilter).select('_id');
      employeeIds = filteredEmployees.map(e => e._id);
    }

    const analysisFilter = {};
    if (employeeIds) analysisFilter.employee_id = { $in: employeeIds };
    if (recommendation_type) analysisFilter.recommendation_type = recommendation_type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await AnalysisResult.countDocuments(analysisFilter);

    const results = await AnalysisResult.find(analysisFilter)
      .populate('employee_id', 'name email band process_area sub_process department position currentRole experience_years skills')
      .sort({ analysis_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: results,
    });
  } catch (error) {
    console.error('Analysis results error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/analysis/employee/:id
 * Get analysis for a specific employee
 */
export const getEmployeeAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const analysis = await AnalysisResult.findOne({ employee_id: id }).sort({ analysis_date: -1 });
    const recentPerformance = await PerformanceRecord.find({ employee_id: id })
      .sort({ record_date: -1 })
      .limit(10);

    // Get talent category
    const talentCategory = analysis ? categorizeTalent({
      productivity: analysis.productivity_score,
      fitmentScore: analysis.fitment_score,
    }) : null;

    res.json({
      success: true,
      employee,
      analysis,
      talentCategory,
      recentPerformance,
    });
  } catch (error) {
    console.error('Employee analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/analysis/summary
 * Workforce summary KPIs
 */
export const getAnalysisSummary = async (req, res) => {
  try {
    const employees = await Employee.find();
    const analysisResults = await AnalysisResult.find();
    const fteWorkloads = await FTEWorkload.find();

    const totalEmployees = employees.length;

    if (totalEmployees === 0) {
      return res.json({
        success: true,
        summary: {
          totalEmployees: 0,
          avgFitment: 0,
          avgProductivity: 0,
          avgUtilization: 0,
          burnoutRiskPercent: 0,
          automationSavings: 0,
          highPerformers: 0,
          underutilized: 0,
          promotionCandidates: 0,
          roleMisalignment: 0,
        },
      });
    }

    // Calculate averages from analysis results
    const avgFitment = analysisResults.length > 0
      ? Math.round(analysisResults.reduce((s, r) => s + r.fitment_score, 0) / analysisResults.length)
      : 0;
    const avgProductivity = analysisResults.length > 0
      ? Math.round(analysisResults.reduce((s, r) => s + r.productivity_score, 0) / analysisResults.length)
      : 0;
    const avgUtilization = analysisResults.length > 0
      ? Math.round(analysisResults.reduce((s, r) => s + r.utilization_score, 0) / analysisResults.length)
      : 0;
    const avgFatigue = analysisResults.length > 0
      ? Math.round(analysisResults.reduce((s, r) => s + r.fatigue_score, 0) / analysisResults.length)
      : 0;

    // Count by recommendation type
    const burnoutCount = analysisResults.filter(r => r.recommendation_type === 'burnout_risk').length;
    const highPerformers = analysisResults.filter(r => r.recommendation_type === 'high_performer').length;
    const underutilized = analysisResults.filter(r => r.recommendation_type === 'underutilized').length;
    const promotionCandidates = analysisResults.filter(r => r.recommendation_type === 'promotion_candidate').length;
    const roleMisalignment = analysisResults.filter(r => r.recommendation_type === 'role_misalignment').length;
    const overloaded = analysisResults.filter(r => r.recommendation_type === 'overloaded').length;

    // Automation savings from FTE workloads
    let totalAutomationSavings = 0;
    const automationOpportunities = [];
    for (const fw of fteWorkloads) {
      const autoRec = generateAutomationRecommendation(fw);
      if (autoRec.isCandidate) {
        totalAutomationSavings += autoRec.estimatedSavings;
        automationOpportunities.push({
          process: fw.process_name,
          subProcess: fw.sub_process,
          savings: autoRec.estimatedSavings,
          fteReduction: autoRec.fteReduction,
        });
      }
    }

    // Distribution by process area
    const processDistribution = {};
    employees.forEach(e => {
      const area = e.process_area || 'Unassigned';
      processDistribution[area] = (processDistribution[area] || 0) + 1;
    });

    // Distribution by band
    const bandDistribution = {};
    employees.forEach(e => {
      const band = e.band || 'Unknown';
      bandDistribution[band] = (bandDistribution[band] || 0) + 1;
    });

    // Distribution for 6x6 Matrix using new collections
    const matrixStats = await GapAnalysisSnapshot.aggregate([
      { $group: {
        _id: { perfLevel: '$talentMatrix.performanceLevel', riskLevel: '$talentMatrix.riskLevel' },
        count: { $sum: 1 }
      }},
      { $project: {
        x: '$_id.perfLevel',
        y: '$_id.riskLevel',
        count: 1,
        _id: 0
      }}
    ]);

    const matrixDistribution = matrixStats || [];

    // Workforce Metrics (Task 3)
    const fitCount = employees.filter(e => e.fitmentScore >= 20).length;
    const misalignedCount = employees.filter(e => e.fitmentScore < 20).length;
    const costAtRisk = employees.filter(e => e.fitmentScore < 20).reduce((sum, e) => sum + (e.salary || 0), 0);

    res.json({
      success: true,
      summary: {
        totalEmployees,
        avgFitment: avgFitment || 0,
        avgProductivity: avgProductivity || 0,
        avgUtilization: avgUtilization || 0,
        avgFatigue: avgFatigue || 0,
        burnoutRiskPercent: totalEmployees > 0 ? Math.round((burnoutCount / totalEmployees) * 100) : 0,
        automationSavings: totalAutomationSavings || 0,
        automationSavingsFormatted: totalAutomationSavings >= 100000
          ? `$${(totalAutomationSavings / 100000).toFixed(1)}L`
          : `$${(totalAutomationSavings || 0).toLocaleString()}`,
        highPerformers: highPerformers || 0,
        underutilized: underutilized || 0,
        overloaded: overloaded || 0,
        promotionCandidates: promotionCandidates || 0,
        roleMisalignment: roleMisalignment || 0,
        processDistribution: processDistribution || {},
        bandDistribution: bandDistribution || {},
        matrixDistribution: matrixDistribution || [],
        automationOpportunities: automationOpportunities || [],
        workforceFitmentPercent: totalEmployees > 0 ? (fitCount / totalEmployees) * 100 : 0,
        misalignedCount,
        costAtRisk,
        lastUpdated: new Date()
      },
    });
  } catch (error) {
    console.error('Analysis summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
