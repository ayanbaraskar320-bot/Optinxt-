import mongoose from 'mongoose';

const careerProfileSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  currentPathway: {
    name: String,
    stage: String
  },
  targetRole: {
    title: String,
    requiredSkills: [String]
  },
  verifiedSkills: [String],
  computed: {
    careerFitment: Number,
    promotionReadiness: Number,
    radarAxes: {
      communication: Number,
      problemSolving: Number,
      teamwork: Number,
      adaptability: Number,
      productivity: Number
    }
  }
}, { timestamps: true });

export default mongoose.model('CareerProfile', careerProfileSchema);
