import mongoose from 'mongoose';

const workingHoursSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  reportingPeriod: { type: String, required: true }, // e.g., '2024-03'
  processHours: {
    invoicing: { type: Number, default: 0 },
    collections: { type: Number, default: 0 },
    payments: { type: Number, default: 0 },
    r2r: { type: Number, default: 0 },
    taxation: { type: Number, default: 0 },
    treasury: { type: Number, default: 0 },
    meetings: { type: Number, default: 0 },
    training: { type: Number, default: 0 },
    others: { type: Number, default: 0 }
  },
  generalHours: {
    standardHours: { type: Number, default: 160 },
    overtimeHours: { type: Number, default: 0 },
    weekendWork: { type: String, enum: ['Yes', 'No'], default: 'No' },
    multipleRoles: { type: String, enum: ['Yes', 'No'], default: 'No' },
    deadlinePressure: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' }
  },
  computed: {
    utilizationRate: Number,
    fatigueRisk: Number,
    fatigueRiskScore: Number, // alias/redundant for audit
    fatigueTier: String,
    fatigueRiskLevel: String, // from audit
    totalProcessHours: Number,
    overtimeRatio: Number
  }
}, { timestamps: true });

workingHoursSchema.index({ employeeId: 1, reportingPeriod: 1 }, { unique: true });

export default mongoose.model('WorkingHours', workingHoursSchema);
