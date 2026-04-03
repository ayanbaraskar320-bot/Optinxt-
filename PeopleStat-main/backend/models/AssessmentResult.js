import mongoose from 'mongoose';

const assessmentResultsSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  assessmentDate: { type: Date, default: Date.now },
  aptitudeScores: {
    spiritScore: { type: Number, default: 0 },
    purposeScore: { type: Number, default: 0 },
    rewardsScore: { type: Number, default: 0 },
    professionScore: { type: Number, default: 0 }
  },
  softskillScoresFull: [{
    category: String,
    categoryMean: Number,
    categoryWeight: Number,
    subCategory: String,
    score: Number, // 0-10 or 0-100 normalized
    median: Number,
    tag: String
  }],
  computed: {
    healthIndex: Number,
    leadershipScore: Number
  }
}, { timestamps: true });

assessmentResultsSchema.index({ employeeId: 1, assessmentDate: -1 });

export default mongoose.model('AssessmentResult', assessmentResultsSchema);
