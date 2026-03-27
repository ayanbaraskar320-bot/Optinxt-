import mongoose from 'mongoose';

const fitmentResponsesSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  evaluationCycle: { type: String, required: true }, // e.g., '2024-Q1'
  responses: {
    pmsRating: { type: Number, default: 0 },
    innovation: { type: Number, default: 0 },
    customerOrientation: { type: Number, default: 0 },
    collaboration: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    leadership: { type: Number, default: 0 },
    locationPreference: { type: Number, default: 0 },
    changeReadiness: { type: Number, default: 0 },
    // others can be added as needed
  },
  computedScores: {
    fitmentScore: Number,
    classification: { type: String, enum: ['FIT', 'TRAIN TO FIT', 'UNFIT'] }
  }
}, { timestamps: true });

fitmentResponsesSchema.index({ employeeId: 1, evaluationCycle: 1 }, { unique: true });
fitmentResponsesSchema.index({ 'computedScores.classification': 1 });

export default mongoose.model('FitmentResponse', fitmentResponsesSchema);
