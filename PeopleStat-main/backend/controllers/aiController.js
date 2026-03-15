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
    const { message, mode } = req.body;
    const isCareerCoach = mode === 'career_coach';

    // If API key is available, use LLM
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    console.log(`AI Assistant Triggered (${mode || 'workforce'}). Using Key Type:`, process.env.GROQ_API_KEY ? 'GROQ' : 'OPENAI');

    if (apiKey) {
      const isGroq = !!process.env.GROQ_API_KEY;
      const openai = new OpenAI({ 
        apiKey: apiKey,
        baseURL: isGroq ? "https://api.groq.com/openai/v1" : undefined
      });

      // POWERFUL CONTEXT FETCHING (Top 100 analysis results to answer general questions)
      const words = message.replace(/[?!.]/g, '').split(' ').filter(w => w.length > 2);
      const nameRegex = words.length > 0 ? new RegExp(words.join('|'), 'i') : null;
      
      const [mentionedEmployee, generalAnalyses] = await Promise.all([
        nameRegex ? Employee.findOne({ name: { $regex: nameRegex } }) : null,
        AnalysisResult.find().sort({ analysis_date: -1 }).limit(100).populate('employee_id', 'name band process_area position skills')
      ]);

      console.log(`Context: Found ${generalAnalyses.length} analyses. Specific employee match: ${mentionedEmployee ? 'YES ('+mentionedEmployee.name+')' : 'NO'}`);

      // Build a rich text context for the AI
      let dataContext = "WORKFORCE DATA SNAPSHOT (Real-time):\n";
      generalAnalyses.forEach((a, i) => {
        dataContext += `${i+1}. ${a.employee_id?.name || 'Unknown'}: Role=${a.employee_id?.position || 'N/A'}, Fitment=${a.fitment_score}%, Productivity=${a.productivity_score}%, Fatigue=${a.fatigue_score}%, Status=${a.recommendation_type}\n`;
      });

      if (mentionedEmployee) {
        const analysis = await AnalysisResult.findOne({ employee_id: mentionedEmployee._id }).sort({ analysis_date: -1 });
        if (analysis) {
          dataContext += `\nCRITICAL FOCUS: DATA FOR ${mentionedEmployee.name.toUpperCase()}:\n`;
          dataContext += `- Role: ${mentionedEmployee.position}, Band: ${mentionedEmployee.band}, Process: ${mentionedEmployee.process_area}\n`;
          dataContext += `- Precise Scores: Fitment: ${analysis.fitment_score}/100, Performance: ${analysis.productivity_score}%, Fatigue: ${analysis.fatigue_score}%\n`;
          dataContext += `- System Recommendation: ${analysis.recommendation}\n`;
          dataContext += `- Skill Breakdown: ${JSON.stringify(analysis.details)}\n`;
        }
      }

      // Default Workforce prompt
      let systemPrompt = `You are the OptiNXt Workforce Analyst. 
Use the PROVIDED DATA below to answer questions about burnout, reskilling, underutilization, and individual performance.
DO NOT use general knowledge. ONLY use the names and scores from the DATA CONTEXT.

ANSWER FORMAT:
- Be specific. Mention names and exact percentages.
- For individual analysis (like Sarah Johnson), provide a detailed Fitment & Risk assessment.
- For "Who is..." questions, list the top 5 relevant employees from the data.

DATA CONTEXT:
${dataContext}`;

      // Career Coach prompt
      if (isCareerCoach) {
        systemPrompt = `You are the OptiNXt AI Career Coach. 
An employee is talking to you about their career growth, fitment, and performance.
Use the PROVIDED DATA below to give them personalized career advice, upskilling suggestions, and performance improvement tips.

GUIDELINES:
- Be encouraging, professional, and data-driven.
- Refer to their specific scores (Fitment, Productivity, Fatigue).
- If Fitment is low, suggest specific skills to learn based on their role.
- If Fatigue is high, suggest workload management.
- Frame everything around growth and professional development.

DATA CONTEXT:
${dataContext}`;
      }

      try {
        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            { role: 'user', content: message },
          ],
          model: 'llama-3.1-8b-instant', // Stable Groq model
          temperature: 0.2, // Slightly higher for coach
          max_tokens: 800
        });

        console.log('AI successfully generated response from data.');
        return res.json({ success: true, data: { reply: completion.choices[0].message.content } });
      } catch (apiError) {
        console.error('Groq API Error Detail:', apiError);
        return res.json({ success: true, data: { reply: "The AI Intelligence engine is momentarily unavailable. Please check your internet connection and ensure your Groq API key is valid." } });
      }
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
