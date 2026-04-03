import mongoose from 'mongoose';

const careerProfileSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  currentPathway: {
    name: String,
    stage: String,
    stages: [String]
  },
  targetRole: {
    title: String,
    requiredSkills: [String],
    competencyThresholds: mongoose.Schema.Types.Mixed
  },
  verifiedSkills: [String],
  computed: {
    careerFitment: Number,
    skillGaps: [String],
    promotionReadiness: Number,
    competencyRadar: {
      communication: Number,
      problemSolving: Number,
      teamwork: Number,
      adaptability: Number,
      productivity: Number
    },
    peerBenchmarks: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

export default mongoose.model('CareerProfile', careerProfileSchema);
