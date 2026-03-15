/**
 * AI Controller — ESM version
 * Handles AI assistants and fitment analysis triggers
 */
import Employee from '../models/Employee.js';
import AnalysisResult from '../models/AnalysisResult.js';
import { OpenAI } from 'openai';

export const runFitment = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });

    // Get the latest analysis result for this employee
    const analysis = await AnalysisResult.findOne({ employee_id: employee._id }).sort({ analysis_date: -1 });

    if (!analysis) {
      return res.status(404).json({ success: false, error: 'No analysis found. Run workforce analysis first.' });
    }

    res.json({
      success: true,
      data: {
        employee: employee.name,
        analysis: {
          fitmentScore: analysis.fitment_score,
          productivity: analysis.productivity_score,
          utilization: analysis.utilization_score,
          fatigue: analysis.fatigue_score,
          recommendation: analysis.recommendation,
          recommendationType: analysis.recommendation_type,
          details: analysis.details,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const chatAssistant = async (req, res) => {
  try {
    const { message } = req.body;

    // If OpenAI API key is available, use GPT
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const employees = await Employee.find().limit(20);
      const analyses = await AnalysisResult.find().limit(20).populate('employee_id', 'name band process_area');

      const context = analyses.map(a => ({
        name: a.employee_id?.name,
        band: a.employee_id?.band,
        process: a.employee_id?.process_area,
        fitment: a.fitment_score,
        productivity: a.productivity_score,
        fatigue: a.fatigue_score,
        recommendation: a.recommendation_type,
      }));

      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an AI Workforce Intelligence Assistant for an enterprise platform analyzing employee performance across F&A, PSS, and SAP processes. 
Current workforce context (sample): ${JSON.stringify(context.slice(0, 10))}
Total workforce: ${employees.length} employees. 
Help managers make data-driven decisions about workforce optimization, role fitment, fatigue risk, and automation opportunities.`,
          },
          { role: 'user', content: message },
        ],
        model: 'gpt-3.5-turbo',
      });
      return res.json({ success: true, data: { reply: completion.choices[0].message.content } });
    }

    // Fallback demo mode
    const employees = await Employee.find();
    const analyses = await AnalysisResult.find();
    const lowerMessage = message.toLowerCase();

    let reply = "I'm your AI Workforce Intelligence Assistant (Demo Mode). Provide an OPENAI_API_KEY for full conversational analysis.";

    if (lowerMessage.includes('burnout') || lowerMessage.includes('fatigue')) {
      const burnoutCount = analyses.filter(a => a.recommendation_type === 'burnout_risk').length;
      reply = `Based on current analysis, ${burnoutCount} employees are flagged for burnout risk across the organization. Key indicators include overtime hours, workload intensity, and performance decline trends.`;
    } else if (lowerMessage.includes('promotion') || lowerMessage.includes('candidate')) {
      const promoCount = analyses.filter(a => a.recommendation_type === 'promotion_candidate').length;
      reply = `Currently ${promoCount} employees are identified as promotion candidates based on fitment scores above 85/100.`;
    } else if (lowerMessage.includes('underutilized') || lowerMessage.includes('utilization')) {
      const underCount = analyses.filter(a => a.recommendation_type === 'underutilized').length;
      reply = `${underCount} employees show utilization below 50%, suggesting they could take on additional process responsibilities or cross-training.`;
    } else if (lowerMessage.includes('automation') || lowerMessage.includes('saving')) {
      reply = `Automation potential analysis identifies repetitive, rule-based processes in F&A (Invoice Posting, Payment Processing) and PSS (DMS/Billdesk) as prime candidates for RPA implementation.`;
    } else if (lowerMessage.includes('summary') || lowerMessage.includes('overview')) {
      reply = `Workforce Overview: ${employees.length} employees across F&A, PSS, and SAP. Average fitment: ${analyses.length > 0 ? Math.round(analyses.reduce((s, a) => s + a.fitment_score, 0) / analyses.length) : 'N/A'}. Use the dashboard for detailed breakdowns by process area and band hierarchy.`;
    }

    res.json({ success: true, data: { reply } });
  } catch (err) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ success: false, error: 'AI Processing Error.' });
  }
};
