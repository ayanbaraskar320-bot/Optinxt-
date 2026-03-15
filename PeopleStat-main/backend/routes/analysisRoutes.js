import express from 'express';
import { runAnalysis, getAnalysisResults, getEmployeeAnalysis, getAnalysisSummary } from '../controllers/analysisController.js';
import { protect, managerOnly } from '../middleware/auth.js';

const router = express.Router();

// All analysis routes require authentication
router.use(protect);

// POST /api/analysis/run — Trigger analysis (manager only)
router.post('/run', managerOnly, runAnalysis);

// GET /api/analysis/results — Get analysis results with filters
router.get('/results', getAnalysisResults);

// GET /api/analysis/summary — Workforce summary KPIs
router.get('/summary', getAnalysisSummary);

// GET /api/analysis/employee/:id — Get specific employee analysis
router.get('/employee/:id', getEmployeeAnalysis);

export default router;
