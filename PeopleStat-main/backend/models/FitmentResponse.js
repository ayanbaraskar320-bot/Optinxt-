import mongoose from 'mongoose';

const fitmentResponsesSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  evaluationCycle: { type: String, required: true }, // e.g., '2024-Q1'
  responses: {
    pmsRating: { type: Number, default: 0 },
    complexityOfWork: { type: Number, default: 0 },
    innovationTechSavvy: { type: Number, default: 0 },
    customerOrientation: { type: Number, default: 0 },
    teamCollaboration: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    leadershipCompetence: { type: Number, default: 0 }, // parameter 7
    locationPreference: { type: Number, default: 0 },
    totalExperience: { type: Number, default: 0 },
    ctcEfficiency: { type: Number, default: 0 },
    multiplexer: { type: Number, default: 0 },
    selfMotivation: { type: Number, default: 0 },
    changeReadiness: { type: Number, default: 0 },
  },
  computedScores: {
    fitmentScore: Number,
    classification: { type: String, enum: ['FIT', 'TRAIN TO FIT', 'UNFIT'] },
    weightedScore: Number,
    rawScores: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

fitmentResponsesSchema.index({ employeeId: 1, evaluationCycle: 1 }, { unique: true });
fitmentResponsesSchema.index({ 'computedScores.classification': 1 });

export default mongoose.model('FitmentResponse', fitmentResponsesSchema);
