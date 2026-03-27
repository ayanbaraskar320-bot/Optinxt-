import mongoose from 'mongoose';

const gapAnalysisSnapshotSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  evaluationCycle: { type: String, required: true },
  scores: {
    performance: Number,
    focus: Number,
    stress: Number,
    workload: Number
  },
  gaps: {
    performanceGap: Number,
    focusGap: Number,
    stressGap: Number,
    workloadGap: Number,
    gapCount: Number
  },
  severity: {
    score: Number,
    label: { type: String, enum: ['OK', 'Needs Improvement', 'Serious Issue'] }
  },
  talentMatrix: {
    performanceLevel: Number,
    riskLevel: Number,
    cellPosition: String // e.g. 'P4-R2'
  },
  fitmentScoreAlt: Number
}, { timestamps: true });

gapAnalysisSnapshotSchema.index({ employeeId: 1, evaluationCycle: 1 }, { unique: true });
gapAnalysisSnapshotSchema.index({ 'severity.label': 1 });
gapAnalysisSnapshotSchema.index({ 'talentMatrix.cellPosition': 1 });

export default mongoose.model('GapAnalysisSnapshot', gapAnalysisSnapshotSchema);
