import mongoose from 'mongoose';

const sprintHistorySchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  cycle: { type: String, required: true }, // e.g., 'Cycle-1'
  completedSprintCount: { type: Number, default: 0 },
  maxExpectedSprints: { type: Number, default: 12 },
  computed: {
    productivityScore: Number,
    productivityTier: String,
    workloadScore: Number
  }
}, { timestamps: true });

sprintHistorySchema.index({ employeeId: 1, cycle: 1 }, { unique: true });

export default mongoose.model('SprintHistory', sprintHistorySchema);
