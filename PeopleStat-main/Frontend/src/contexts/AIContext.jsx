import React, { createContext, useContext, useState, useMemo } from "react";
import { employees as centralEmployees, getOverallRisk } from "@/data/mockEmployeeData";

// AI Context for managing chat state across the app
const AIContext = createContext();

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAI must be used within an AIProvider");
  }
  return context;
};

export const AIProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  // Comprehensive Workforce Data Engine - Derived from Central Data
  const workforceData = useMemo(() => {
    const data = {};
    centralEmployees.forEach(e => {
      data[e.name] = {
        id: e.employeeId,
        role: e.position,
        department: e.department,
        fitment: e.scores.fitment,
        fatigue: e.scores.fatigue,
        softSkills: {
          leadership: e.scores.aptitude,
          communication: e.scores.skill,
          teamwork: 80 // Placeholder for specific teamwork metric
        },
        sixBySix: {
          fatigue: e.scores.fatigue > 75 ? "Critical" : e.scores.fatigue > 45 ? "Medium" : "Low",
          productivity: e.scores.productivity > 75 ? "Strong" : "Stable",
          engagement: "High"
        },
        risk: getOverallRisk(e),
        recommendations: [
          e.scores.fatigue > 75 ? "Reduce workload by 20%" : "Continue current path",
          e.scores.fitment < 70 ? "Target for reskilling" : "Mentor others",
          "Schedule monthly performance reviews"
        ],
        skills: [...e.skills.hard, ...e.skills.soft],
        utilization: e.scores.utilization,
        lastReview: "2024-01-15"
      };
    });
    return data;
  }, []);

  // Enhanced AI message processing with employee detection
  const sendMessage = async (message) => {
    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    let aiResponse = "";
    let detectedEmployees = [];
    let queryType = "general";

    // Check for employee name mentions
    const employeeNames = Object.keys(workforceData);
    const mentionedEmployees = employeeNames.filter(name =>
      message.toLowerCase().includes(name.toLowerCase())
    );

    if (mentionedEmployees.length > 0) {
      // Employee-specific query
      queryType = "employee_profile";
      detectedEmployees = mentionedEmployees.map(name => ({
        name,
        ...workforceData[name]
      }));
    } else {
      // General workforce queries
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes("burnout risk") || lowerMessage.includes("fatigue") || lowerMessage.includes("burnout")) {
        queryType = "burnout_risk";
        detectedEmployees = Object.entries(workforceData)
          .filter(([_, data]) => data.fatigue > 70 || data.risk === "High")
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.fatigue - a.fatigue);
      } else if (lowerMessage.includes("reskill") || lowerMessage.includes("skill gap") || lowerMessage.includes("training")) {
        queryType = "reskilling";
        detectedEmployees = Object.entries(workforceData)
          .filter(([_, data]) => data.fitment < 80 || data.softSkills.leadership < 70)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => a.fitment - b.fitment);
      } else if (lowerMessage.includes("underutilized") || lowerMessage.includes("utilization") || lowerMessage.includes("underutil")) {
        queryType = "underutilized";
        detectedEmployees = Object.entries(workforceData)
          .filter(([_, data]) => data.utilization < 70)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => a.utilization - b.utilization);
      } else if (lowerMessage.includes("high risk") || lowerMessage.includes("risk")) {
        queryType = "high_risk";
        detectedEmployees = Object.entries(workforceData)
          .filter(([_, data]) => data.risk === "High")
          .map(([name, data]) => ({ name, ...data }));
      } else if (lowerMessage.includes("top performer") || lowerMessage.includes("high performer")) {
        queryType = "top_performers";
        detectedEmployees = Object.entries(workforceData)
          .filter(([_, data]) => data.fitment > 85 && data.fatigue < 50)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.fitment - a.fitment);
      }
    }

    // Generate response based on query type
    if (queryType === "employee_profile") {
      if (detectedEmployees.length === 1) {
        aiResponse = `**Employee Profile Found**\n\n• **Employee**: ${detectedEmployees[0].name}\n• **Details**: See the profile card below for comprehensive workforce intelligence`;
      } else {
        aiResponse = `**Multiple Employees Found**\n\n• **Count**: ${detectedEmployees.length} employees identified\n• **Details**: Review the profile cards below for individual workforce intelligence`;
      }
    } else if (queryType === "burnout_risk") {
      aiResponse = `**Burnout Risk Assessment**\n\n• **Priority**: High-risk employees identified\n• **Criteria**: Fatigue >70% or High risk classification\n• **Action**: Review employee cards below for detailed fatigue analysis`;
    } else if (queryType === "reskilling") {
      aiResponse = `**Reskilling Opportunities Identified**\n\n• **Focus**: Employees with fitment <80% or leadership <70%\n• **Priority**: Training and development candidates\n• **Details**: See profile cards for specific skill gap analysis`;
    } else if (queryType === "underutilized") {
      aiResponse = `**Underutilization Analysis**\n\n• **Issue**: Employees with utilization <70%\n• **Impact**: Potential productivity gaps\n• **Recommendation**: Consider workload redistribution`;
    } else if (queryType === "high_risk") {
      aiResponse = `**High-Risk Employee Alert**\n\n• **Risk Level**: Critical attention required\n• **Criteria**: High risk classification\n• **Action**: Immediate intervention recommended`;
    } else if (queryType === "top_performers") {
      aiResponse = `**Top Performer Recognition**\n\n• **Criteria**: Fitment >85% and Fatigue <50%\n• **Status**: High-performing team members\n• **Value**: Key contributors to organizational success`;
    } else {
      aiResponse = `**AI Workforce Assistant Ready**\n\nI can help you with workforce intelligence. Try asking about:\n\n• **Employee Profiles**: Mention a specific employee name\n• **Burnout Risk**: "Who is at burnout risk?"\n• **Reskilling Needs**: "Who should be reskilled?"\n• **Utilization Issues**: "Who is underutilized?"\n• **High-Risk Alerts**: "Show me high-risk employees"\n• **Top Performers**: "Who are our top performers?"\n\n**Example**: "Sarah Johnson" or "burnout risk"`;
    }

    const newMessage = {
      id: Date.now(),
      type: "ai",
      content: aiResponse,
      timestamp: new Date(),
      detectedEmployees: detectedEmployees,
      queryType: queryType
    };

    setMessages(prev => [...prev, newMessage]);
    setChatHistory(prev => [...prev, { userMessage: message, aiResponse: newMessage }]);
    setIsLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const value = {
    messages,
    setMessages,
    isLoading,
    chatHistory,
    sendMessage,
    clearChat,
    workforceData
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};